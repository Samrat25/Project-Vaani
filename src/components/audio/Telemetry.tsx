"use client";

import React from "react";
import type { TelemetryData } from "@/lib/types";

interface TelemetryProps {
  telemetry: TelemetryData;
}

export default function Telemetry({ telemetry }: TelemetryProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 border-t border-vaani-border bg-vaani-card/70 font-mono divide-x divide-y md:divide-y-0 divide-vaani-border-subtle">
      {/* Metric 1: Signal Level */}
      <div className="p-3.5 text-center">
        <div className="text-[0.6rem] font-bold uppercase tracking-widest text-vaani-text-dim mb-1">
          SIGNAL LEVEL
        </div>
        <div className="text-sm md:text-base font-extrabold text-vaani-text tabular-nums">
          {telemetry.signalLevel > 0
            ? `${(telemetry.signalLevel * 100).toFixed(0)}%`
            : "---"}
        </div>
      </div>

      {/* Metric 2: Noise Floor */}
      <div className="p-3.5 text-center">
        <div className="text-[0.6rem] font-bold uppercase tracking-widest text-vaani-text-dim mb-1">
          NOISE FLOOR
        </div>
        <div className="text-sm md:text-base font-extrabold text-vaani-text tabular-nums">
          {telemetry.noiseFloor} <span className="text-[0.65rem] text-vaani-text-dim">dB</span>
        </div>
      </div>

      {/* Metric 3: Estimated SNR Gain */}
      <div className="p-3.5 text-center">
        <div className="text-[0.6rem] font-bold uppercase tracking-widest text-vaani-text-dim mb-1">
          EST. SNR GAIN
        </div>
        <div className="text-sm md:text-base font-extrabold text-vaani-emerald tabular-nums">
          +{telemetry.snrGain.toFixed(1)}{" "}
          <span className="text-[0.65rem] text-vaani-emerald/70">dB</span>
        </div>
      </div>

      {/* Metric 4: Frame Latency */}
      <div className="p-3.5 text-center">
        <div className="text-[0.6rem] font-bold uppercase tracking-widest text-vaani-text-dim mb-1">
          FRAME LATENCY
        </div>
        <div className="text-sm md:text-base font-extrabold text-vaani-cyan tabular-nums">
          &lt; 2.8 <span className="text-[0.65rem] text-vaani-cyan/70">ms</span>
        </div>
      </div>
    </div>
  );
}
