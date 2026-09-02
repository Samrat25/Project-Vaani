"use client";

import React from "react";
import type { AudioSample } from "@/lib/types";

interface PlaylistProps {
  samples: AudioSample[];
  currentSampleId: string | null;
  onSelect: (sample: AudioSample) => void;
}

export default function Playlist({
  samples,
  currentSampleId,
  onSelect,
}: PlaylistProps): React.JSX.Element {
  return (
    <div className="flex flex-col h-full font-mono">
      {/* Header */}
      <div className="p-4 border-b border-vaani-border flex items-center justify-between">
        <span className="text-[0.65rem] font-bold uppercase tracking-widest text-vaani-text-dim">
          SELECT ACOUSTIC SCENARIO:
        </span>
        <span className="text-[0.6rem] px-1.5 py-0.5 rounded bg-vaani-card text-vaani-text-muted border border-vaani-border">
          {samples.length} FILES
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto max-h-[380px] lg:max-h-[460px] divide-y divide-vaani-border-subtle">
        {samples.map((sample) => {
          const isSelected = sample.id === currentSampleId;
          const isMilitary = sample.category === "military";

          return (
            <button
              key={sample.id}
              onClick={() => onSelect(sample)}
              className={`w-full text-left p-3.5 flex flex-col gap-1 transition-all group ${
                isSelected
                  ? "bg-vaani-accent/15 border-l-4 border-vaani-accent"
                  : "hover:bg-vaani-surface/80 border-l-4 border-transparent"
              }`}
            >
              {/* Category Badge & Duration */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-[0.58rem] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                    isMilitary
                      ? "bg-vaani-accent/20 text-vaani-accent border border-vaani-accent/30"
                      : "bg-vaani-cyan/20 text-vaani-cyan border border-vaani-cyan/30"
                  }`}
                >
                  {sample.category}
                </span>
                <span className="text-[0.65rem] text-vaani-text-dim font-mono">
                  {Math.floor(sample.duration / 60)}:
                  {(sample.duration % 60).toString().padStart(2, "0")}
                </span>
              </div>

              {/* Sample Name */}
              <div
                className={`text-xs font-bold uppercase tracking-wide truncate ${
                  isSelected
                    ? "text-vaani-text font-extrabold"
                    : "text-vaani-text-muted group-hover:text-vaani-text"
                }`}
              >
                {sample.name}
              </div>

              {/* Noise Profile Description */}
              <div className="text-[0.62rem] text-vaani-text-dim truncate">
                {sample.noiseProfile.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
