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
    <section id="targets" className="w-full py-20 relative z-10">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        {/* Tagline */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 mb-6 rounded-full border border-white/20 bg-white/5 text-[#c4c2c3] text-[0.7rem] font-medium tracking-widest uppercase">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>DEPLOYMENT TARGETS</span>
        </div>

        <h2 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tight text-white mb-12 font-sans">
          ENGINEERED FOR EMBEDDED HARDWARE
        </h2>

        {/* 3 Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {TARGETS.map((target) => (
            <div
              key={target.id}
              className="rounded-3xl border border-white/10 bg-black/60 backdrop-blur-xl p-7 sm:p-8 flex flex-col justify-between hover:border-white/25 hover:shadow-[0_0_35px_rgba(255,255,255,0.08)] transition-all duration-300 group"
            >
              <div>
                <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono mb-4 group-hover:scale-105 transition-transform origin-left">
                  {target.id}
                </div>
                <h3 className="text-base sm:text-lg font-bold uppercase text-white tracking-wide mb-3 pb-3 border-b border-white/10">
                  {target.title}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed mb-6 font-sans">
                  {target.description}
                </p>
              </div>

              <div className="space-y-2.5 border-t border-white/10 pt-5 font-mono">
                {target.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-neutral-400">
                    <span className="text-emerald-400 font-bold">&gt;&gt;</span>
                    <span className="text-neutral-300 group-hover:text-white transition-colors">
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
