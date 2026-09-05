import {
  AnalyserData,
  TelemetryData,
  ServerHandshake,
  ServerTelemetryMessage,
  ConnectionStatus,
} from "./types";
import { VaaniSocket } from "./vaaniSocket";

export interface AudioEngineCallbacks {
  onStatusChange?: (status: ConnectionStatus) => void;
  onError?: (error: string) => void;
  onTelemetry?: (telemetry: TelemetryData) => void;
  onHandshake?: (handshake: ServerHandshake) => void;
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

  // Real-time streaming & playback state
  private socket: VaaniSocket | null = null;
  private _isStreaming: boolean = false;
  private _isIsolationOn: boolean = true; // true = AI Enhanced; false = Raw Bypass
  private _isMicMuted: boolean = false;
  private _isSpeakerMuted: boolean = false;
  private _speakerVolume: number = 1.0;
  private nextPlayTime: number = 0;
  private callbacks: AudioEngineCallbacks;

  // Device & session metadata
  private activeMicLabel: string = "Default Microphone";
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

    // Output Speaker Node
    if (!this.outputGainNode) {
      this.outputGainNode = this.ctx.createGain();
      const vol = this._isSpeakerMuted ? 0 : this._speakerVolume;
      this.outputGainNode.gain.setValueAtTime(vol, this.ctx.currentTime);
      this.procAnalyser.connect(this.outputGainNode);
      this.outputGainNode.connect(this.ctx.destination);
    }

    return this.ctx;
  }

  public async startStream(): Promise<void> {
    if (this._isStreaming) return;

    try {
      const ctx = await this.initAudioContext();
      this.callbacks.onStatusChange?.("connecting");

      // 1. Initialize WebSocket
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

      // Connect to WebSocket using the browser's exact sample rate
      await this.socket.connect(ctx.sampleRate);

      // 2. Request user microphone (raw input, no browser AEC/NS/AGC)
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      };

      try {
        this.micStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? `Microphone access denied: ${err.message}`
            : "Microphone access denied";
        this.callbacks.onError?.(msg);
        this.stopStream();
        throw new Error(msg);
      }

      // Read active microphone label
      const audioTracks = this.micStream.getAudioTracks();
      if (audioTracks.length > 0 && audioTracks[0].label) {
        this.activeMicLabel = audioTracks[0].label;
      }

      this.micSourceNode = ctx.createMediaStreamSource(this.micStream);

      // Connect mic to rawAnalyser for real-time visualizer
      if (this.rawAnalyser) {
        this.micSourceNode.connect(this.rawAnalyser);
      }

      // 3. Setup ScriptProcessor for streaming audio chunks
      const bufferSize = 1024;
      this.processorNode = ctx.createScriptProcessor(bufferSize, 1, 1);

      this.processorNode.onaudioprocess = (e: AudioProcessingEvent) => {
        if (!this._isStreaming) return;

        const inputChannel = e.inputBuffer.getChannelData(0);

        // Calculate input RMS dB level
        let sumSq = 0;
        for (let i = 0; i < inputChannel.length; i++) {
          sumSq += inputChannel[i] * inputChannel[i];
        }
        const rms = Math.sqrt(sumSq / inputChannel.length);
        const rawDb = rms > 0.0001 ? 20 * Math.log10(rms) : -100;
        this.currentTelemetry.rawLevel = Math.round(rawDb * 10) / 10;

        // If mic is muted, zero out buffer
        const sendAudio = new Float32Array(inputChannel.length);
        if (!this._isMicMuted) {
          sendAudio.set(inputChannel);
        }

        // Convert Float32 to Int16 PCM
        const pcm16 = new Int16Array(sendAudio.length);
        for (let i = 0; i < sendAudio.length; i++) {
          const s = Math.max(-1.0, Math.min(1.0, sendAudio[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Stream binary PCM16 to WebSocket
        if (this.socket && this.socket.isOpen) {
          this.socket.sendAudioChunk(pcm16);
        }

        // Handle Audio Bypass (when Voice Isolation is OFF)
        if (!this._isIsolationOn && !this._isSpeakerMuted && this.outputGainNode) {
          e.outputBuffer.getChannelData(0).set(sendAudio);
        } else {
          // Silence direct processor output so enhanced WebSocket stream handles speaker
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

    // Calculate processed RMS dB
    let sumSq = 0;
    for (let i = 0; i < float32Array.length; i++) {
      sumSq += float32Array[i] * float32Array[i];
    }
    const rms = Math.sqrt(sumSq / float32Array.length);
    const procDb = rms > 0.0001 ? 20 * Math.log10(rms) : -100;
    this.currentTelemetry.signalLevel = Math.round(procDb * 10) / 10;

    // Play enhanced audio through speakers ONLY if Isolation is ON and Speaker not muted
    if (this._isIsolationOn && !this._isSpeakerMuted && this.outputGainNode) {
      const audioBuf = this.ctx.createBuffer(
        1,
        float32Array.length,
        this.ctx.sampleRate
      );
      audioBuf.getChannelData(0).set(float32Array);

      const source = this.ctx.createBufferSource();
      source.buffer = audioBuf;

      // Connect source through procAnalyser so enhanced waveform visualizer animates
      if (this.procAnalyser) {
        source.connect(this.procAnalyser);
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

  public stopStream(): void {
    this._isStreaming = false;

    // Flush and close WebSocket cleanly
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

    this.nextPlayTime = 0;
    this.callbacks.onStatusChange?.("disconnected");
  }

  public toggleIsolation(on: boolean): void {
    this._isIsolationOn = on;
  }

  public toggleMuteMic(muted: boolean): void {
    this._isMicMuted = muted;
  }

  public toggleMuteSpeaker(muted: boolean): void {
    this._isSpeakerMuted = muted;
    if (this.outputGainNode && this.ctx) {
      const vol = muted ? 0 : this._speakerVolume;
      this.outputGainNode.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
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

  public getIsIsolationOn(): boolean {
    return this._isIsolationOn;
  }

  public getActiveMicLabel(): string {
    return this.activeMicLabel;
  }

  public getActiveModelName(): string {
    return this.activeModelName;
  }

  public destroy(): void {
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
