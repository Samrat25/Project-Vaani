"use client";

import React, { useRef } from "react";
import type { AnalyserData, ViewMode } from "@/lib/types";
import { useCanvasRenderer } from "@/hooks/useCanvasRenderer";

interface WaveformVisualizerProps {
  getRawData: () => AnalyserData | undefined;
  getProcData: () => AnalyserData | undefined;
  viewMode: ViewMode;
  isActive: boolean;
}

export default function WaveformVisualizer({
  getRawData,
  getProcData,
  viewMode,
  isActive,
}: WaveformVisualizerProps): React.JSX.Element {
  const rawCanvasRef = useRef<HTMLCanvasElement>(null);
  const procCanvasRef = useRef<HTMLCanvasElement>(null);

  // Raw Audio Canvas: Electric Amber-Orange
  useCanvasRenderer(rawCanvasRef, getRawData, {
    mode: viewMode,
    color: "rgba(255, 107, 0, 0.65)",
    accentColor: "#FF8C38",
    isActive,
  });

  // Processed Audio Canvas: Radiant Cyan / White
  useCanvasRenderer(procCanvasRef, getProcData, {
    mode: viewMode,
    color: "rgba(0, 240, 255, 0.75)",
    accentColor: "#FFFFFF",
    isActive,
  });

  return (
    <div className="relative w-full h-full min-h-[260px] md:min-h-[340px] bg-[#0A0C10] overflow-hidden">
      {/* Background Subtle Grid Lines */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

      {/* Top Overlay Legend & Mode Badge */}
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between z-10 font-mono text-[0.65rem] pointer-events-none">
        {/* Legend */}
        <div className="flex items-center gap-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded border border-white/10">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#FF6B00] shadow-glow-sm" />
            <span className="text-white/80 font-bold">RAW / NOISE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-vaani-cyan shadow-glow-cyan" />
            <span className="text-white/80 font-bold">ISOLATED VOICE</span>
          </div>
        </div>

        {/* View Mode Indicator */}
        <div className="bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded border border-white/10 text-vaani-text-dim uppercase font-bold tracking-wider">
          VIEW: <span className="text-vaani-accent">{viewMode}</span>
        </div>
      </div>

      {/* Dual Overlaid Canvases */}
      <canvas
        ref={rawCanvasRef}
        className="absolute inset-0 w-full h-full block pointer-events-none"
      />
      <canvas
        ref={procCanvasRef}
        className="absolute inset-0 w-full h-full block pointer-events-none"
      />

      {/* Idle State Prompt if not active */}
      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
          <div className="px-4 py-2 rounded-lg bg-black/75 border border-white/15 text-white/70 font-mono text-xs flex items-center gap-2 shadow-lg backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-vaani-accent animate-ping" />
            <span>PRESS PLAY TO ENGAGE REAL-TIME VISUALIZER</span>
          </div>
        </div>
      )}
    </div>
  );
}
