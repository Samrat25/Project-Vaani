"use client";

import React from "react";

const TARGETS = [
  {
    id: "01",
    title: "TACTICAL HEADSETS",
    description:
      "Embedded directly into active hearing protection and tactical headsets. Processes raw audio at the ear before transmission.",
    features: [
      "Active hearing protection integration",
      "Bone conduction microphone compatible",
      "MIL-STD-810 environmental rating",
    ],
  },
  {
    id: "02",
    title: "COMMS TERMINALS",
    description:
      "Dispatch consoles, vehicle mounted intercoms, and command post stations with seamless audio bus integration.",
    features: [
      "USB / I2S / Line-in audio insertion",
      "Multi-channel simultaneous isolation",
      "Ultra-low thermal & power profile",
    ],
  },
  {
    id: "03",
    title: "FIELD RADIOS",
    description:
      "Handheld and manpack tactical radio transceivers. Runs as optimized firmware on existing onboard DSPs.",
    features: [
      "Zero additional hardware required",
      "8 kHz & 16 kHz narrowband tactical modes",
      "Seamless push-to-talk (PTT) synchronization",
    ],
  },
];

export default function DeploymentTargets(): React.JSX.Element {
  return (
    <section id="targets" className="w-full py-20 border-b border-vaani-border bg-vaani-bg">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        {/* Tagline */}
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded border border-vaani-border bg-vaani-card text-vaani-accent text-[0.7rem] font-bold tracking-widest uppercase">
          <span>DEPLOYMENT TARGETS</span>
        </div>

        <h2 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-vaani-text mb-12">
          ENGINEERED FOR EMBEDDED HARDWARE
        </h2>

        {/* 3 Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TARGETS.map((target) => (
            <div
              key={target.id}
              className="rounded-xl border border-vaani-border bg-vaani-surface p-7 flex flex-col justify-between hover:border-vaani-accent/60 transition-all hover:shadow-glow-sm group"
            >
              <div>
                <div className="text-3xl font-extrabold text-vaani-accent font-mono mb-3 group-hover:scale-105 transition-transform origin-left">
                  {target.id}
                </div>
                <h3 className="text-base font-extrabold uppercase text-vaani-text tracking-wide mb-3 pb-3 border-b border-vaani-border">
                  {target.title}
                </h3>
                <p className="text-xs text-vaani-text-muted leading-relaxed mb-6">
                  {target.description}
                </p>
              </div>

              <div className="space-y-2 border-t border-vaani-border-subtle pt-4">
                {target.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-[0.72rem] text-vaani-text-dim">
                    <span className="text-vaani-accent font-bold">&gt;&gt;</span>
                    <span className="text-vaani-text-muted group-hover:text-vaani-text transition-colors">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
