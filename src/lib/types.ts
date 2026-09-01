// ============================================
// VAANI Type Definitions
// ============================================

export type NoiseType =
  | "helicopter"
  | "gunfire"
  | "engine"
  | "wind"
  | "crowd"
  | "static"
  | "urban"
  | "vehicle";

export type SampleCategory = "military" | "emergency";

export interface AudioSample {
  id: string;
  name: string;
  category: SampleCategory;
  duration: number; // seconds
  noiseProfile: NoiseProfile;
}

export interface NoiseProfile {
  type: NoiseType;
  intensity: number; // 0..1
  /** Base frequency for the noise oscillator (Hz) */
  baseFreq?: number;
  /** Additional description shown in UI */
  label: string;
}

export interface TelemetryData {
  signalLevel: number; // dB
  noiseFloor: number; // dB
  snrGain: number; // dB
  frameLatency: number; // ms
}

export type ViewMode = "waveform" | "spectrogram";

export interface EngineState {
  isPlaying: boolean;
  isIsolationOn: boolean;
  currentTime: number;
  duration: number;
  currentSampleId: string | null;
  viewMode: ViewMode;
  telemetry: TelemetryData;
  isLoading: boolean;
}

export interface AnalyserData {
  timeData: Uint8Array;
  freqData: Uint8Array;
}
