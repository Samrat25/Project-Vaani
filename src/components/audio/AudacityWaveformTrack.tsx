"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import type { ReviewTrack } from "@/lib/types";
import { VaaniAudioEngine } from "@/lib/audioEngine";

interface AudacityWaveformTrackProps {
  trackType: "raw" | "proc";
  title: string;
  badgeDotClass: string;
  strokeColor: string;
  fillColor: string;
  isStreaming: boolean;
  hasRecordedAudio: boolean;
  isReviewPlaying: boolean;
  activeReviewTrack: ReviewTrack;
  engineRef: React.MutableRefObject<VaaniAudioEngine | null>;
  onToggleReview: (trackType: "raw" | "proc") => void;
  onSeekReview: (trackType: "raw" | "proc", fraction: number) => void;
  snrText?: string;
  levelText?: string;
  pesqText?: string;
  stoiText?: string;
}

export default function AudacityWaveformTrack({
  trackType,
  title,
  badgeDotClass,
  strokeColor,
  fillColor,
  isStreaming,
  hasRecordedAudio,
  isReviewPlaying,
  activeReviewTrack,
  engineRef,
  onToggleReview,
  onSeekReview,
  snrText,
  levelText,
  pesqText,
  stoiText,
}: AudacityWaveformTrackProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverSec, setHoverSec] = useState<number | null>(null);

  const isCurrentReviewActive = isReviewPlaying && activeReviewTrack === trackType;

  // Render loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      const engine = engineRef.current;
      if (!canvas || !engine) {
        animId = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animId = requestAnimationFrame(render);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
      }

      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      // Layout Margins
      const padLeft = 38;
      const padRight = 10;
      const padTop = 12;
      const padBottom = 22;

      const plotW = Math.max(10, w - padLeft - padRight);
      const plotH = Math.max(10, h - padTop - padBottom);
      const midY = padTop + plotH / 2;

      // 1. Background & Amplitude Grid Lines
      const isDark = document.documentElement.classList.contains("dark");
      ctx.fillStyle = isDark ? "#0d1117" : "#ffffff";
      ctx.fillRect(padLeft, padTop, plotW, plotH);

      // Center Line
      ctx.strokeStyle = isDark ? "#21262d" : "#cbd5e1";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padLeft, midY);
      ctx.lineTo(padLeft + plotW, midY);
      ctx.stroke();

      // Dotted +/- 0.5 guidelines
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = isDark ? "#161b22" : "#e2e8f0";
      ctx.beginPath();
      ctx.moveTo(padLeft, midY - plotH * 0.25);
      ctx.lineTo(padLeft + plotW, midY - plotH * 0.25);
      ctx.moveTo(padLeft, midY + plotH * 0.25);
      ctx.lineTo(padLeft + plotW, midY + plotH * 0.25);
      ctx.stroke();
      ctx.setLineDash([]);

      // Border around waveform area
      ctx.strokeStyle = isDark ? "#30363d" : "#e2e8f0";
      ctx.strokeRect(padLeft, padTop, plotW, plotH);

      // 2. Left Amplitude Scale (+1.0, +0.5, 0.0, -0.5, -1.0)
      ctx.fillStyle = isDark ? "#8b949e" : "#94a3b8";
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";

      ctx.fillText(" 1.0", padLeft - 5, padTop + 3);
      ctx.fillText(" 0.5", padLeft - 5, midY - plotH * 0.25);
      ctx.fillText(" 0.0", padLeft - 5, midY);
      ctx.fillText("-0.5", padLeft - 5, midY + plotH * 0.25);
      ctx.fillText("-1.0", padLeft - 5, padTop + plotH - 3);

      // 3. Bottom 30-Second Time Ruler
      const rulerY = padTop + plotH + 4;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      const seconds = [30, 25, 20, 15, 10, 5, 0];
      for (let s = 0; s < seconds.length; s++) {
        const x = padLeft + (s / (seconds.length - 1)) * plotW;

        ctx.strokeStyle = isDark ? "#30363d" : "#cbd5e1";
        ctx.beginPath();
        ctx.moveTo(x, padTop + plotH);
        ctx.lineTo(x, padTop + plotH + 3);
        ctx.stroke();

        const label = seconds[s] === 0 ? "0s" : `-${seconds[s]}s`;
        ctx.fillText(label, x, rulerY);
      }

      // 4. Waveform Envelope Plot
      const cap = engine.bufferCapacity;
      const totalWritten = trackType === "raw" ? engine.rawTotalWritten : engine.procTotalWritten;
      const writePos = trackType === "raw" ? engine.rawWritePos : engine.procWritePos;
      const ring = trackType === "raw" ? engine.rawRing : engine.procRing;
      const frozenAudio = trackType === "raw" ? engine.frozenRawAudio : engine.frozenProcAudio;

      const isFull = totalWritten >= cap;
      const availableSamples = isFull ? cap : Math.max(1, totalWritten);

      const audioData =
        !engine.getIsStreaming() && frozenAudio && frozenAudio.length > 0
          ? frozenAudio
          : ring;
      const oldestIndex =
        !engine.getIsStreaming() && frozenAudio && frozenAudio.length > 0
          ? 0
          : isFull
          ? writePos
          : 0;
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

        ctx.fillRect(x, yMax, 1, hBar);

        ctx.fillStyle = strokeColor;
        ctx.fillRect(x, yMax, 1, 1);
        ctx.fillRect(x, yMin, 1, 1);
        ctx.fillStyle = fillColor;
      }

      // 5. Hover Seek Line
      if (!engine.getIsStreaming() && hoverSec !== null && hoverSec >= 0) {
        const hX = padLeft + (hoverSec / engine.windowDurationSec) * plotW;
        ctx.strokeStyle = isDark ? "rgba(148, 163, 184, 0.4)" : "rgba(100, 116, 139, 0.4)";
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(hX, padTop);
        ctx.lineTo(hX, padTop + plotH);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = isDark ? "#cbd5e1" : "#475569";
        ctx.font = "8px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(`${hoverSec.toFixed(1)}s`, hX, padTop - 10);
      }

      // 6. Animated Review Playhead Cursor
      const playheadSec =
        isCurrentReviewActive ? engine.getCurrentPlayheadSec() : null;

      if (playheadSec !== null && playheadSec >= 0) {
        const pX = padLeft + (playheadSec / engine.windowDurationSec) * plotW;

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pX, padTop - 2);
        ctx.lineTo(pX, padTop + plotH + 2);
        ctx.stroke();

        ctx.fillStyle = strokeColor;
        ctx.beginPath();
        ctx.moveTo(pX - 4, padTop);
        ctx.lineTo(pX + 4, padTop);
        ctx.lineTo(pX, padTop + 5);
        ctx.closePath();
        ctx.fill();

        ctx.font = "9px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(`${playheadSec.toFixed(1)}s`, pX, padTop - 10);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    engineRef,
    trackType,
    strokeColor,
    fillColor,
    hoverSec,
    isCurrentReviewActive,
  ]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isStreaming) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const padLeft = 38;
      const plotW = rect.width - padLeft - 10;

      if (x >= padLeft && x <= padLeft + plotW) {
        const fraction = (x - padLeft) / plotW;
        onSeekReview(trackType, fraction);
      }
    },
    [isStreaming, trackType, onSeekReview]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isStreaming) {
        setHoverSec(null);
        return;
      }
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const padLeft = 38;
      const plotW = rect.width - padLeft - 10;

      if (x >= padLeft && x <= padLeft + plotW) {
        const fraction = (x - padLeft) / plotW;
        setHoverSec(fraction * 30.0);
      } else {
        setHoverSec(null);
      }
    },
    [isStreaming]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverSec(null);
  }, []);

  return (
    <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs font-mono transition-colors">
      {/* Track Header */}
      <div className="px-4 py-2.5 bg-slate-50/90 dark:bg-[#0d1117]/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${badgeDotClass}`} />
          <span className="font-bold text-slate-800 dark:text-slate-200 tracking-tight">
            {title}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            30.0s window
          </span>
          {!isStreaming && hasRecordedAudio && (
            <span className="hidden sm:inline text-[11px] text-slate-400 dark:text-slate-500 italic">
              Click waveform to seek
            </span>
          )}
        </div>

        {/* Right Header Badges & Review Play Button */}
        <div className="flex items-center space-x-2 text-[11px]">
          {/* Post-Stop Review Button */}
          {!isStreaming && hasRecordedAudio && (
            <button
              onClick={() => onToggleReview(trackType)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center space-x-1 border transition-all ${
                isCurrentReviewActive
                  ? "bg-rose-600 text-white border-rose-600"
                  : trackType === "raw"
                  ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100"
                  : "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800 hover:bg-teal-100"
              }`}
            >
              <span>{isCurrentReviewActive ? "❚❚ Pause" : trackType === "raw" ? "▶ Play Raw" : "▶ Play Filtered"}</span>
            </button>
          )}

          {snrText && (
            <span
              className={`px-2 py-0.5 rounded border font-semibold ${
                trackType === "raw"
                  ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  : "bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300"
              }`}
            >
              {snrText}
            </span>
          )}

          {pesqText && (
            <span className="hidden md:inline px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold">
              {pesqText}
            </span>
          )}

          {stoiText && (
            <span className="hidden md:inline px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300 font-semibold">
              {stoiText}
            </span>
          )}

          {levelText && (
            <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">
              {levelText}
            </span>
          )}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative w-full h-44 bg-[#fbfcfd] dark:bg-[#0a0d12]">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={`w-full h-full block ${
            !isStreaming && hasRecordedAudio ? "cursor-pointer" : "cursor-default"
          }`}
        />
      </div>
    </div>
  );
}
