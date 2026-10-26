"use client";

import React from "react";
import type { ConnectionStatus } from "@/lib/types";

interface LiveSessionHudProps {
  connectionStatus: ConnectionStatus;
  isStreaming: boolean;
  activeMicLabel: string;
  activeModelName: string;
  isMicMuted: boolean;
  isSpeakerMuted: boolean;
  onToggleMuteMic: () => void;
  onToggleMuteSpeaker: () => void;
}

export default function Playlist({
  connectionStatus,
  isStreaming,
  activeMicLabel,
  activeModelName,
  isMicMuted,
  isSpeakerMuted,
  onToggleMuteMic,
  onToggleMuteSpeaker,
}: LiveSessionHudProps): React.JSX.Element {
  const getStatusBadge = () => {
    switch (connectionStatus) {
      case "connected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider bg-vaani-emerald/10 border border-vaani-emerald/40 text-vaani-emerald shadow-glow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-vaani-emerald animate-pulse" />
            ONLINE
          </span>
        );
      case "connecting":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/40 text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-spin" />
            CONNECTING
          </span>
        );
      case "error":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider bg-rose-500/10 border border-rose-500/40 text-rose-400">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            OFFLINE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider bg-vaani-border/40 border border-vaani-border text-vaani-text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-vaani-text-dim" />
            STANDBY
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full p-4 font-mono select-none">
      {/* HUD Header */}
      <div className="flex items-center justify-between pb-3 border-b border-vaani-border-subtle mb-4">
        <span className="text-[0.65rem] font-bold uppercase tracking-widest text-vaani-text-dim">
          HARDWARE &amp; SESSION HUD
        </span>
        {getStatusBadge()}
      </div>

      <div className="space-y-4 text-xs">
        {/* Active Microphone Card */}
        <div className="p-3 rounded-lg border border-vaani-border bg-vaani-card/60 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[0.65rem] text-vaani-text-dim font-bold uppercase tracking-wider">
            <span>MIC INPUT</span>
            <span className={isStreaming ? "text-vaani-accent font-bold" : "text-vaani-text-dim"}>
              {isStreaming ? "CAPTURING" : "READY"}
            </span>
          </div>
          <div className="font-bold text-vaani-text text-xs truncate" title={activeMicLabel}>
            {activeMicLabel}
          </div>
          <div className="text-[0.68rem] text-vaani-text-muted flex items-center justify-between pt-1 border-t border-vaani-border-subtle">
            <span>AEC / AGC / NS:</span>
            <span className="text-vaani-cyan font-bold">DISABLED (RAW)</span>
          </div>
        </div>

        {/* Active ONNX Model Card */}
        <div className="p-3 rounded-lg border border-vaani-border bg-vaani-card/60 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[0.65rem] text-vaani-text-dim font-bold uppercase tracking-wider">
            <span>INFERENCE MODEL</span>
            <span className="text-vaani-emerald font-bold">ONNX HR</span>
          </div>
          <div className="font-bold text-vaani-text text-xs truncate" title={activeModelName}>
            {activeModelName}
          </div>
          <div className="text-[0.68rem] text-vaani-text-muted flex items-center justify-between pt-1 border-t border-vaani-border-subtle">
            <span>ARCHITECTURE:</span>
            <span className="text-vaani-text font-bold">Vorbis STFT + GRU</span>
          </div>
        </div>

        {/* Backend Streaming Target */}
        <div className="p-3 rounded-lg border border-vaani-border bg-vaani-card/60 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[0.65rem] text-vaani-text-dim font-bold uppercase tracking-wider">
            <span>STREAMING ENDPOINT</span>
            <span className="text-vaani-cyan font-bold">WS DUPLEX</span>
          </div>
          <div className="font-mono text-[0.7rem] text-vaani-text-dim truncate">
            {process.env.NEXT_PUBLIC_VAANI_WS_URL || "wss://vaani-backend-qe3r.onrender.com/ws/stream"}
          </div>
          <div className="text-[0.68rem] text-vaani-text-muted flex items-center justify-between pt-1 border-t border-vaani-border-subtle">
            <span>CHUNK PROTOCOL:</span>
            <span className="text-vaani-accent font-bold">1024 Int16 PCM</span>
          </div>
        </div>

        {/* Hardware Toggles: Mute Mic & Mute Speaker */}
        <div className="pt-2 grid grid-cols-2 gap-2">
          <button
            onClick={onToggleMuteMic}
            className={`px-2.5 py-2 rounded text-[0.68rem] font-extrabold uppercase tracking-wider border transition-all ${
              isMicMuted
                ? "bg-rose-500/20 border-rose-500 text-rose-400"
                : "bg-vaani-card border-vaani-border text-vaani-text hover:border-vaani-accent"
            }`}
          >
            {isMicMuted ? "MIC MUTED" : "MUTE MIC"}
          </button>

          <button
            onClick={onToggleMuteSpeaker}
            className={`px-2.5 py-2 rounded text-[0.68rem] font-extrabold uppercase tracking-wider border transition-all ${
              isSpeakerMuted
                ? "bg-rose-500/20 border-rose-500 text-rose-400"
                : "bg-vaani-card border-vaani-border text-vaani-text hover:border-vaani-accent"
            }`}
          >
            {isSpeakerMuted ? "SPEAKER MUTED" : "MUTE SPKR"}
          </button>
        </div>
      </div>
    </div>
  );
}
