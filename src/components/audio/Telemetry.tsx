"use client";

import React from "react";
import type { TelemetryData } from "@/lib/types";

interface TelemetryProps {
  telemetry: TelemetryData;
}

export default function Telemetry({ telemetry }: TelemetryProps): React.JSX.Element {
  const hasTelemetry = telemetry.chunksReceived && telemetry.chunksReceived > 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 border-t border-vaani-border bg-vaani-card/70 font-mono divide-x divide-y md:divide-y-0 divide-vaani-border-subtle">
      {/* Metric 1: Suppression Gain */}
      <div className="p-3.5 text-center">
        <div className="text-[0.6rem] font-bold uppercase tracking-widest text-vaani-text-dim mb-1">
          SUPPRESSION GAIN
        </div>
        <div className="text-sm md:text-base font-extrabold text-vaani-emerald tabular-nums">
          {telemetry.suppressionGain > 0 ? (
            <>
              +{telemetry.suppressionGain.toFixed(1)}{" "}
              <span className="text-[0.65rem] text-vaani-emerald/70">dB</span>
            </>
          ) : (
            <span className="text-vaani-text-dim">---</span>
          )}
        </div>
      </div>

      {/* Metric 2: Live SNR (Raw -> Enhanced) */}
      <div className="p-3.5 text-center">
        <div className="text-[0.6rem] font-bold uppercase tracking-widest text-vaani-text-dim mb-1">
          SNR IMPROVEMENT
        </div>
        <div className="text-xs md:text-sm font-extrabold text-vaani-text tabular-nums">
          {telemetry.rawSnr !== undefined && telemetry.enhancedSnr !== undefined ? (
            <span className="flex items-center justify-center gap-1">
              <span className="text-vaani-accent">{telemetry.rawSnr > 0 ? `+${telemetry.rawSnr.toFixed(1)}` : telemetry.rawSnr.toFixed(1)}</span>
              <span className="text-vaani-text-dim text-[0.65rem]">→</span>
              <span className="text-vaani-cyan">{telemetry.enhancedSnr > 0 ? `+${telemetry.enhancedSnr.toFixed(1)}` : telemetry.enhancedSnr.toFixed(1)} dB</span>
            </span>
          ) : (
            <span className="text-vaani-text-dim">---</span>
          )}
        </div>
      </div>

      {/* Metric 3: Objective Metrics (PESQ & STOI) */}
      <div className="p-3.5 text-center">
        <div className="text-[0.6rem] font-bold uppercase tracking-widest text-vaani-text-dim mb-1">
          OBJECTIVE SPEECH SCORE
        </div>
        <div className="text-xs md:text-sm font-extrabold text-vaani-text tabular-nums">
          {telemetry.pesq !== undefined && telemetry.stoi !== undefined ? (
            <span className="flex items-center justify-center gap-2">
              <span className="text-vaani-cyan">PESQ: {telemetry.pesq.toFixed(2)}</span>
              <span className="text-vaani-text-dim text-[0.65rem]">|</span>
              <span className="text-vaani-emerald">STOI: {telemetry.stoi.toFixed(2)}</span>
            </span>
          ) : (
            <span className="text-vaani-text-dim">---</span>
          )}
        </div>
      </div>

      {/* Metric 4: ONNX Inference Latency */}
      <div className="p-3.5 text-center">
        <div className="text-[0.6rem] font-bold uppercase tracking-widest text-vaani-text-dim mb-1">
          ONNX INFERENCE LATENCY
        </div>
        <div className="text-sm md:text-base font-extrabold text-vaani-cyan tabular-nums">
          {telemetry.frameLatency > 0 ? (
            <>
              {telemetry.frameLatency.toFixed(1)}{" "}
              <span className="text-[0.65rem] text-vaani-cyan/70">ms</span>
            </>
          ) : (
            <span className="text-vaani-text-dim">---</span>
          )}
        </div>
      </div>
    </div>
  );
}
