"""
Project Vaani - DPDFNet-8 Real-Time Combat Speech Enhancement Server.
Provides WebSocket streaming layer for audio buffers and REST endpoints.
"""

import sys
import logging
from contextlib import asynccontextmanager
import uvicorn
from pathlib import Path
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from server.config import config
from server.core.downloader import download_model
from server.core.engine import get_engine
from server.api.routes import router as api_router
from server.websocket.handler import handle_websocket_stream

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("vaani.server")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup & shutdown events."""
    logger.info("Initializing Project Vaani Streaming Server...")
    print("=" * 65)
    print("      PROJECT VAANI - COMBAT SPEECH ENHANCEMENT SERVER")
    print("      Model: DPDFNet-8 (48 kHz High-Resolution ONNX)")
    print("=" * 65)

    # 1. Verify / download model into pretuned directory
    model_path = download_model(destination_dir=config.pretuned_dir)
    print(f"[x] Model loaded from: {model_path}")

    # 2. Warm up engine and ONNX session
    engine = get_engine()
    print(f"[x] ONNX session ready (Sample Rate: {engine.sample_rate} Hz, Frame: {engine.win_len} samples)")
    print(f"[x] WebSocket streaming endpoint: ws://{config.host}:{config.port}/ws/stream")
    print(f"[x] Live Waveform Web App:        http://localhost:{config.port}/")
    print(f"[x] Health endpoint:              http://{config.host}:{config.port}/health")
    print("=" * 65)

    yield

    logger.info("Shutting down Project Vaani Streaming Server...")


app = FastAPI(
    title="Project Vaani - DPDFNet-8 Speech Enhancement Server",
    description="Real-Time Combat Speech Enhancement via DPDFNet-8 ONNX and WebSocket Streaming",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for web frontend (e.g. Next.js on port 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include REST routes
app.include_router(api_router)

# Mount static web app directory
STATIC_DIR = Path(__file__).resolve().parent / "static"
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/")
@app.get("/live")
async def serve_live_webapp():
    """Serve the Project Vaani live waveform web application."""
    index_file = STATIC_DIR / "index.html"
    if index_file.is_file():
        return FileResponse(str(index_file))
    return {"status": "ok", "message": "Project Vaani server is active. Static files not found."}


# WebSocket streaming routes
@app.websocket("/ws/stream")
async def websocket_stream_endpoint(websocket: WebSocket):
    """Primary WebSocket audio streaming endpoint."""
    await handle_websocket_stream(websocket)


@app.websocket("/ws")
async def websocket_alias_endpoint(websocket: WebSocket):
    """Alias for convenience."""
    await handle_websocket_stream(websocket)


if __name__ == "__main__":
    uvicorn.run(
        "server.main:app",
        host=config.host,
        port=config.port,
        reload=config.reload,
        log_level="info",
    )
