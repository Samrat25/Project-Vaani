"""
WebSocket Streaming Client Test Script for Project Vaani.
Streams audio chunks to ws://127.0.0.1:8000/ws/stream and saves the received enhanced audio.
"""

import os
import sys
import time
import json
import asyncio
import numpy as np
import soundfile as sf
import websockets
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from server.core.audio_utils import float32_to_pcm16, pcm16_to_float32


def generate_synthetic_combat_audio(duration_sec: float = 3.0, sr: int = 16000) -> np.ndarray:
    """Generate synthetic combat test audio: 300-3000Hz speech-like tones + heavy combat rumble."""
    t = np.linspace(0, duration_sec, int(duration_sec * sr), endpoint=False)
    
    # Simulated voice (formants)
    voice = 0.3 * np.sin(2 * np.pi * 250 * t) + 0.2 * np.sin(2 * np.pi * 800 * t) + 0.15 * np.sin(2 * np.pi * 2200 * t)
    
    # Modulate voice to simulate speech rhythm
    envelope = np.clip(np.sin(2 * np.pi * 2.5 * t) ** 2, 0.1, 1.0)
    speech = voice * envelope
    
    # Heavy combat noise (low-frequency rumble + blast impulses)
    rumble = 0.4 * np.sin(2 * np.pi * 45 * t) + 0.3 * np.sin(2 * np.pi * 90 * t)
    noise = np.random.normal(0, 0.25, len(t))
    combat_noise = rumble + noise
    
    mixed = speech + combat_noise
    # Normalize to avoid hard clipping
    mixed = mixed / (np.max(np.abs(mixed)) + 1e-6) * 0.9
    return mixed.astype(np.float32)


async def run_client_stream(
    server_url: str = "ws://127.0.0.1:8000/ws/stream",
    input_wav_path: str = None,
    output_wav_path: str = "samples/server_test_enhanced.wav",
    chunk_duration_ms: float = 50.0,
    sample_rate: int = 16000,
    audio_format: str = "int16",
):
    print(f"\n[Client] Connecting to WebSocket: {server_url}")

    # 1. Prepare audio data
    if input_wav_path and os.path.exists(input_wav_path):
        print(f"[Client] Loading audio from file: {input_wav_path}")
        audio_in, sr = sf.read(input_wav_path, dtype="float32")
        if audio_in.ndim > 1:
            audio_in = np.mean(audio_in, axis=-1)
        sample_rate = sr
    else:
        print("[Client] Generating synthetic combat audio (3.0s)...")
        audio_in = generate_synthetic_combat_audio(duration_sec=3.0, sr=sample_rate)
        os.makedirs("samples", exist_ok=True)
        sf.write("samples/server_test_input.wav", audio_in, sample_rate)
        print("  -> Saved reference input to samples/server_test_input.wav")

    # Chunk parameters
    chunk_size = int(sample_rate * (chunk_duration_ms / 1000.0))
    total_samples = len(audio_in)
    received_audio_chunks = []
    telemetry_events = []
    rtt_latencies = []

    async with websockets.connect(server_url, max_size=10_000_000) as ws:
        # Handshake
        handshake_raw = await ws.recv()
        handshake = json.loads(handshake_raw)
        print(f"[Client] Handshake acknowledged: session_id={handshake.get('session_id')}, model={handshake.get('model')}")

        # Send configuration
        config_msg = {
            "type": "config",
            "sample_rate": sample_rate,
            "format": audio_format,
            "attn_limit_db": None,
        }
        await ws.send(json.dumps(config_msg))
        config_ack = json.loads(await ws.recv())
        print(f"[Client] Config acknowledged: SR={config_ack.get('sample_rate')}, format={config_ack.get('audio_format')}")

        # Task to continuously receive responses (audio and telemetry)
        stop_receiving = asyncio.Event()

        async def receiver():
            try:
                while not stop_receiving.is_set():
                    try:
                        msg = await asyncio.wait_for(ws.recv(), timeout=1.0)
                    except asyncio.TimeoutError:
                        continue

                    if isinstance(msg, bytes):
                        # Binary enhanced audio buffer
                        chunk_arr = pcm16_to_float32(msg) if audio_format == "int16" else np.frombuffer(msg, dtype=np.float32)
                        received_audio_chunks.append(chunk_arr)
                    elif isinstance(msg, str):
                        # JSON message
                        data = json.loads(msg)
                        if data.get("type") == "telemetry":
                            telemetry_events.append(data.get("metrics", {}))
                        elif data.get("type") == "flush_ack":
                            print(f"[Client] Flush completed by server: {data.get('flushed_samples')} samples drained.")
                            break
            except asyncio.CancelledError:
                pass

        receiver_task = asyncio.create_task(receiver())

        # Stream audio chunks with simulated real-time pacing
        print(f"[Client] Streaming {len(audio_in)} samples in chunks of {chunk_size} ({chunk_duration_ms} ms)...")
        stream_start = time.perf_counter()

        for start_idx in range(0, total_samples, chunk_size):
            chunk = audio_in[start_idx : start_idx + chunk_size]
            t0 = time.perf_counter()

            # Encode to binary
            payload = float32_to_pcm16(chunk) if audio_format == "int16" else chunk.astype(np.float32).tobytes()
            await ws.send(payload)

            # Measure transmit RTT pacing
            await asyncio.sleep(chunk_duration_ms / 1000.0 * 0.8)

        print("[Client] All input chunks sent. Requesting final flush...")
        await ws.send(json.dumps({"type": "flush"}))

        # Wait for receiver to finish
        try:
            await asyncio.wait_for(receiver_task, timeout=5.0)
        except asyncio.TimeoutError:
            print("[Client] Receiver timeout reached, concluding stream.")
            receiver_task.cancel()

        total_time = time.perf_counter() - stream_start

    # Assemble enhanced audio
    if received_audio_chunks:
        enhanced_audio = np.concatenate(received_audio_chunks)
    else:
        enhanced_audio = np.zeros(0, dtype=np.float32)

    os.makedirs(os.path.dirname(output_wav_path) or ".", exist_ok=True)
    sf.write(output_wav_path, enhanced_audio, sample_rate)

    print("\n" + "=" * 60)
    print("           STREAMING CLIENT RESULTS")
    print("=" * 60)
    print(f"Total Sent Samples:     {total_samples:,} ({total_samples / sample_rate:.2f} s)")
    print(f"Total Received Samples: {len(enhanced_audio):,} ({len(enhanced_audio) / sample_rate:.2f} s)")
    print(f"Elapsed Clock Time:     {total_time:.2f} s")
    print(f"Real-Time Factor (RTF): {total_time / (total_samples / sample_rate):.3f}")
    if telemetry_events:
        avg_gain = np.mean([t.get("suppression_gain_db", 0) for t in telemetry_events])
        avg_latency = np.mean([t.get("latency_ms", 0) for t in telemetry_events])
        print(f"Avg Suppression Gain:   {avg_gain:.1f} dB")
        print(f"Avg Processing Latency: {avg_latency:.2f} ms / frame")
    print(f"Enhanced output saved:  {output_wav_path}")
    print("=" * 60 + "\n")
    return output_wav_path


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Vaani WebSocket Audio Streaming Client")
    parser.add_argument("--url", default="ws://127.0.0.1:8000/ws/stream", help="WebSocket server URL")
    parser.add_argument("--input-wav", default=None, help="Input WAV file to stream (optional)")
    parser.add_argument("--output-wav", default="samples/server_test_enhanced.wav", help="Output enhanced WAV destination")
    parser.add_argument("--chunk-ms", type=float, default=50.0, help="Chunk duration in ms")
    parser.add_argument("--format", default="int16", choices=["int16", "float32"], help="Audio format")
    args = parser.parse_args()

    asyncio.run(run_client_stream(
        server_url=args.url,
        input_wav_path=args.input_wav,
        output_wav_path=args.output_wav,
        chunk_duration_ms=args.chunk_ms,
        audio_format=args.format,
    ))
