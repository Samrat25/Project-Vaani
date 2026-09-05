// ============================================
// VAANI Type Definitions
// ============================================

export type ViewMode = "waveform" | "spectrogram";

export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "error"
  | "disconnected";

export interface TelemetryData {
  signalLevel: number; // dBFS (e.g. -24.5)
  rawLevel: number; // dBFS (e.g. -18.2)
  suppressionGain: number; // dB (e.g. 15.2)
  frameLatency: number; // ms (e.g. 2.8)
  rawSnr?: number; // dB
  enhancedSnr?: number; // dB
  pesq?: number; // 1.0 - 4.5
  stoi?: number; // 0.0 - 1.0
  framesProcessed?: number;
  chunksReceived?: number;
}

export interface EngineState {
  isStreaming: boolean;
  isIsolationOn: boolean; // true: AI enhanced speech; false: raw bypass
  isMicMuted: boolean;
  isSpeakerMuted: boolean;
  connectionStatus: ConnectionStatus;
  errorMessage: string | null;
  activeMicLabel: string;
  activeModelName: string;
  streamDuration: number; // seconds
  viewMode: ViewMode;
  telemetry: TelemetryData;
}

export interface AnalyserData {
  timeData: Uint8Array;
  freqData: Uint8Array;
}

// Handshake metadata from server
export interface ServerHandshake {
  type: "handshake";
  session_id: string;
  model: string;
  model_sample_rate: number;
  default_sample_rate: number;
  audio_format: string;
  status: string;
}

// Server telemetry JSON message
export interface ServerTelemetryMessage {
  type: "telemetry";
  session_id: string;
  metrics: {
    signal_level_db?: number;
    raw_level_db?: number;
    suppression_gain_db?: number;
    latency_ms?: number;
    raw_snr?: number;
    enhanced_snr?: number;
    pesq?: number;
    stoi?: number;
    frames_processed?: number;
  };
  stats?: {
    chunks?: number;
    bytes_in?: number;
    bytes_out?: number;
  };
}
