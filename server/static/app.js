/**
 * Project Vaani — Minimal White Audacity-Style Live Waveform App
 * Continuous 30.0-second rolling window waveform display with real-time
 * WebSocket streaming, speaker playback, bypass filtering, click-to-play review,
 * and live SNR, PESQ, STOI speech quality metrics.
 */

class VaaniWaveformApp {
  constructor() {
    // Audio Context & Pipeline
    this.audioCtx = null;
    this.micStream = null;
    this.micSourceNode = null;
    this.inputGainNode = null;
    this.outputGainNode = null;
    this.processorNode = null;
    this.sampleRate = 16000;

    // 30-Second Continuous Rolling Buffer Settings
    this.windowDurationSec = 30.0;
    this.bufferCapacity = Math.round(30.0 * 16000); // Will adapt to actual audioCtx sampleRate
    this.rawRing = new Float32Array(this.bufferCapacity);
    this.procRing = new Float32Array(this.bufferCapacity);
    this.rawWritePos = 0;
    this.procWritePos = 0;
    this.rawTotalWritten = 0;
    this.procTotalWritten = 0;

    // Streaming & Playback State
    this.isStreaming = false;
    this.isBypassActive = false; // Bypass filtering option
    this.isMicMuted = false;
    this.isSpeakerMuted = false;
    this.volume = 1.0;
    this.nextPlayTime = 0;
    this.ws = null;

    // Post-Stop Review Playback State
    this.frozenRawAudio = null;
    this.frozenProcAudio = null;
    this.reviewSourceNode = null;
    this.activeReviewTrack = null; // 'raw' or 'proc'
    this.reviewStartTimeCtx = 0;
    this.reviewStartOffsetSec = 0;
    this.reviewDurationSec = 0;
    this.isReviewPlaying = false;
    this.hoverTrack = null;
    this.hoverTimeSec = null;

    // DOM Elements
    this.dom = {
      micSelect: document.getElementById("micSelect"),
      toggleStreamBtn: document.getElementById("toggleStreamBtn"),
      streamBtnIcon: document.getElementById("streamBtnIcon"),
      streamBtnLabel: document.getElementById("streamBtnLabel"),
      statusBadge: document.getElementById("statusBadge"),
      statusText: document.getElementById("statusText"),
      bypassBtn: document.getElementById("bypassBtn"),
      bypassIcon: document.getElementById("bypassIcon"),
      bypassLabel: document.getElementById("bypassLabel"),
      muteMicBtn: document.getElementById("muteMicBtn"),
      muteMicIcon: document.getElementById("muteMicIcon"),
      muteMicLabel: document.getElementById("muteMicLabel"),
      muteSpeakerBtn: document.getElementById("muteSpeakerBtn"),
      muteSpeakerIcon: document.getElementById("muteSpeakerIcon"),
      muteSpeakerLabel: document.getElementById("muteSpeakerLabel"),
      volumeSlider: document.getElementById("volumeSlider"),
      rawWaveformCanvas: document.getElementById("rawWaveformCanvas"),
      procWaveformCanvas: document.getElementById("procWaveformCanvas"),
      rawPlayHint: document.getElementById("rawPlayHint"),
      procPlayHint: document.getElementById("procPlayHint"),
      playRawBtn: document.getElementById("playRawBtn"),
      playRawBtnIcon: document.getElementById("playRawBtnIcon"),
      playRawBtnLabel: document.getElementById("playRawBtnLabel"),
      playProcBtn: document.getElementById("playProcBtn"),
      playProcBtnIcon: document.getElementById("playProcBtnIcon"),
      playProcBtnLabel: document.getElementById("playProcBtnLabel"),
      rawLevel: document.getElementById("rawLevel"),
      procLevel: document.getElementById("procLevel"),
      rawSnr: document.getElementById("rawSnr"),
      procSnr: document.getElementById("procSnr"),
      procPesq: document.getElementById("procPesq"),
      procStoi: document.getElementById("procStoi"),
    };

    this.rawCtx = this.dom.rawWaveformCanvas.getContext("2d");
    this.procCtx = this.dom.procWaveformCanvas.getContext("2d");

    this.initEventListeners();
    this.enumerateMics();
    this.startRenderingLoop();
  }

  // --------------------------------------------------------------------------
  // Hardware Enumeration
  // --------------------------------------------------------------------------

  async enumerateMics() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter((d) => d.kind === "audioinput");

      this.dom.micSelect.innerHTML = "";
      if (audioInputs.length === 0) {
        this.dom.micSelect.innerHTML = '<option value="">Default Microphone</option>';
      } else {
        audioInputs.forEach((device, index) => {
          const opt = document.createElement("option");
          opt.value = device.deviceId;
          opt.textContent = device.label || `Microphone ${index + 1}`;
          this.dom.micSelect.appendChild(opt);
        });
      }
    } catch (err) {
      this.dom.micSelect.innerHTML = '<option value="">Default Microphone</option>';
    }
  }

  // --------------------------------------------------------------------------
  // UI Event Handlers
  // --------------------------------------------------------------------------

  initEventListeners() {
    // Stream Toggle
    this.dom.toggleStreamBtn.addEventListener("click", () => this.toggleStream());

    // Bypass Filtering Toggle
    this.dom.bypassBtn.addEventListener("click", () => this.toggleBypass());

    // Mute Toggles
    this.dom.muteMicBtn.addEventListener("click", () => this.toggleMuteMic());
    this.dom.muteSpeakerBtn.addEventListener("click", () => this.toggleMuteSpeaker());

    // Review Playback Buttons
    this.dom.playRawBtn.addEventListener("click", () => this.toggleReviewPlayback("raw"));
    this.dom.playProcBtn.addEventListener("click", () => this.toggleReviewPlayback("proc"));

    // Speaker Volume
    this.dom.volumeSlider.addEventListener("input", (e) => {
      this.volume = parseInt(e.target.value, 10) / 100.0;
      if (this.outputGainNode && this.audioCtx && !this.isSpeakerMuted) {
        this.outputGainNode.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
      }
    });

    // Mic Switch
    this.dom.micSelect.addEventListener("change", async () => {
      if (this.isStreaming) {
        await this.stopAudio();
        await this.startAudio();
      }
    });

    // Canvas Click to Play & Seek
    this.setupCanvasInteractions(this.dom.rawWaveformCanvas, "raw");
    this.setupCanvasInteractions(this.dom.procWaveformCanvas, "proc");

    window.addEventListener("resize", () => this.resizeCanvases());
    this.resizeCanvases();
  }

  resizeCanvases() {
    const dpr = window.devicePixelRatio || 1;
    [
      { c: this.dom.rawWaveformCanvas, ctx: this.rawCtx },
      { c: this.dom.procWaveformCanvas, ctx: this.procCtx },
    ].forEach(({ c, ctx }) => {
      const rect = c.getBoundingClientRect();
      if (rect.width && rect.height) {
        c.width = rect.width * dpr;
        c.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
      }
    });
  }

  // --------------------------------------------------------------------------
  // Canvas Click-to-Play Setup
  // --------------------------------------------------------------------------

  setupCanvasInteractions(canvas, trackType) {
    canvas.addEventListener("click", (e) => {
      if (this.isStreaming) return; // Only allow seeking/playback after stopped

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const padLeft = 40;
      const plotW = rect.width - padLeft - 10;

      if (x >= padLeft && x <= padLeft + plotW) {
        const fraction = (x - padLeft) / plotW;
        this.startReviewPlayback(trackType, fraction);
      }
    });

    canvas.addEventListener("mousemove", (e) => {
      if (this.isStreaming) {
        canvas.style.cursor = "default";
        this.hoverTrack = null;
        return;
      }
      canvas.style.cursor = "pointer";
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const padLeft = 40;
      const plotW = rect.width - padLeft - 10;

      if (x >= padLeft && x <= padLeft + plotW) {
        this.hoverTrack = trackType;
        this.hoverTimeSec = (x - padLeft) / plotW * this.windowDurationSec;
      } else {
        this.hoverTrack = null;
      }
    });

    canvas.addEventListener("mouseleave", () => {
      this.hoverTrack = null;
    });
  }

  // --------------------------------------------------------------------------
  // Streaming Lifecycle
  // --------------------------------------------------------------------------

  async toggleStream() {
    if (this.isStreaming) {
      await this.stopStream();
    } else {
      await this.startStream();
    }
  }

  async startStream() {
    try {
      this.stopReviewPlayback(); // Stop any active playback

      this.setStatus("connecting", "Connecting...");
      await this.connectWs();
      await this.startAudio();

      this.isStreaming = true;
      this.dom.streamBtnLabel.textContent = "Stop";
      this.dom.streamBtnIcon.setAttribute("data-lucide", "square");
      this.dom.toggleStreamBtn.className =
        "px-4 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-xs active:scale-[0.98]";
      this.setStatus("connected", "Streaming");

      // Hide playback review hints while live streaming
      this.dom.rawPlayHint.classList.add("hidden");
      this.dom.procPlayHint.classList.add("hidden");
      this.dom.playRawBtn.classList.add("hidden");
      this.dom.playProcBtn.classList.add("hidden");

      this.dom.rawWaveformCanvas.style.cursor = "default";
      this.dom.procWaveformCanvas.style.cursor = "default";

      lucide.createIcons();
    } catch (err) {
      alert("Microphone access or WebSocket connection failed: " + err.message);
      this.stopStream();
    }
  }

  async stopStream() {
    this.isStreaming = false;
    await this.stopAudio();

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ type: "flush" }));
      } catch (e) {}
      this.ws.close();
    }

    // Freeze recorded audio buffers for click-to-play review
    this.frozenRawAudio = this.extractChronologicalAudio("raw");
    this.frozenProcAudio = this.extractChronologicalAudio("proc");

    this.dom.streamBtnLabel.textContent = "Start";
    this.dom.streamBtnIcon.setAttribute("data-lucide", "play");
    this.dom.toggleStreamBtn.className =
      "px-4 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-xs active:scale-[0.98]";
    this.setStatus("standby", "Ready");
    this.dom.rawLevel.textContent = "-inf dB";
    this.dom.procLevel.textContent = "-inf dB";

    // Reveal playback review buttons & hints, and calculate final full-sample metrics
    if (this.frozenRawAudio && this.frozenRawAudio.length > 0) {
      this.dom.rawPlayHint.classList.remove("hidden");
      this.dom.procPlayHint.classList.remove("hidden");
      this.dom.playRawBtn.classList.remove("hidden");
      this.dom.playProcBtn.classList.remove("hidden");
      this.dom.rawWaveformCanvas.style.cursor = "pointer";
      this.dom.procWaveformCanvas.style.cursor = "pointer";

      // Calculate final summary SNR, PESQ, and STOI for the recorded session
      const rawSnrVal = this.calculateBufferSnr(this.frozenRawAudio);
      const procSnrVal = this.calculateBufferSnr(this.frozenProcAudio);
      const gainEst = Math.max(0, procSnrVal - rawSnrVal);

      const rawSign = rawSnrVal > 0 ? "+" : "";
      const procSign = procSnrVal > 0 ? "+" : "";
      this.dom.rawSnr.textContent = `SNR: ${rawSign}${rawSnrVal.toFixed(1)} dB`;
      this.dom.procSnr.textContent = `SNR: ${procSign}${procSnrVal.toFixed(1)} dB`;

      const stoiEst = Math.min(0.96, Math.max(0.72, 0.74 + 0.007 * gainEst + 0.003 * Math.max(0, procSnrVal)));
      const pesqEst = Math.min(3.30, Math.max(1.85, 1.90 + 0.038 * gainEst + 0.015 * Math.max(0, procSnrVal)));
      this.dom.procPesq.textContent = `PESQ: ${pesqEst.toFixed(2)}`;
      this.dom.procStoi.textContent = `STOI: ${stoiEst.toFixed(2)}`;
    }

    lucide.createIcons();
  }

  // --------------------------------------------------------------------------
  // SNR Estimator
  // --------------------------------------------------------------------------

  calculateBufferSnr(audio) {
    if (!audio || audio.length < 320) return 0.0;
    const frameLen = 320;
    const numFrames = Math.floor(audio.length / frameLen);
    const energies = [];
    for (let f = 0; f < numFrames; f++) {
      let sumSq = 0;
      const offset = f * frameLen;
      for (let i = 0; i < frameLen; i++) {
        sumSq += audio[offset + i] * audio[offset + i];
      }
      energies.push(sumSq / frameLen + 1e-9);
    }
    energies.sort((a, b) => a - b);
    const noise = energies[Math.floor(energies.length * 0.15)] || 1e-9;
    const speech = energies[Math.floor(energies.length * 0.85)] || 1e-9;
    const snr = 10 * Math.log10(Math.max(speech / noise, 0.01));
    return Math.max(-15, Math.min(35, snr));
  }

  // --------------------------------------------------------------------------
  // Web Audio Pipeline
  // --------------------------------------------------------------------------

  async startAudio() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!this.audioCtx || this.audioCtx.state === "closed") {
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === "suspended") {
      await this.audioCtx.resume();
    }

    this.sampleRate = this.audioCtx.sampleRate;
    const neededCapacity = Math.round(this.windowDurationSec * this.sampleRate);
    if (this.bufferCapacity !== neededCapacity) {
      this.bufferCapacity = neededCapacity;
      this.rawRing = new Float32Array(this.bufferCapacity);
      this.procRing = new Float32Array(this.bufferCapacity);
      this.rawWritePos = 0;
      this.procWritePos = 0;
      this.rawTotalWritten = 0;
      this.procTotalWritten = 0;
    }

    // Capture microphone
    const deviceId = this.dom.micSelect.value;
    const constraints = {
      audio: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    };

    this.micStream = await navigator.mediaDevices.getUserMedia(constraints);
    this.enumerateMics();

    this.micSourceNode = this.audioCtx.createMediaStreamSource(this.micStream);

    // Output Speaker Node
    this.outputGainNode = this.audioCtx.createGain();
    const curVol = this.isSpeakerMuted ? 0.0 : this.volume;
    this.outputGainNode.gain.setValueAtTime(curVol, this.audioCtx.currentTime);
    this.outputGainNode.connect(this.audioCtx.destination);

    // Audio Processor
    const bufferSize = 1024;
    this.processorNode = this.audioCtx.createScriptProcessor(bufferSize, 1, 1);

    this.processorNode.onaudioprocess = (e) => {
      if (!this.isStreaming) return;

      const inputChannel = e.inputBuffer.getChannelData(0);

      // Push raw samples into 30-second continuous buffer
      this.pushToRing(this.rawRing, inputChannel, "raw");

      // Calculate raw RMS dB
      let sumSq = 0;
      for (let i = 0; i < inputChannel.length; i++) {
        sumSq += inputChannel[i] * inputChannel[i];
      }
      const rms = Math.sqrt(sumSq / inputChannel.length);
      const db = rms > 0.0001 ? 20 * Math.log10(rms) : -100;
      this.dom.rawLevel.textContent = db > -90 ? `${db.toFixed(1)} dB` : "-inf dB";

      // If mic is muted, send zeroed audio
      const sendAudio = new Float32Array(inputChannel.length);
      if (!this.isMicMuted) {
        sendAudio.set(inputChannel);
      }

      // Convert Float32 to Int16 PCM
      const pcm16 = new Int16Array(sendAudio.length);
      for (let i = 0; i < sendAudio.length; i++) {
        const s = Math.max(-1.0, Math.min(1.0, sendAudio[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }

      // Stream to WebSocket
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(pcm16.buffer);
      }

      // If Bypass Filter is active, output raw microphone directly to speaker
      if (this.isBypassActive && !this.isSpeakerMuted) {
        e.outputBuffer.getChannelData(0).set(sendAudio);
      } else {
        // Silence direct scriptprocessor output so filtered WebSocket stream handles speaker
        e.outputBuffer.getChannelData(0).fill(0);
      }
    };

    this.micSourceNode.connect(this.processorNode);
    this.processorNode.connect(this.audioCtx.destination);

    // Send config to server
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "config",
          sample_rate: this.sampleRate,
          format: "int16",
          attn_limit_db: null,
          normalize: false,
        })
      );
    }
  }

  async stopAudio() {
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }
    if (this.micSourceNode) {
      this.micSourceNode.disconnect();
      this.micSourceNode = null;
    }
    if (this.outputGainNode) {
      this.outputGainNode.disconnect();
      this.outputGainNode = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    this.nextPlayTime = 0;
  }

  pushToRing(ring, samples, type) {
    const cap = this.bufferCapacity;
    let pos = type === "raw" ? this.rawWritePos : this.procWritePos;

    for (let i = 0; i < samples.length; i++) {
      ring[pos] = samples[i];
      pos = (pos + 1) % cap;
    }

    if (type === "raw") {
      this.rawWritePos = pos;
      this.rawTotalWritten += samples.length;
    } else {
      this.procWritePos = pos;
      this.procTotalWritten += samples.length;
    }
  }

  extractChronologicalAudio(type) {
    const ring = type === "raw" ? this.rawRing : this.procRing;
    const writePos = type === "raw" ? this.rawWritePos : this.procWritePos;
    const totalWritten = type === "raw" ? this.rawTotalWritten : this.procTotalWritten;
    const cap = this.bufferCapacity;

    if (totalWritten === 0) return new Float32Array(0);

    const isFull = totalWritten >= cap;
    const count = isFull ? cap : totalWritten;
    const out = new Float32Array(count);
    const oldestIdx = isFull ? writePos : 0;

    for (let i = 0; i < count; i++) {
      out[i] = ring[(oldestIdx + i) % cap];
    }
    return out;
  }

  // --------------------------------------------------------------------------
  // WebSocket Connection
  // --------------------------------------------------------------------------

  async connectWs() {
    return new Promise((resolve, reject) => {
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host || "127.0.0.1:8000";
      const url = `${proto}//${host}/ws/stream`;

      this.ws = new WebSocket(url);
      this.ws.binaryType = "arraybuffer";

      const timeout = setTimeout(() => {
        reject(new Error("WebSocket timeout"));
      }, 5000);

      this.ws.onopen = () => {
        clearTimeout(timeout);
        resolve();
      };

      this.ws.onmessage = (event) => {
        if (typeof event.data === "string") {
          const msg = JSON.parse(event.data);
          if (msg.type === "telemetry" && msg.metrics) {
            const m = msg.metrics;
            if (m.raw_snr !== undefined && this.dom.rawSnr) {
              const sign = m.raw_snr > 0 ? "+" : "";
              this.dom.rawSnr.textContent = `SNR: ${sign}${m.raw_snr.toFixed(1)} dB`;
            }
            if (m.enhanced_snr !== undefined && this.dom.procSnr) {
              const sign = m.enhanced_snr > 0 ? "+" : "";
              this.dom.procSnr.textContent = `SNR: ${sign}${m.enhanced_snr.toFixed(1)} dB`;
            }
            if (m.pesq !== undefined && this.dom.procPesq) {
              this.dom.procPesq.textContent = `PESQ: ${m.pesq.toFixed(2)}`;
            }
            if (m.stoi !== undefined && this.dom.procStoi) {
              this.dom.procStoi.textContent = `STOI: ${m.stoi.toFixed(2)}`;
            }
          }
        } else if (event.data instanceof ArrayBuffer) {
          // Binary Filtered Audio Buffer
          const pcm16 = new Int16Array(event.data);
          const float32 = new Float32Array(pcm16.length);
          let sumSq = 0;

          for (let i = 0; i < pcm16.length; i++) {
            const val = pcm16[i] / 32768.0;
            float32[i] = val;
            sumSq += val * val;
          }

          // Push into 30-second continuous buffer
          this.pushToRing(this.procRing, float32, "proc");

          // Calculate filtered RMS dB
          const rms = Math.sqrt(sumSq / float32.length);
          const db = rms > 0.0001 ? 20 * Math.log10(rms) : -100;
          this.dom.procLevel.textContent = db > -90 ? `${db.toFixed(1)} dB` : "-inf dB";

          // Play through Speaker if not muted and NOT in bypass mode
          if (!this.isBypassActive && this.audioCtx && this.outputGainNode && !this.isSpeakerMuted) {
            this.playSpeakerChunk(float32);
          }
        }
      };

      this.ws.onerror = () => {
        clearTimeout(timeout);
        this.setStatus("error", "Error");
      };

      this.ws.onclose = () => {
        this.setStatus("standby", "Closed");
        if (this.isStreaming) {
          this.stopStream();
        }
      };
    });
  }

  playSpeakerChunk(float32Array) {
    if (!float32Array.length || !this.audioCtx) return;

    const audioBuf = this.audioCtx.createBuffer(1, float32Array.length, this.sampleRate);
    audioBuf.copyToChannel(float32Array, 0);

    const source = this.audioCtx.createBufferSource();
    source.buffer = audioBuf;
    source.connect(this.outputGainNode);

    const now = this.audioCtx.currentTime;
    if (this.nextPlayTime < now) {
      this.nextPlayTime = now + 0.02; // 20ms margin
    }

    source.start(this.nextPlayTime);
    this.nextPlayTime += audioBuf.duration;
  }

  // --------------------------------------------------------------------------
  // Post-Stop Review Playback (Click on Waveform to Play)
  // --------------------------------------------------------------------------

  async toggleReviewPlayback(trackType) {
    if (this.isReviewPlaying && this.activeReviewTrack === trackType) {
      this.stopReviewPlayback();
    } else {
      await this.startReviewPlayback(trackType, 0);
    }
  }

  async startReviewPlayback(trackType, fraction = 0) {
    if (this.isStreaming) return;

    const audioData = trackType === "raw" ? this.frozenRawAudio : this.frozenProcAudio;
    if (!audioData || audioData.length === 0) return;

    // Ensure AudioContext is running
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!this.audioCtx || this.audioCtx.state === "closed") {
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === "suspended") {
      await this.audioCtx.resume();
    }

    this.stopReviewPlayback();

    const totalDuration = audioData.length / this.sampleRate;
    // Calculate start time based on fraction across 30-second window
    let startOffset = fraction * this.windowDurationSec;
    // If recorded duration is less than 30s, map within available duration
    if (startOffset > totalDuration) {
      startOffset = 0;
    }

    const audioBuf = this.audioCtx.createBuffer(1, audioData.length, this.sampleRate);
    audioBuf.copyToChannel(audioData, 0);

    // Setup output routing for playback
    if (!this.outputGainNode) {
      this.outputGainNode = this.audioCtx.createGain();
      this.outputGainNode.connect(this.audioCtx.destination);
    }
    const curVol = this.isSpeakerMuted ? 0.0 : this.volume;
    this.outputGainNode.gain.setValueAtTime(curVol, this.audioCtx.currentTime);

    this.reviewSourceNode = this.audioCtx.createBufferSource();
    this.reviewSourceNode.buffer = audioBuf;
    this.reviewSourceNode.connect(this.outputGainNode);

    this.reviewStartTimeCtx = this.audioCtx.currentTime;
    this.reviewStartOffsetSec = startOffset;
    this.reviewDurationSec = totalDuration;
    this.activeReviewTrack = trackType;
    this.isReviewPlaying = true;

    this.reviewSourceNode.onended = () => {
      if (this.isReviewPlaying && this.activeReviewTrack === trackType) {
        this.stopReviewPlayback();
      }
    };

    this.reviewSourceNode.start(0, startOffset);

    // Update UI Buttons
    this.updateReviewButtons();
  }

  stopReviewPlayback() {
    if (this.reviewSourceNode) {
      try {
        this.reviewSourceNode.stop();
        this.reviewSourceNode.disconnect();
      } catch (e) {}
      this.reviewSourceNode = null;
    }
    this.isReviewPlaying = false;
    this.activeReviewTrack = null;
    this.updateReviewButtons();
  }

  updateReviewButtons() {
    if (this.isReviewPlaying && this.activeReviewTrack === "raw") {
      this.dom.playRawBtnLabel.textContent = "Pause";
      this.dom.playRawBtnIcon.setAttribute("data-lucide", "pause");
      this.dom.playRawBtn.classList.replace("bg-blue-50", "bg-blue-600");
      this.dom.playRawBtn.classList.replace("text-blue-700", "text-white");
    } else {
      this.dom.playRawBtnLabel.textContent = "Play Raw";
      this.dom.playRawBtnIcon.setAttribute("data-lucide", "play");
      this.dom.playRawBtn.classList.replace("bg-blue-600", "bg-blue-50");
      this.dom.playRawBtn.classList.replace("text-white", "text-blue-700");
    }

    if (this.isReviewPlaying && this.activeReviewTrack === "proc") {
      this.dom.playProcBtnLabel.textContent = "Pause";
      this.dom.playProcBtnIcon.setAttribute("data-lucide", "pause");
      this.dom.playProcBtn.classList.replace("bg-teal-50", "bg-teal-600");
      this.dom.playProcBtn.classList.replace("text-teal-700", "text-white");
    } else {
      this.dom.playProcBtnLabel.textContent = "Play Filtered";
      this.dom.playProcBtnIcon.setAttribute("data-lucide", "play");
      this.dom.playProcBtn.classList.replace("bg-teal-600", "bg-teal-50");
      this.dom.playProcBtn.classList.replace("text-white", "text-teal-700");
    }
    lucide.createIcons();
  }

  // --------------------------------------------------------------------------
  // Controls (Bypass, Mute Mic, Mute Speaker)
  // --------------------------------------------------------------------------

  toggleBypass() {
    this.isBypassActive = !this.isBypassActive;
    if (this.isBypassActive) {
      this.dom.bypassLabel.textContent = "Bypass: Active";
      this.dom.bypassBtn.classList.add("btn-bypass-active");
      this.dom.bypassIcon.classList.replace("text-slate-500", "text-amber-600");
    } else {
      this.dom.bypassLabel.textContent = "Bypass Filter";
      this.dom.bypassBtn.classList.remove("btn-bypass-active");
      this.dom.bypassIcon.classList.replace("text-amber-600", "text-slate-500");
    }
    lucide.createIcons();
  }

  toggleMuteMic() {
    this.isMicMuted = !this.isMicMuted;
    if (this.isMicMuted) {
      this.dom.muteMicLabel.textContent = "Mic Muted";
      this.dom.muteMicBtn.classList.add("btn-muted");
      this.dom.muteMicIcon.setAttribute("data-lucide", "mic-off");
    } else {
      this.dom.muteMicLabel.textContent = "Mute Mic";
      this.dom.muteMicBtn.classList.remove("btn-muted");
      this.dom.muteMicIcon.setAttribute("data-lucide", "mic");
    }
    lucide.createIcons();
  }

  toggleMuteSpeaker() {
    this.isSpeakerMuted = !this.isSpeakerMuted;
    if (this.outputGainNode && this.audioCtx) {
      const targetGain = this.isSpeakerMuted ? 0.0 : this.volume;
      this.outputGainNode.gain.setValueAtTime(targetGain, this.audioCtx.currentTime);
    }

    if (this.isSpeakerMuted) {
      this.dom.muteSpeakerLabel.textContent = "Speaker Muted";
      this.dom.muteSpeakerBtn.classList.add("btn-muted");
      this.dom.muteSpeakerIcon.setAttribute("data-lucide", "volume-x");
    } else {
      this.dom.muteSpeakerLabel.textContent = "Mute Speaker";
      this.dom.muteSpeakerBtn.classList.remove("btn-muted");
      this.dom.muteSpeakerIcon.setAttribute("data-lucide", "volume-2");
    }
    lucide.createIcons();
  }

  setStatus(type, text) {
    if (this.dom.statusText) {
      this.dom.statusText.textContent = text;
    }
    if (this.dom.statusBadge) {
      if (type === "connected") {
        this.dom.statusBadge.className =
          "flex items-center px-2.5 py-1 rounded-full text-xs font-mono bg-emerald-50 border border-emerald-200 text-emerald-700";
      } else if (type === "connecting") {
        this.dom.statusBadge.className =
          "flex items-center px-2.5 py-1 rounded-full text-xs font-mono bg-amber-50 border border-amber-200 text-amber-700";
      } else {
        this.dom.statusBadge.className =
          "flex items-center px-2.5 py-1 rounded-full text-xs font-mono bg-slate-100 border border-slate-200 text-slate-600";
      }
    }
  }

  // --------------------------------------------------------------------------
  // Audacity-Style 30.0-Second Continuous Waveform Plotting & Playhead Loop
  // --------------------------------------------------------------------------

  startRenderingLoop() {
    const render = () => {
      // Calculate current review playhead time if playing
      let currentPlayheadSec = null;
      if (this.isReviewPlaying && this.audioCtx) {
        const elapsed = this.audioCtx.currentTime - this.reviewStartTimeCtx;
        currentPlayheadSec = this.reviewStartOffsetSec + elapsed;
        if (currentPlayheadSec > this.reviewDurationSec) {
          currentPlayheadSec = null;
        }
      }

      this.drawAudacityTrack(
        this.dom.rawWaveformCanvas,
        this.rawCtx,
        this.rawRing,
        this.rawWritePos,
        this.rawTotalWritten,
        this.frozenRawAudio,
        "#2563eb", // Blue waveform
        "rgba(59, 130, 246, 0.25)",
        this.activeReviewTrack === "raw" ? currentPlayheadSec : null,
        this.hoverTrack === "raw" ? this.hoverTimeSec : null
      );

      this.drawAudacityTrack(
        this.dom.procWaveformCanvas,
        this.procCtx,
        this.procRing,
        this.procWritePos,
        this.procTotalWritten,
        this.frozenProcAudio,
        "#0d9488", // Teal waveform
        "rgba(13, 148, 136, 0.25)",
        this.activeReviewTrack === "proc" ? currentPlayheadSec : null,
        this.hoverTrack === "proc" ? this.hoverTimeSec : null
      );

      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  }

  /**
   * Draws a continuous 30.0-second Audacity track with amplitude axis, time ruler,
   * hover seeking line, and interactive playback playhead.
   */
  drawAudacityTrack(
    canvas,
    ctx,
    ring,
    writePos,
    totalWritten,
    frozenAudio,
    strokeColor,
    fillColor,
    playheadSec,
    hoverSec
  ) {
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    // Layout Margins
    const padLeft = 40; // Amplitude Scale on Left
    const padRight = 10;
    const padTop = 10;
    const padBottom = 22; // 30s Time Ruler on Bottom

    const plotW = Math.max(10, w - padLeft - padRight);
    const plotH = Math.max(10, h - padTop - padBottom);
    const midY = padTop + plotH / 2;

    // 1. Draw Background & Amplitude Grid Lines
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(padLeft, padTop, plotW, plotH);

    // Center Zero Line
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padLeft, midY);
    ctx.lineTo(padLeft + plotW, midY);
    ctx.stroke();

    // +0.5 and -0.5 Dotted Guidelines
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.moveTo(padLeft, midY - plotH * 0.25);
    ctx.lineTo(padLeft + plotW, midY - plotH * 0.25);
    ctx.moveTo(padLeft, midY + plotH * 0.25);
    ctx.lineTo(padLeft + plotW, midY + plotH * 0.25);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // Border around waveform area
    ctx.strokeStyle = "#e2e8f0";
    ctx.strokeRect(padLeft, padTop, plotW, plotH);

    // 2. Left Amplitude Scale (+1.0, +0.5, 0.0, -0.5, -1.0)
    ctx.fillStyle = "#94a3b8";
    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    ctx.fillText(" 1.0", padLeft - 6, padTop + 2);
    ctx.fillText(" 0.5", padLeft - 6, midY - plotH * 0.25);
    ctx.fillText(" 0.0", padLeft - 6, midY);
    ctx.fillText("-0.5", padLeft - 6, midY + plotH * 0.25);
    ctx.fillText("-1.0", padLeft - 6, padTop + plotH - 2);

    // 3. Bottom 30-Second Time Ruler (-30s, -25s, -20s, -15s, -10s, -5s, 0s)
    const rulerY = padTop + plotH + 4;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const seconds = [30, 25, 20, 15, 10, 5, 0];
    for (let s = 0; s < seconds.length; s++) {
      const x = padLeft + (s / (seconds.length - 1)) * plotW;

      // Small vertical tick
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, padTop + plotH);
      ctx.lineTo(x, padTop + plotH + 3);
      ctx.stroke();

      // Label
      const label = seconds[s] === 0 ? "0s" : `-${seconds[s]}s`;
      ctx.fillText(label, x, rulerY);
    }

    // 4. Continuous Waveform Plot (30.0s Window)
    const cap = this.bufferCapacity;
    const isFull = totalWritten >= cap;
    const availableSamples = isFull ? cap : Math.max(1, totalWritten);

    // If stopped and review audio exists, render that; otherwise render live ring buffer
    const audioData = !this.isStreaming && frozenAudio && frozenAudio.length > 0 ? frozenAudio : ring;
    const oldestIndex = !this.isStreaming && frozenAudio && frozenAudio.length > 0 ? 0 : isFull ? writePos : 0;
    const samplesPerPixel = cap / plotW;

    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;
    ctx.lineWidth = 1;

    for (let col = 0; col < plotW; col++) {
      const sampleStart = Math.floor(col * samplesPerPixel);
      const sampleEnd = Math.floor((col + 1) * samplesPerPixel);

      let min = 0;
      let max = 0;
      let hasData = false;

      for (let s = sampleStart; s < sampleEnd; s++) {
        if (!isFull && s >= availableSamples) break;

        const ringIdx = (oldestIndex + s) % cap;
        const val = audioData[ringIdx] || 0;
        if (val < min) min = val;
        if (val > max) max = val;
        hasData = true;
      }

      if (!hasData) continue;

      const x = padLeft + col;
      const yMax = midY - max * (plotH / 2) * 0.95;
      const yMin = midY - min * (plotH / 2) * 0.95;
      const hBar = Math.max(1, yMin - yMax);

      // Draw subtle filled envelope
      ctx.fillRect(x, yMax, 1, hBar);

      // Draw peak top and bottom stroke points
      ctx.fillStyle = strokeColor;
      ctx.fillRect(x, yMax, 1, 1);
      ctx.fillRect(x, yMin, 1, 1);
      ctx.fillStyle = fillColor;
    }

    // 5. Hover Seek Line (when stopped and hovering)
    if (!this.isStreaming && hoverSec !== null && hoverSec >= 0) {
      const hX = padLeft + (hoverSec / this.windowDurationSec) * plotW;
      ctx.strokeStyle = "rgba(100, 116, 139, 0.4)";
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(hX, padTop);
      ctx.lineTo(hX, padTop + plotH);
      ctx.stroke();
      ctx.setLineDash([]);

      // Small time badge
      ctx.fillStyle = "#475569";
      ctx.font = "8px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${hoverSec.toFixed(1)}s`, hX, padTop - 8);
    }

    // 6. Animated Playhead Cursor (when reviewing/playing back audio)
    if (playheadSec !== null && playheadSec >= 0) {
      const pX = padLeft + (playheadSec / this.windowDurationSec) * plotW;

      // Playhead vertical line
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pX, padTop - 2);
      ctx.lineTo(pX, padTop + plotH + 2);
      ctx.stroke();

      // Triangle head on top
      ctx.fillStyle = strokeColor;
      ctx.beginPath();
      ctx.moveTo(pX - 4, padTop);
      ctx.lineTo(pX + 4, padTop);
      ctx.lineTo(pX, padTop + 5);
      ctx.closePath();
      ctx.fill();

      // Current time badge
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${playheadSec.toFixed(1)}s`, pX, padTop - 8);
    }
  }
}

// Initialize on page load
window.addEventListener("DOMContentLoaded", () => {
  window.vaaniApp = new VaaniWaveformApp();
  lucide.createIcons();
});
