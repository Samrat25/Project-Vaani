"""
WebSocket Connection Manager.
Tracks active WebSocket clients, session states, and telemetry.
"""

import uuid
import logging
from typing import Dict, Optional
from fastapi import WebSocket

from server.core.engine import get_engine, StreamSessionState
from server.config import config

logger = logging.getLogger("vaani.websocket.connection")


class ClientSession:
    def __init__(self, websocket: WebSocket, session_id: str):
        self.websocket = websocket
        self.session_id = session_id
        self.engine = get_engine()
        self.stream_state = StreamSessionState(
            model=self.engine,
            client_sr=config.default_client_sample_rate,
            audio_format=config.default_audio_format,
            attn_limit_db=config.default_attn_limit_db,
        )
        self.bytes_received: int = 0
        self.bytes_sent: int = 0
        self.chunks_received: int = 0


class ConnectionManager:
    def __init__(self):
        self.active_sessions: Dict[str, ClientSession] = {}

    async def connect(self, websocket: WebSocket) -> ClientSession:
        await websocket.accept()
        session_id = str(uuid.uuid4())
        session = ClientSession(websocket, session_id)
        self.active_sessions[session_id] = session
        logger.info("Client connected: session_id=%s (Active: %d)", session_id, len(self.active_sessions))
        return session

    def disconnect(self, session_id: str):
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]
            logger.info("Client disconnected: session_id=%s (Active: %d)", session_id, len(self.active_sessions))

    def get_session(self, session_id: str) -> Optional[ClientSession]:
        return self.active_sessions.get(session_id)

    @property
    def total_active(self) -> int:
        return len(self.active_sessions)


manager = ConnectionManager()
