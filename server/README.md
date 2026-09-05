# Project Vaani — DPDFNet-8 Real-Time Streaming Server

High-performance real-time combat speech enhancement server using **DPDFNet-8 (48 kHz High-Resolution ONNX)** with a full-duplex WebSocket streaming layer.

---

## 📁 Server Folder Structure

```
server/
├── __init__.py               # Package definition
├── config.py                 # Central configuration (ports, sample rates, model paths)
├── main.py                   # FastAPI server entry point, lifecycle & WebSocket routing
├── requirements.txt          # Server dependencies
│
├── core/                     # Core audio enhancement engine
│   ├── __init__.py
│   ├── downloader.py         # Model downloader from Hugging Face to pretuned/
│   ├── engine.py             # DPDFNet ONNX streaming engine & session state
│   └── audio_utils.py        # Buffer decode/encode, Vorbis window, resampling & metrics
│
├── websocket/                # WebSocket streaming layer
│   ├── __init__.py
│   ├── connection.py         # Multi-client connection & session state manager
│   └── handler.py            # Streaming message handler (binary audio & JSON control)
│
├── api/                      # REST API routes
│   ├── __init__.py
│   ├── routes.py             # /health, /api/models, /api/enhance, /api/download
│   └── schemas.py            # Pydantic request/response schemas
│
├── static/                   # Live Waveform Web Application
│   ├── index.html            # Web app UI with dual oscilloscopes & controls
│   ├── app.js                # Web Audio API, mic capture, WebSocket client & visualizers
│   └── style.css             # Cyberpunk/tactical styles & radar styling
│
└── client/                   # Testing & benchmarking clients
    ├── __init__.py
    └── test_client.py        # Real-time WebSocket streaming verification client
```

---

## 🚀 Getting Started

### 1. Download Model into Pretuned Directory
The model can be downloaded directly from Hugging Face (`Ceva-IP/DPDFNet`):
```bash
python server/core/downloader.py
```
This checks and places `dpdfnet8_48khz_hr.onnx` into `models/pretuned/dpdfnet/` or `pretuned/`.

### 2. Start the Server & Web App
Run the FastAPI + Uvicorn server:
```bash
python -m server.main
```
Server runs at `http://localhost:8000`.

### 3. Open the Live Waveform Web App
Open your browser and navigate to:
👉 **[http://localhost:8000/](http://localhost:8000/)** (or `http://localhost:8000/live`)

Features in the Web App:
* **Microphone Selector**: Choose any connected microphone or headset.
* **Dual Live Waveforms**: Real-time 60fps HTML5 Canvas oscilloscopes showing:
  * **Raw Input Audio**: Microphone stream (shows speech + ambient noise).
  * **Filtered Output Audio**: DPDFNet-8 enhanced speech returned from server.
* **Speaker Playback**: Low-latency jitter-buffered audio output to speakers/headphones.
* **Mute Options**:
  * **Mute Mic**: Instantly pauses microphone transmission to the server.
  * **Mute Speaker**: Instantly silences audio playback through the speaker.
* **Audio Mode Toggle**: Switch between "Enhanced Speech" and "Raw Bypass" for instant A/B listening comparison.
* **Telemetry HUD**: Real-time noise suppression gain (dB), STFT+ONNX latency (ms), and network throughput.
Server runs by default at `http://0.0.0.0:8000`.

---

## 🌐 WebSocket Streaming Layer Specification

* **Endpoint**: `ws://127.0.0.1:8000/ws/stream` (or `/ws`)
* **Handshake**: The server immediately sends session metadata upon connection:
  ```json
  {
    "type": "handshake",
    "session_id": "uuid-here",
    "model": "dpdfnet8_48khz_hr",
    "model_sample_rate": 48000,
    "default_sample_rate": 16000,
    "audio_format": "int16",
    "status": "ready"
  }
  ```

### Sending Audio Buffers
* Send raw binary frames (`int16` PCM little-endian or `float32` IEEE little-endian).
* The server processes the buffer chunk-by-chunk through causal Vorbis STFT and the DPDFNet-8 recurrent state, and immediately streams back enhanced audio buffers in the same binary format.

### Control Messages (JSON Text)
* **Configuration**:
  ```json
  {
    "type": "config",
    "sample_rate": 16000,
    "format": "int16",
    "attn_limit_db": null,
    "normalize": false
  }
  ```
* **Flush**:
  ```json
  { "type": "flush" }
  ```
* **Reset**:
  ```json
  { "type": "reset" }
  ```

---

## 🧪 Client Test Verification

Run the included automated streaming client:
```bash
python server/client/test_client.py
```
This connects to the server, streams synthetic combat audio in 50ms chunks, receives enhanced audio back, logs telemetry metrics (suppression gain, latency), and outputs `samples/server_test_enhanced.wav`.
