"""
DPDFNet-8 Audio Enhancement Engine.
Implements the CEVA DPDFNet-8 (48 kHz HR) stateful ONNX streaming inference pipeline,
Vorbis STFT/ISTFT overlap-add synthesis, and session-isolated streaming states.
"""

import time
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any
import numpy as np
import onnxruntime as ort

from server.core.audio_utils import (
    vorbis_window,
    to_mono,
    resample_audio,
    compute_telemetry,
)
from server.core.downloader import find_model, download_model
from server.config import config

logger = logging.getLogger("vaani.engine")


class DPDFNetModel:
    """Singleton-style loader and wrapper for the DPDFNet-8 ONNX model."""

    def __init__(self, model_path: Optional[str] = None):
        self.model_path = self._resolve_model(model_path)
        self.session: ort.InferenceSession = self._init_session(self.model_path)
        self.meta: Dict[str, str] = self.session.get_modelmeta().custom_metadata_map

        # Metadata specs
        self.sample_rate = int(self.meta.get("sample_rate", config.model_sample_rate))
        self.win_len = int(self.meta.get("window_length", config.window_length))
        self.hop_size = int(self.meta.get("hop_length", config.hop_size))
        self.freq_bins = int(self.meta.get("freq_bins", self.win_len // 2 + 1))

        # Windows
        self.window = vorbis_window(self.win_len)

        # Initial hidden state initialization
        self.state_size = int(self.meta.get("state_size", 90228))
        self.erb_norm_state_size = int(self.meta.get("erb_norm_state_size", 481))
        self.spec_norm_state_size = int(self.meta.get("spec_norm_state_size", 96))

        erb_init = np.array([float(x) for x in self.meta["erb_norm_init"].split(",")], dtype=np.float32)
        spec_init = np.array([float(x) for x in self.meta["spec_norm_init"].split(",")], dtype=np.float32)

        self.init_state = np.zeros(self.state_size, dtype=np.float32)
        self.init_state[0:self.erb_norm_state_size] = erb_init
        self.init_state[self.erb_norm_state_size:self.erb_norm_state_size + self.spec_norm_state_size] = spec_init

        # Input & Output tensor names
        input_names = [i.name for i in self.session.get_inputs()]
        output_names = [o.name for o in self.session.get_outputs()]
        self.in_spec_name = input_names[0]   # "spec"
        self.in_state_name = input_names[1]  # "state_in"
        self.out_spec_name = output_names[0] # "spec_e"
        self.out_state_name = output_names[1]# "state_out"

        logger.info(
            "DPDFNetModel successfully initialized from: %s (SR: %d Hz, Window: %d, Hop: %d, State: %d floats)",
            self.model_path, self.sample_rate, self.win_len, self.hop_size, self.state_size
        )

    def _resolve_model(self, path: Optional[str]) -> Path:
        if path and Path(path).is_file():
            return Path(path).resolve()
        found = find_model(config.model_filename)
        if found:
            return found
        logger.warning("DPDFNet model not found locally. Triggering automatic download...")
        return download_model(destination_dir=config.pretuned_dir, model_filename=config.model_filename)

    def _init_session(self, path: Path) -> ort.InferenceSession:
        opts = ort.SessionOptions()
        opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        opts.intra_op_num_threads = config.intra_op_num_threads
        opts.inter_op_num_threads = config.inter_op_num_threads
        providers = ["CPUExecutionProvider"]
        return ort.InferenceSession(str(path), sess_options=opts, providers=providers)


class StreamSessionState:
    """
    Per-client isolated streaming state.
    Preserves recurrent RNN hidden state and handles window overlap-add continuously.
    """

    def __init__(
        self,
        model: DPDFNetModel,
        client_sr: int = 16000,
        audio_format: str = "int16",
        attn_limit_db: Optional[float] = None,
        normalize: bool = False,
    ):
        self.model = model
        self.client_sr = client_sr
        self.audio_format = audio_format
        self.attn_limit_db = attn_limit_db
        self.normalize = normalize

        # Buffers
        self.state: np.ndarray = self.model.init_state.copy()
        self.in_buf: np.ndarray = np.zeros(0, dtype=np.float32)
        self.out_buf: np.ndarray = np.zeros(self.model.win_len, dtype=np.float32)

        # Lookahead history for attenuation limit alignment (4 hops)
        self.recent_noisy_specs: list[np.ndarray] = []

        # Diagnostics
        self.total_frames_processed: int = 0
        self.total_input_samples: int = 0
        self.total_output_samples: int = 0
        self.last_latency_ms: float = 0.0

    def reset(self):
        """Reset internal buffers and RNN state for a new stream."""
        self.state = self.model.init_state.copy()
        self.in_buf = np.zeros(0, dtype=np.float32)
        self.out_buf = np.zeros(self.model.win_len, dtype=np.float32)
        self.recent_noisy_specs.clear()
        self.total_frames_processed = 0
        self.total_input_samples = 0
        self.total_output_samples = 0
        self.last_latency_ms = 0.0

    def process_chunk(self, chunk: np.ndarray, client_sr: Optional[int] = None) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Process an incoming chunk of audio:
          1. Average to mono if needed.
          2. Resample from client_sr to model_sr (48 kHz).
          3. Buffer and slide Vorbis STFT window (960 samples @ 480 hop).
          4. Run ONNX inference frame by frame, passing and updating hidden state.
          5. Perform ISTFT synthesis and overlap-add.
          6. Commit hop_size audio samples and resample back to client_sr.
        """
        chunk_mono = to_mono(chunk)
        if chunk_mono.size == 0:
            return np.zeros(0, dtype=np.float32), {}

        sr_in = client_sr or self.client_sr
        self.total_input_samples += len(chunk_mono)
        t_start = time.perf_counter()

        # Resample input chunk to 48 kHz
        chunk_48k = resample_audio(chunk_mono, sr_in, self.model.sample_rate)
        self.in_buf = np.concatenate([self.in_buf, chunk_48k])

        output_frames: list[np.ndarray] = []

        while len(self.in_buf) >= self.model.win_len:
            # 1. Vorbis window analysis (causal / center=False)
            windowed = self.in_buf[: self.model.win_len] * self.model.window
            spec_complex = np.fft.rfft(windowed, n=self.model.win_len)
            
            # Format: (1, 1, freq_bins, 2) [real, imag]
            spec_ri = np.stack(
                [spec_complex.real.astype(np.float32), spec_complex.imag.astype(np.float32)],
                axis=-1,
            )
            spec_t = np.ascontiguousarray(spec_ri[np.newaxis, np.newaxis, :, :], dtype=np.float32)

            # 2. Stateful ONNX streaming inference
            spec_e_t, self.state = self.model.session.run(
                [self.model.out_spec_name, self.model.out_state_name],
                {
                    self.model.in_spec_name: spec_t,
                    self.model.in_state_name: self.state,
                },
            )

            # 3. Optional attenuation limit blending (preserving background ambient acoustics)
            if self.attn_limit_db is not None:
                alpha = float(10.0 ** (-float(self.attn_limit_db) / 20.0))
                self.recent_noisy_specs.append(spec_t)
                if len(self.recent_noisy_specs) > 4:
                    ref_noisy = self.recent_noisy_specs.pop(0)
                else:
                    ref_noisy = spec_t
                spec_e_t = np.ascontiguousarray(alpha * ref_noisy + (1.0 - alpha) * spec_e_t, dtype=np.float32)

            # 4. ISTFT synthesis + Overlap-Add
            ri = spec_e_t[0, 0]  # (freq_bins, 2)
            complex_frame = ri[:, 0] + 1j * ri[:, 1]
            time_frame = (
                np.fft.irfft(complex_frame, n=self.model.win_len) * self.model.window
            ).astype(np.float32)

            self.out_buf += time_frame

            # Vorbis window satisfies Princen-Bradley COLA at 50% overlap:
            # w[n]^2 + w[n+hop]^2 == 1. Thus first hop_size samples are fully reconstructed.
            committed = self.out_buf[: self.model.hop_size].copy()
            self.out_buf[: self.model.win_len - self.model.hop_size] = self.out_buf[self.model.hop_size :]
            self.out_buf[self.model.win_len - self.model.hop_size :] = 0.0

            output_frames.append(committed)
            self.in_buf = self.in_buf[self.model.hop_size :]
            self.total_frames_processed += 1

        elapsed_ms = (time.perf_counter() - t_start) * 1000.0
        self.last_latency_ms = elapsed_ms

        if not output_frames:
            enhanced_out = np.zeros(0, dtype=np.float32)
        else:
            enhanced_48k = np.concatenate(output_frames)
            if sr_in != self.model.sample_rate:
                enhanced_out = resample_audio(enhanced_48k, self.model.sample_rate, sr_in)
            else:
                enhanced_out = enhanced_48k

        if self.normalize and len(enhanced_out) > 0:
            vpeak = np.max(np.abs(enhanced_out)) + 1e-8
            enhanced_out = enhanced_out * ((10.0 ** (-1.0 / 20.0)) / vpeak)

        self.total_output_samples += len(enhanced_out)

        telemetry = compute_telemetry(chunk_mono, enhanced_out, latency_ms=elapsed_ms)
        telemetry["frames_processed"] = self.total_frames_processed
        return enhanced_out, telemetry

    def flush(self, client_sr: Optional[int] = None) -> Tuple[np.ndarray, Dict[str, Any]]:
        """Flush remaining buffered audio at the end of a stream."""
        if self.in_buf.size == 0:
            return np.zeros(0, dtype=np.float32), {}

        sr_in = client_sr or self.client_sr
        remainder = len(self.in_buf)
        pad = np.zeros(self.model.win_len - remainder, dtype=np.float32)
        out, telem = self.process_chunk(pad, client_sr=self.model.sample_rate)

        real_out = min(self.model.hop_size, len(out))
        trimmed = out[:real_out] if len(out) > 0 else out

        if sr_in != self.model.sample_rate and len(trimmed) > 0:
            trimmed = resample_audio(trimmed, self.model.sample_rate, sr_in)

        return trimmed.astype(np.float32), telem


# Global singleton engine instance initialized on startup
_global_engine: Optional[DPDFNetModel] = None


def get_engine() -> DPDFNetModel:
    global _global_engine
    if _global_engine is None:
        _global_engine = DPDFNetModel()
    return _global_engine
