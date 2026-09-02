# Pull Request: VAANI On-Device Adaptive Voice Isolation Platform

## 🎯 Description
This PR delivers the complete **VAANI** edge-AI adaptive noise cancellation (ANC) web application built with **Next.js 14**, **TypeScript**, and the **Web Audio API**.

---

## ⚡ Key Features Added
- [x] **Deep Tactical Dark Theme & Minimal Light Mode**:
  - Illuminated cyber amber (`#FF6B00`), neon cyan (`#00F0FF`), and signal emerald (`#00FF9D`) highlights.
  - Interactive Dark/Light mode theme toggle in the navbar with `localStorage` persistence.
- [x] **Interactive Web Audio Demo Suite**:
  - 7 military and emergency acoustic scenarios (Airspace Dispute, Chinook, Aircraft Refuelling, Engine Issues, Urban Warfare, PH Crash Roadside, PH Crash Granite).
  - Dual-signal real-time visualizer (raw noise in electric amber vs. isolated speech in neon cyan/white).
  - Mode switcher (**Waveform** vs. **Spectrogram**).
  - **Voice Isolation Master Switch** with live audio routing.
  - Real-time telemetry readouts (Signal Level, Noise Floor, Est. SNR Gain, Frame Latency).
- [x] **Landing Page Components**:
  - Hero with live status readout module.
  - What It Does (2-column breakdown of stationary, non-stationary, and impulsive noise suppression).
  - Deployment Targets (Tactical Headsets, Comms Terminals, Field Radios).
  - 12-row military performance specifications table.
  - Zero-data exfiltration security posture.

---

## 🛠 Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (Strict)
- **Styling**: Tailwind CSS
- **Audio Processing**: Web Audio API (`BiquadFilterNode`, `DynamicsCompressorNode`, `AnalyserNode`)

---

## 🧪 Verification
- [x] `npm run build`: Zero errors, static generation succeeded.
- [x] Audio engine and live canvas visualizer tested across all 7 scenarios.
- [x] Theme toggle tested across desktop and mobile screen widths.
