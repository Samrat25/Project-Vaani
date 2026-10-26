"""
Configuration for Project Vaani Audio Streaming Server.
"""

import os
from pathlib import Path
from pydantic import BaseModel
from typing import Optional, List


class ServerConfig(BaseModel):
    # Server network
    host: str = os.getenv("VAANI_HOST", "0.0.0.0")
    port: int = int(os.getenv("VAANI_PORT", "8000"))
    reload: bool = os.getenv("VAANI_RELOAD", "false").lower() == "true"

    # Model resolution (DPDFNet-2 is 2.5x faster than DPDFNet-8, providing real-time streaming on cloud CPUs)
    model_name: str = os.getenv("VAANI_MODEL", "dpdfnet2_48khz_hr")
    model_filename: str = os.getenv("VAANI_MODEL_FILE", "dpdfnet2_48khz_hr.onnx")
    pretuned_dir: str = os.getenv("VAANI_MODEL_DIR", "models/pretuned/dpdfnet")
    download_url: str = os.getenv(
        "VAANI_MODEL_URL",
        "https://huggingface.co/Ceva-IP/DPDFNet/resolve/main/onnx/dpdfnet2_48khz_hr.onnx",
    )
    
    # Audio specifications
    model_sample_rate: int = 48000
    default_client_sample_rate: int = 16000
    window_length: int = 960  # 20ms @ 48kHz
    hop_size: int = 480       # 10ms @ 48kHz
    
    # Attenuation limit in dB (None for full suppression, or e.g. 0.0 to 120.0)
    default_attn_limit_db: Optional[float] = None
    
    # Streaming options
    default_audio_format: str = "int16"  # "int16" (PCM 16-bit) or "float32"
    send_telemetry_with_audio: bool = True
    
    # Threading for ONNX session (1 thread prevents context switching thrashing on containerized cloud CPUs)
    intra_op_num_threads: int = 1
    inter_op_num_threads: int = 1


config = ServerConfig()
