"""
REST API routes for Project Vaani Server.
"""

import io
import time
import soundfile as sf
import numpy as np
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import Response

from server.api.schemas import HealthResponse, ModelInfoResponse, DownloadRequest, DownloadResponse
from server.core.engine import get_engine, StreamSessionState
from server.core.downloader import find_model, download_model
from server.websocket.connection import manager
from server.config import config

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Returns server and DPDFNet-8 model status."""
    try:
        engine = get_engine()
        return HealthResponse(
            status="ok",
            model_loaded=True,
            model_path=str(engine.model_path),
            sample_rate=engine.sample_rate,
            active_websockets=manager.total_active,
        )
    except Exception as exc:
        return HealthResponse(
            status="degraded",
            model_loaded=False,
            model_path="not_loaded",
            sample_rate=0,
            active_websockets=0,
        )


@router.get("/api/models", response_model=ModelInfoResponse)
async def get_model_info():
    """Returns metadata and parameters of the loaded DPDFNet-8 ONNX model."""
    engine = get_engine()
    p = Path(engine.model_path)
    return ModelInfoResponse(
        model_name=config.model_name,
        model_path=str(engine.model_path),
        file_size_bytes=p.stat().st_size if p.exists() else 0,
        sample_rate=engine.sample_rate,
        window_length=engine.win_len,
        hop_size=engine.hop_size,
        state_size=engine.state_size,
        metadata={k: v for k, v in engine.meta.items() if len(str(v)) < 150},
    )


@router.post("/api/download", response_model=DownloadResponse)
async def trigger_download(req: DownloadRequest):
    """Downloads or verifies the DPDFNet-8 ONNX model in the specified pretuned directory."""
    dest = req.destination_dir or config.pretuned_dir
    try:
        model_path = download_model(destination_dir=dest, force=req.force)
        return DownloadResponse(
            status="success",
            model_path=str(model_path),
            file_size_bytes=model_path.stat().st_size,
            message="DPDFNet-8 ONNX model verified and ready.",
        )
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Download failed: {err}")


@router.post("/api/enhance")
async def enhance_file(
    file: UploadFile = File(...),
    attn_limit_db: Optional[float] = Form(None),
    normalize: bool = Form(False),
):
    """
    Enhance an uploaded WAV/FLAC/OGG audio file using the DPDFNet-8 engine.
    Returns the enhanced audio as a WAV file.
    """
    try:
        content = await file.read()
        audio_data, sr = sf.read(io.BytesIO(content), dtype="float32")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid audio file: {exc}")

    engine = get_engine()
    session = StreamSessionState(
        model=engine,
        client_sr=sr,
        attn_limit_db=attn_limit_db,
        normalize=normalize,
    )

    # Process in streaming chunks (e.g. 100ms chunks)
    chunk_size = int(sr * 0.1)
    enhanced_parts = []

    for start in range(0, len(audio_data), chunk_size):
        chunk = audio_data[start : start + chunk_size]
        out_chunk, _ = session.process_chunk(chunk, client_sr=sr)
        if len(out_chunk) > 0:
            enhanced_parts.append(out_chunk)

    # Flush remaining
    flushed, _ = session.flush(client_sr=sr)
    if len(flushed) > 0:
        enhanced_parts.append(flushed)

    enhanced_full = np.concatenate(enhanced_parts) if len(enhanced_parts) > 1 else (enhanced_parts[0] if enhanced_parts else audio_data)

    # Ensure length matches original
    if len(enhanced_full) > len(audio_data):
        enhanced_full = enhanced_full[: len(audio_data)]

    out_io = io.BytesIO()
    sf.write(out_io, enhanced_full, samplerate=sr, format="WAV", subtype="PCM_16")
    out_io.seek(0)

    filename = f"enhanced_{file.filename or 'audio.wav'}"
    return Response(
        content=out_io.read(),
        media_type="audio/wav",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
