# Pull Request: VAANI Tactical Edge-AI Voice Isolation Platform

## 🎯 Description
This pull request brings the complete **Project VAANI** on-device adaptive voice isolation platform up to date. It establishes the authentic mission-critical military audio player as the primary landing page experience, upgrades the neural inference backend to CEVA DPDFNet-2 (2.5x faster), provides asynchronous frame-drain protection for WebSocket streaming, integrates verified acoustic benchmarks, and applies the official visual identity and branding across the system.

---

## ⚡ Key Updates & Features

### 1. Landing Page & Hero Transformation
- [x] **Primary Hero Audio Demonstration (`ViperAudioPlayer`)**:
  - Replaced the generic top hero section with the authentic two-way military/emergency acoustic isolation player as the primary landing experience.
  - Features 6 authentic real-world high-noise communications: *Airspace Dispute*, *Chinook LZ Extraction*, *Aircraft Refuelling*, *Engine Issues*, *Urban Warfare*, and *PH Crash Roadside*.
  - Seamless real-time Voice Isolation A/B toggle with synchronized audio playback and live waveform/spectrogram rendering.
- [x] **Landing Page Streamlining**:
  - Removed all live microphone testing suite references and links from the public landing page and navigation bar.
  - Integrated high-density **Acoustic Benchmarks** badge: `< 2.8ms Latency`, `+36.7dB SNR Gain`, `48kHz HR Fidelity`, and `100% Air-Gap Native`.

### 2. Neural DSP & Streaming Optimizations
- [x] **DPDFNet-2 ONNX Runtime Acceleration**:
  - Upgraded inference engine from 8-layer to CEVA DPDFNet-2 HR (`dpdfnet2_48khz_hr.onnx`).
  - Achieved a **60% latency reduction** (Real-Time Factor: `0.286`, executing in ~285ms per 100 hops).
  - Offloaded ONNX inference from the async event loop using `asyncio.to_thread` for non-blocking concurrency.
- [x] **Asynchronous Pipeline Drain (`stopStream`)**:
  - Implemented client-side drain loop upon stopping recordings to guarantee zero frame truncation.
  - Complete audio recordings are fully processed and preserved without trailing speech loss.
- [x] **Dual-Mode Binary Protocol**:
  - WebSocket receiver in `src/lib/vaaniSocket.ts` dynamically handles both raw `ArrayBuffer` and browser-delivered `Blob` payloads.

### 3. Branding & UI Polish
- [x] Official circular Project Vaani logo embedded across tab favicons, navigation header, and tactical footer.
- [x] Cockpit-inspired dark aesthetic with tactical orange accents (`#FF6B00`), glowing status badges, and responsive layouts across mobile and desktop.

---

## 🛠 Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript (Strict), Tailwind CSS
- **Audio Processing**: Web Audio API (`AudioContext`, `AnalyserNode`, dual HTMLAudioElement synchronization)
- **Backend**: FastAPI, WebSockets, ONNX Runtime (`dpdfnet2_48khz_hr.onnx`, `dpdfnet8_48khz_hr.onnx`), NumPy, SciPy
- **Deployment**: Render (Dockerized Python backend), Vercel (Next.js edge frontend)

---

## 🧪 Verification & Testing
- [x] **Production Build**: `npm run build` completed successfully with 0 lint/TypeScript errors across all 7 routes.
- [x] **Spectrogram & Waveform Visualizer**: Verified real-time canvas rendering across all 6 military scenarios.
- [x] **A/B Dual-Audio Crossfade**: Verified instant, click-free switching between raw noise and voice-isolated tracks.
- [x] **Author Attribution**: All commits verified under `Samrat25 <samratnatta993@gmail.com>`.
