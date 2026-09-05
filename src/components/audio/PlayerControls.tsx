"use client";

import React from "react";
import type { ViewMode, ConnectionStatus } from "@/lib/types";

interface PlayerControlsProps {
  isStreaming: boolean;
  connectionStatus: ConnectionStatus;
  streamDuration: number;
  isIsolationOn: boolean;
  viewMode: ViewMode;
  onToggleStream: () => void;
  onToggleIsolation: () => void;
  onSetViewMode: (mode: ViewMode) => void;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export default function PlayerControls({
  isStreaming,
  connectionStatus,
  streamDuration,
  isIsolationOn,
  viewMode,
  onToggleStream,
  onToggleIsolation,
  onSetViewMode,
}: PlayerControlsProps): React.JSX.Element {
  const isConnecting = connectionStatus === "connecting";

  return (
    <div className="flex flex-col md:flex-row items-center justify-between py-3.5 px-5 border-t border-vaani-border bg-vaani-surface gap-4 font-mono">
      {/* Left: Primary Start/Stop Stream Button */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-center">
        <button
          onClick={onToggleStream}
          disabled={isConnecting}
          aria-label={isStreaming ? "Stop Live Audio Stream" : "Start Live Audio Stream"}
          className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded font-extrabold text-xs uppercase tracking-wider transition-all shadow-glow-sm ${
            isStreaming
              ? "bg-rose-600 text-white hover:bg-rose-500 shadow-rose-900/40"
              : "bg-vaani-accent text-black hover:bg-vaani-accent-light hover:shadow-glow"
          } disabled:opacity-40 active:scale-[0.98]`}
        >
          {isConnecting ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin text-xs">⟳</span>
              <span>CONNECTING...</span>
            </span>
          ) : isStreaming ? (
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              <span>STOP STREAM</span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span>▶</span>
              <span>START LIVE MIC STREAM</span>
            </span>
          )}
        </button>
      </div>

      {/* Center: Live Transmission Indicator & Elapsed Timer */}
      <div className="flex-1 w-full flex items-center justify-center gap-4 px-0 md:px-4">
        {isStreaming ? (
          <div className="flex items-center gap-3 bg-vaani-card/80 border border-vaani-accent/30 px-4 py-1.5 rounded-full shadow-glow-sm">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-vaani-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-vaani-accent" />
            </span>
            <span className="text-xs font-bold tracking-widest text-vaani-accent uppercase">
              LIVE TRANSMISSION
            </span>
            <span className="text-xs text-vaani-text font-bold tabular-nums">
              {formatTime(streamDuration)}
            </span>
          </div>
        ) : (
          <div className="text-xs text-vaani-text-dim uppercase tracking-wider flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-vaani-border" />
            <span>MIC STANDBY — CLICK START TO STREAM TO DPDFNET-8</span>
          </div>
        )}
      </div>

      {/* Right: View Mode & Voice Isolation Master Switch */}
      <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
        {/* Spectrogram Toggle */}
        <button
          onClick={() => onSetViewMode(viewMode === "waveform" ? "spectrogram" : "waveform")}
          className={`px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-wider rounded border transition-all ${
            viewMode === "spectrogram"
              ? "bg-vaani-cyan/20 border-vaani-cyan text-vaani-cyan shadow-glow-cyan"
              : "border-vaani-border bg-vaani-card text-vaani-text-muted hover:text-vaani-text"
          }`}
        >
          Spectrogram
        </button>

        {/* Voice Isolation Master Switch */}
        <button
          onClick={onToggleIsolation}
          title={isIsolationOn ? "DPDFNet-8 Neural Denoising Active" : "Raw Microphone Bypass Active"}
          className={`flex items-center gap-2 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider rounded border transition-all ${
            isIsolationOn
              ? "bg-vaani-accent text-black border-vaani-accent shadow-glow"
              : "border-amber-500/50 bg-amber-500/10 text-amber-400 hover:border-amber-400"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full transition-colors ${
              isIsolationOn ? "bg-black animate-pulse" : "bg-amber-400"
            }`}
          />
          <span>{isIsolationOn ? "VOICE ISOLATION: ON" : "RAW BYPASS"}</span>
        </button>
      </div>
    </div>
  );
}
