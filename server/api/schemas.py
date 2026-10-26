"""
Pydantic schemas for REST API endpoints.
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List


class HealthResponse(BaseModel):
    status: str = "ok"
    model_loaded: bool
    model_path: str
    sample_rate: int
    active_websockets: int
    version: str = "1.0.0"


class ModelInfoResponse(BaseModel):
    model_name: str
    model_path: str
    file_size_bytes: int
    sample_rate: int
    window_length: int
    hop_size: int
    state_size: int
    metadata: Dict[str, Any]


class DownloadRequest(BaseModel):
    destination_dir: Optional[str] = "models/pretuned/dpdfnet"
    force: bool = False


class DownloadResponse(BaseModel):
    status: str
    model_path: str
    file_size_bytes: int
    message: str
