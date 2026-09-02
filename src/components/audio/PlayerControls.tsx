"use client";

import React from "react";
import type { ViewMode } from "@/lib/types";

interface PlayerControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isIsolationOn: boolean;
  viewMode: ViewMode;
  isLoading: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onToggleIsolation: () => void;
  onSetViewMode: (mode: ViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export default function PlayerControls({
  isPlaying,
  currentTime,
  duration,
  isIsolationOn,
  viewMode,
  isLoading,
  onPlay,
  onPause,
  onSeek,
  onToggleIsolation,
  onSetViewMode,
  onPrev,
  onNext,
}: PlayerControlsProps): React.JSX.Element {
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(pos * duration);
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between py-3.5 px-5 border-t border-vaani-border bg-vaani-surface gap-4 font-mono">
      {/* Left: Playback Transport Buttons */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-center">
        <button
          onClick={onPrev}
          disabled={isLoading}
          aria-label="Previous Track"
          className="p-2 rounded border border-vaani-border bg-vaani-card hover:border-vaani-accent text-vaani-text-muted hover:text-vaani-text transition-colors disabled:opacity-30"
        >
          <span className="text-xs font-bold font-mono">&lt;&lt;</span>
        </button>

        <button
          onClick={isPlaying ? onPause : onPlay}
          disabled={isLoading}
          aria-label={isPlaying ? "Pause" : "Play"}
          className={`flex items-center justify-center px-5 py-2 rounded font-extrabold text-xs uppercase tracking-wider transition-all shadow-glow-sm ${
            isPlaying
              ? "bg-vaani-accent text-black hover:bg-vaani-accent-light"
              : "bg-vaani-accent text-black hover:bg-vaani-accent-light hover:shadow-glow"
          } disabled:opacity-40`}
        >
          {isLoading ? (
            <span className="animate-spin text-xs">⟳</span>
          ) : isPlaying ? (
            <span className="flex items-center gap-1.5">
              <span>❚❚</span> <span>PAUSE</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span>▶</span> <span>PLAY</span>
            </span>
          )}
        </button>

        <button
          onClick={onNext}
          disabled={isLoading}
          aria-label="Next Track"
          className="p-2 rounded border border-vaani-border bg-vaani-card hover:border-vaani-accent text-vaani-text-muted hover:text-vaani-text transition-colors disabled:opacity-30"
        >
          <span className="text-xs font-bold font-mono">&gt;&gt;</span>
        </button>
      </div>

      {/* Center: Interactive Scrubber Progress Bar */}
      <div className="flex-1 w-full flex flex-col gap-1.5 px-0 md:px-4">
        <div
          className="h-2 w-full bg-vaani-card rounded-full cursor-pointer relative group border border-vaani-border-subtle overflow-hidden"
          onClick={handleProgressClick}
        >
          {/* Progress fill */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-vaani-accent to-vaani-highlight rounded-full transition-all duration-75"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {/* Time Counters */}
        <div className="flex justify-between text-[0.68rem] text-vaani-text-dim font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right: View Mode & Voice Isolation Toggles */}
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
          className={`flex items-center gap-2 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider rounded border transition-all ${
            isIsolationOn
              ? "bg-vaani-accent text-black border-vaani-accent shadow-glow"
              : "border-vaani-border bg-vaani-card text-vaani-text-muted hover:border-vaani-accent hover:text-vaani-text"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full transition-colors ${
              isIsolationOn ? "bg-black animate-pulse" : "bg-vaani-border"
            }`}
          />
          <span>Voice Isolation: {isIsolationOn ? "ON" : "OFF"}</span>
        </button>
      </div>
    </div>
  );
}
