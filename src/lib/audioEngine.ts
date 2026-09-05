import {
  AnalyserData,
  TelemetryData,
  ServerHandshake,
  ServerTelemetryMessage,
  ConnectionStatus,
  AudioDevice,
  ReviewTrack,
} from "./types";
import { VaaniSocket } from "./vaaniSocket";

export interface AudioEngineCallbacks {
  onStatusChange?: (status: ConnectionStatus) => void;
  onError?: (error: string) => void;
  onTelemetry?: (telemetry: TelemetryData) => void;
  onHandshake?: (handshake: ServerHandshake) => void;
  onReviewPlaybackEnded?: () => void;
}

export class VaaniAudioEngine {
  private ctx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private micSourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private outputGainNode: GainNode | null = null;
  private rawAnalyser: AnalyserNode | null = null;
  private procAnalyser: AnalyserNode | null = null;

  // Analyser buffers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private rawTimeData: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private rawFreqData: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private procTimeData: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private procFreqData: any = null;

  // 30-Second Continuous Rolling Buffer
  public windowDurationSec: number = 30.0;
  public bufferCapacity: number = Math.round(30.0 * 16000);
  public rawRing: Float32Array = new Float32Array(this.bufferCapacity);
  public procRing: Float32Array = new Float32Array(this.bufferCapacity);
  public rawWritePos: number = 0;
  public procWritePos: number = 0;
  public rawTotalWritten: number = 0;
  public procTotalWritten: number = 0;

  // Post-Stop Review Playback State
  public frozenRawAudio: Float32Array | null = null;
  public frozenProcAudio: Float32Array | null = null;
  private reviewSourceNode: AudioBufferSourceNode | null = null;
  private activeReviewTrack: ReviewTrack = null;
  private reviewStartTimeCtx: number = 0;
  private reviewStartOffsetSec: number = 0;
  private reviewDurationSec: number = 0;
  private isReviewPlaying: boolean = false;

  // Real-time streaming & playback state
  private socket: VaaniSocket | null = null;
  private _isStreaming: boolean = false;
  private _isBypassActive: boolean = false; // true = Raw Mic Bypass; false = DPDFNet-8 AI Filter
  private _isMicMuted: boolean = false;
  private _isSpeakerMuted: boolean = false;
  private _speakerVolume: number = 1.0;
  private nextPlayTime: number = 0;
  private callbacks: AudioEngineCallbacks;

  // Hardware & Session Metadata
  private selectedDeviceId: string = "";
  private availableMics: AudioDevice[] = [];
  private activeModelName: string = "DPDFNet-8 HR (48kHz)";

  // Live telemetry store
  private currentTelemetry: TelemetryData = {
    signalLevel: 0,
    rawLevel: -100,
    suppressionGain: 0,
    frameLatency: 0,
    rawSnr: 0,
    enhancedSnr: 0,
    pesq: 2.5,
    stoi: 0.85,
    framesProcessed: 0,
    chunksReceived: 0,
  };

  constructor(callbacks: AudioEngineCallbacks = {}) {
    this.callbacks = callbacks;
  }

  public async enumerateMics(): Promise<AudioDevice[]> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
      return [];
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices
        .filter((d) => d.kind === "audioinput")
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${index + 1}`,
        }));
      this.availableMics = audioInputs;
      if (audioInputs.length > 0 && !this.selectedDeviceId) {
        this.selectedDeviceId = audioInputs[0].deviceId;
      }
      return audioInputs;
    } catch {
      return [];
    }
  }

  public setDeviceId(deviceId: string): void {
    this.selectedDeviceId = deviceId;
  }

  public async initAudioContext(): Promise<AudioContext> {
    if (!this.ctx || this.ctx.state === "closed") {
      const AudioCtxClass =
        window.AudioContext ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }

    const sampleRate = this.ctx.sampleRate;
    const neededCapacity = Math.round(this.windowDurationSec * sampleRate);
    if (this.bufferCapacity !== neededCapacity) {
      this.bufferCapacity = neededCapacity;
      this.rawRing = new Float32Array(this.bufferCapacity);
      this.procRing = new Float32Array(this.bufferCapacity);
      this.rawWritePos = 0;
      this.procWritePos = 0;
      this.rawTotalWritten = 0;
      this.procTotalWritten = 0;
    }

    // Initialize Analysers if not already initialized
    if (!this.rawAnalyser) {
      this.rawAnalyser = this.ctx.createAnalyser();
      this.rawAnalyser.fftSize = 2048;
      this.rawAnalyser.smoothingTimeConstant = 0.6;
      this.rawTimeData = new Uint8Array(this.rawAnalyser.frequencyBinCount);
      this.rawFreqData = new Uint8Array(this.rawAnalyser.frequencyBinCount);
    }

    if (!this.procAnalyser) {
      this.procAnalyser = this.ctx.createAnalyser();
      this.procAnalyser.fftSize = 2048;
      this.procAnalyser.smoothingTimeConstant = 0.6;
      this.procTimeData = new Uint8Array(this.procAnalyser.frequencyBinCount);
      this.procFreqData = new Uint8Array(this.procAnalyser.frequencyBinCount);
    }

    // Output Speaker Gain Node
    if (!this.outputGainNode) {
      this.outputGainNode = this.ctx.createGain();
      const vol = this._isSpeakerMuted ? 0 : this._speakerVolume;
      this.outputGainNode.gain.setValueAtTime(vol, this.ctx.currentTime);
      this.outputGainNode.connect(this.ctx.destination);
    }

    return this.ctx;
  }

  public async startStream(): Promise<void> {
    if (this._isStreaming) return;
    this.stopReviewPlayback(); // Stop any active playback review

    try {
      const ctx = await this.initAudioContext();
      this.callbacks.onStatusChange?.("connecting");

      // 1. Connect WebSocket
      this.socket = new VaaniSocket({
        onStatusChange: (status) => this.callbacks.onStatusChange?.(status),
        onError: (err) => this.callbacks.onError?.(err),
        onHandshake: (handshake) => {
          this.activeModelName = handshake.model || "DPDFNet-8 HR";
          this.callbacks.onHandshake?.(handshake);
        },
        onTelemetry: (telemetryMsg) => {
          this.handleServerTelemetry(telemetryMsg);
        },
        onEnhancedAudio: (float32Chunk) => {
          this.handleEnhancedAudioChunk(float32Chunk);
        },
      });

      await this.socket.connect(ctx.sampleRate);

      // 2. Request microphone input
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: this.selectedDeviceId ? { exact: this.selectedDeviceId } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      };

      try {
        this.micStream = await navigator.mediaDevices.getUserMedia(constraints);
        await this.enumerateMics();
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? `Microphone access denied: ${err.message}`
            : "Microphone access denied";
        this.callbacks.onError?.(msg);
        this.stopStream();
        throw new Error(msg);
      }

      this.micSourceNode = ctx.createMediaStreamSource(this.micStream);

      // Connect mic to rawAnalyser
      if (this.rawAnalyser) {
        this.micSourceNode.connect(this.rawAnalyser);
      }

      // 3. Audio Processor (1024 buffer size)
      const bufferSize = 1024;
      this.processorNode = ctx.createScriptProcessor(bufferSize, 1, 1);

      this.processorNode.onaudioprocess = (e: AudioProcessingEvent) => {
        if (!this._isStreaming) return;

        const inputChannel = e.inputBuffer.getChannelData(0);

        // Push raw samples into continuous 30-second rolling ring buffer
        this.pushToRing(this.rawRing, inputChannel, "raw");

        // Calculate raw input RMS dB level
        let sumSq = 0;
        for (let i = 0; i < inputChannel.length; i++) {
          sumSq += inputChannel[i] * inputChannel[i];
        }
        const rms = Math.sqrt(sumSq / inputChannel.length);
        const rawDb = rms > 0.0001 ? 20 * Math.log10(rms) : -100;
        this.currentTelemetry.rawLevel = Math.round(rawDb * 10) / 10;

        // If mic is muted, send silence
        const sendAudio = new Float32Array(inputChannel.length);
        if (!this._isMicMuted) {
          sendAudio.set(inputChannel);
        }

        // Convert Float32 to Int16 PCM (clamp to [-1, 1], scale by 0x8000/0x7fff)
        const pcm16 = new Int16Array(sendAudio.length);
        for (let i = 0; i < sendAudio.length; i++) {
          const s = Math.max(-1.0, Math.min(1.0, sendAudio[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Stream binary chunk to WebSocket
        if (this.socket && this.socket.isOpen) {
          this.socket.sendAudioChunk(pcm16);
        }

        // Handle Bypass Audio: output raw mic directly to speaker if bypass is active
        if (this._isBypassActive && !this._isSpeakerMuted && this.outputGainNode) {
          e.outputBuffer.getChannelData(0).set(sendAudio);
        } else {
          // Silence direct processor output so filtered WebSocket stream handles speaker
          e.outputBuffer.getChannelData(0).fill(0);
        }
      };

      this.micSourceNode.connect(this.processorNode);
      this.processorNode.connect(ctx.destination);

      this._isStreaming = true;
      this.nextPlayTime = 0;
      this.callbacks.onStatusChange?.("connected");
    } catch (err: unknown) {
      this.stopStream();
      const msg = err instanceof Error ? err.message : "Failed to start audio stream";
      this.callbacks.onError?.(msg);
      throw err;
    }
  }

  private handleEnhancedAudioChunk(float32Array: Float32Array) {
    if (!this._isStreaming || !this.ctx) return;

    // Push into 30-second continuous rolling ring buffer
    this.pushToRing(this.procRing, float32Array, "proc");

    // Calculate processed RMS dB
    let sumSq = 0;
    for (let i = 0; i < float32Array.length; i++) {
      sumSq += float32Array[i] * float32Array[i];
    }
    const rms = Math.sqrt(sumSq / float32Array.length);
    const procDb = rms > 0.0001 ? 20 * Math.log10(rms) : -100;
    this.currentTelemetry.signalLevel = Math.round(procDb * 10) / 10;

    // Play enhanced audio through speakers ONLY if not in bypass mode and speaker not muted
    if (!this._isBypassActive && !this._isSpeakerMuted && this.outputGainNode) {
      const audioBuf = this.ctx.createBuffer(
        1,
        float32Array.length,
        this.ctx.sampleRate
      );
      audioBuf.getChannelData(0).set(float32Array);

      const source = this.ctx.createBufferSource();
      source.buffer = audioBuf;

      // Connect source through procAnalyser
      if (this.procAnalyser) {
        source.connect(this.procAnalyser);
        this.procAnalyser.connect(this.outputGainNode);
      } else {
        source.connect(this.outputGainNode);
      }

      const now = this.ctx.currentTime;
      if (this.nextPlayTime < now) {
        this.nextPlayTime = now + 0.02; // 20ms jitter margin
      }

      source.start(this.nextPlayTime);
      this.nextPlayTime += audioBuf.duration;
    }
  }

  private handleServerTelemetry(msg: ServerTelemetryMessage) {
    if (!msg.metrics) return;
    const m = msg.metrics;

    this.currentTelemetry = {
      signalLevel:
        m.signal_level_db !== undefined
          ? m.signal_level_db
          : this.currentTelemetry.signalLevel,
      rawLevel:
        m.raw_level_db !== undefined
          ? m.raw_level_db
          : this.currentTelemetry.rawLevel,
      suppressionGain:
        m.suppression_gain_db !== undefined
          ? m.suppression_gain_db
          : Math.max(0, this.currentTelemetry.rawLevel - this.currentTelemetry.signalLevel),
      frameLatency: m.latency_ms !== undefined ? m.latency_ms : 0,
      rawSnr: m.raw_snr,
      enhancedSnr: m.enhanced_snr,
      pesq: m.pesq,
      stoi: m.stoi,
      framesProcessed: m.frames_processed,
      chunksReceived: msg.stats?.chunks,
    };

    this.callbacks.onTelemetry?.(this.currentTelemetry);
  }

  public pushToRing(ring: Float32Array, samples: Float32Array, type: "raw" | "proc") {
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

  public extractChronologicalAudio(type: "raw" | "proc"): Float32Array {
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

  public stopStream(): void {
    this._isStreaming = false;

    // Flush and close WebSocket
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    // Stop and disconnect microphone
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }

    if (this.micSourceNode) {
      this.micSourceNode.disconnect();
      this.micSourceNode = null;
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }

    // Freeze recorded audio buffers for click-to-play review
    this.frozenRawAudio = this.extractChronologicalAudio("raw");
    this.frozenProcAudio = this.extractChronologicalAudio("proc");

    this.nextPlayTime = 0;
    this.callbacks.onStatusChange?.("disconnected");
  }

  // --------------------------------------------------------------------------
  // Post-Stop Review Playback (Click on Waveform to Play)
  // --------------------------------------------------------------------------

  public async startReviewPlayback(trackType: "raw" | "proc", fraction: number = 0): Promise<void> {
    if (this._isStreaming) return;

    const audioData = trackType === "raw" ? this.frozenRawAudio : this.frozenProcAudio;
    if (!audioData || audioData.length === 0) return;

    const ctx = await this.initAudioContext();
    this.stopReviewPlayback();

    const sampleRate = ctx.sampleRate;
    const totalDuration = audioData.length / sampleRate;
    let startOffset = fraction * this.windowDurationSec;
    if (startOffset > totalDuration) {
      startOffset = 0;
    }

    const audioBuf = ctx.createBuffer(1, audioData.length, sampleRate);
    audioBuf.getChannelData(0).set(audioData);

    this.reviewSourceNode = ctx.createBufferSource();
    this.reviewSourceNode.buffer = audioBuf;

    if (this.outputGainNode) {
      const curVol = this._isSpeakerMuted ? 0.0 : this._speakerVolume;
      this.outputGainNode.gain.setValueAtTime(curVol, ctx.currentTime);
      this.reviewSourceNode.connect(this.outputGainNode);
    }

    this.reviewStartTimeCtx = ctx.currentTime;
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
  }

  public stopReviewPlayback(): void {
    if (this.reviewSourceNode) {
      try {
        this.reviewSourceNode.stop();
        this.reviewSourceNode.disconnect();
      } catch {
        // Ignore already stopped
      }
      this.reviewSourceNode = null;
    }
    this.isReviewPlaying = false;
    this.activeReviewTrack = null;
    this.callbacks.onReviewPlaybackEnded?.();
  }

  public toggleReviewPlayback(trackType: "raw" | "proc"): void {
    if (this.isReviewPlaying && this.activeReviewTrack === trackType) {
      this.stopReviewPlayback();
    } else {
      this.startReviewPlayback(trackType, 0);
    }
  }

  public getCurrentPlayheadSec(): number | null {
    if (!this.isReviewPlaying || !this.ctx) return null;
    const elapsed = this.ctx.currentTime - this.reviewStartTimeCtx;
    const current = this.reviewStartOffsetSec + elapsed;
    if (current > this.reviewDurationSec) {
      return null;
    }
    return current;
  }

  public getIsReviewPlaying(): boolean {
    return this.isReviewPlaying;
  }

  public getActiveReviewTrack(): ReviewTrack {
    return this.activeReviewTrack;
  }

  // --------------------------------------------------------------------------
  // Controls
  // --------------------------------------------------------------------------

  public toggleBypass(): boolean {
    this._isBypassActive = !this._isBypassActive;
    return this._isBypassActive;
  }

  public toggleMuteMic(): boolean {
    this._isMicMuted = !this._isMicMuted;
    return this._isMicMuted;
  }

  public toggleMuteSpeaker(): boolean {
    this._isSpeakerMuted = !this._isSpeakerMuted;
    if (this.outputGainNode && this.ctx) {
      const vol = this._isSpeakerMuted ? 0 : this._speakerVolume;
      this.outputGainNode.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
    return this._isSpeakerMuted;
  }

  public setVolume(volume: number): void {
    this._speakerVolume = Math.max(0, Math.min(1, volume));
    if (this.outputGainNode && this.ctx && !this._isSpeakerMuted) {
      this.outputGainNode.gain.setValueAtTime(
        this._speakerVolume,
        this.ctx.currentTime
      );
    }
  }

  public getRawAnalyserData(): AnalyserData {
    if (this.rawAnalyser && this.rawTimeData && this.rawFreqData) {
      this.rawAnalyser.getByteTimeDomainData(this.rawTimeData);
      this.rawAnalyser.getByteFrequencyData(this.rawFreqData);
      return { timeData: this.rawTimeData, freqData: this.rawFreqData };
    }
    return { timeData: new Uint8Array(), freqData: new Uint8Array() };
  }

  public getProcessedAnalyserData(): AnalyserData {
    if (this.procAnalyser && this.procTimeData && this.procFreqData) {
      this.procAnalyser.getByteTimeDomainData(this.procTimeData);
      this.procAnalyser.getByteFrequencyData(this.procFreqData);
      return { timeData: this.procTimeData, freqData: this.procFreqData };
    }
    return { timeData: new Uint8Array(), freqData: new Uint8Array() };
  }

  public getTelemetry(): TelemetryData {
    return this.currentTelemetry;
  }

  public getIsStreaming(): boolean {
    return this._isStreaming;
  }

  public getIsBypassActive(): boolean {
    return this._isBypassActive;
  }

  public getIsMicMuted(): boolean {
    return this._isMicMuted;
  }

  public getIsSpeakerMuted(): boolean {
    return this._isSpeakerMuted;
  }

  public getSpeakerVolume(): number {
    return this._speakerVolume;
  }

  public getActiveModelName(): string {
    return this.activeModelName;
  }

  public destroy(): void {
    this.stopReviewPlayback();
    this.stopStream();
    if (this.outputGainNode) {
      this.outputGainNode.disconnect();
      this.outputGainNode = null;
    }
    if (this.ctx && this.ctx.state !== "closed") {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
