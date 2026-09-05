"""
WebSocket Streaming Layer Handler.
Handles real-time duplex streaming of audio buffers and control commands over WebSockets.
"""

import json
import time
import logging
from fastapi import WebSocket, WebSocketDisconnect

from server.websocket.connection import manager, ClientSession
from server.core.audio_utils import bytes_to_float32, float32_to_bytes
from server.config import config

logger = logging.getLogger("vaani.websocket.handler")


async def handle_websocket_stream(websocket: WebSocket):
    """
    Main WebSocket streaming loop.
    Accepts client connection, receives audio buffer chunks, enhances via DPDFNet-8,
    and returns processed audio buffers in real-time.
    """
    client: ClientSession = await manager.connect(websocket)
    session_id = client.session_id
    stream_state = client.stream_state

    # Send initial welcome & handshake metadata
    handshake = {
        "type": "handshake",
        "session_id": session_id,
        "model": config.model_name,
        "model_sample_rate": config.model_sample_rate,
        "default_sample_rate": stream_state.client_sr,
        "audio_format": stream_state.audio_format,
        "status": "ready",
    }
    await websocket.send_text(json.dumps(handshake))

    try:
        while True:
            message = await websocket.receive()

            # 1. Binary Audio Buffer Received
            if "bytes" in message and message["bytes"]:
                raw_bytes = message["bytes"]
                client.bytes_received += len(raw_bytes)
                client.chunks_received += 1

                # Decode binary buffer to float32 mono
                try:
                    raw_audio = bytes_to_float32(raw_bytes, audio_format=stream_state.audio_format)
                except Exception as err:
                    err_msg = {"type": "error", "message": f"Audio decode error: {err}"}
                    await websocket.send_text(json.dumps(err_msg))
                    continue

                # Process chunk through DPDFNet-8 streaming pipeline
                enhanced_audio, telemetry = stream_state.process_chunk(raw_audio)

                # Return enhanced binary audio buffer if frames were emitted
                if len(enhanced_audio) > 0:
                    out_bytes = float32_to_bytes(enhanced_audio, audio_format=stream_state.audio_format)
                    client.bytes_sent += len(out_bytes)
                    await websocket.send_bytes(out_bytes)

                    # Send telemetry event if enabled
                    if config.send_telemetry_with_audio:
                        telemetry_msg = {
                            "type": "telemetry",
                            "session_id": session_id,
                            "metrics": telemetry,
                            "stats": {
                                "chunks": client.chunks_received,
                                "bytes_in": client.bytes_received,
                                "bytes_out": client.bytes_sent,
                            }
                        }
                        await websocket.send_text(json.dumps(telemetry_msg))

            # 2. JSON Control / Configuration Message Received
            elif "text" in message and message["text"]:
                try:
                    payload = json.loads(message["text"])
                    msg_type = payload.get("type", "").lower()
                except Exception:
                    msg_type = ""
                    payload = {}

                if msg_type == "config":
                    new_sr = payload.get("sample_rate")
                    new_fmt = payload.get("format") or payload.get("audio_format")
                    attn_limit = payload.get("attn_limit_db")
                    norm = payload.get("normalize")

                    if new_sr is not None:
                        stream_state.client_sr = int(new_sr)
                    if new_fmt is not None:
                        stream_state.audio_format = str(new_fmt).lower()
                    if "attn_limit_db" in payload:
                        stream_state.attn_limit_db = float(attn_limit) if attn_limit is not None else None
                    if norm is not None:
                        stream_state.normalize = bool(norm)

                    # Reset stream state upon format/rate change
                    stream_state.reset()

                    response = {
                        "type": "config_ack",
                        "session_id": session_id,
                        "sample_rate": stream_state.client_sr,
                        "audio_format": stream_state.audio_format,
                        "attn_limit_db": stream_state.attn_limit_db,
                        "normalize": stream_state.normalize,
                        "status": "configured"
                    }
                    await websocket.send_text(json.dumps(response))

                elif msg_type == "flush":
                    # Drain remaining buffered audio
                    flushed_audio, telemetry = stream_state.flush()
                    if len(flushed_audio) > 0:
                        out_bytes = float32_to_bytes(flushed_audio, audio_format=stream_state.audio_format)
                        client.bytes_sent += len(out_bytes)
                        await websocket.send_bytes(out_bytes)

                    flush_ack = {
                        "type": "flush_ack",
                        "session_id": session_id,
                        "flushed_samples": len(flushed_audio),
                        "telemetry": telemetry,
                    }
                    await websocket.send_text(json.dumps(flush_ack))

                elif msg_type == "reset":
                    stream_state.reset()
                    await websocket.send_text(json.dumps({
                        "type": "reset_ack",
                        "session_id": session_id,
                        "status": "reset_complete"
                    }))

                elif msg_type == "ping":
                    await websocket.send_text(json.dumps({
                        "type": "pong",
                        "session_id": session_id,
                        "timestamp": time.time()
                    }))

                elif msg_type == "get_stats":
                    await websocket.send_text(json.dumps({
                        "type": "stats",
                        "session_id": session_id,
                        "chunks_received": client.chunks_received,
                        "bytes_received": client.bytes_received,
                        "bytes_sent": client.bytes_sent,
                        "total_frames": stream_state.total_frames_processed,
                        "last_latency_ms": stream_state.last_latency_ms,
                    }))

                else:
                    await websocket.send_text(json.dumps({
                        "type": "unknown_command",
                        "received": payload
                    }))

    except (WebSocketDisconnect, RuntimeError):
        logger.info("WebSocket disconnected for session_id=%s", session_id)
    except Exception as exc:
        logger.error("Error in websocket session %s: %s", session_id, exc, exc_info=True)
    finally:
        manager.disconnect(session_id)
