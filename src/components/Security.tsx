"use client";

import React from "react";

const SECURITY_PILLARS = [
  {
    title: "AIR-GAP NATIVE",
    description:
      "Engineered without network dependencies or IP stack integration. Operates identically in SCIFs, subterranean vaults, and Faraday-shielded environments.",
  },
  {
    title: "ZERO BUFFER PERSISTENCE",
    description:
      "Audio frames reside exclusively in volatile SRAM circular buffers and are instantly overwritten post-inference. Zero audio data is logged or cached.",
  },
  {
    title: "CRYPTOGRAPHIC FIRMWARE",
    description:
      "Hardware root-of-trust verification with SHA-256 binary validation to prevent firmware tampering and reverse-engineering.",
  },
];

export default function Security(): React.JSX.Element {
  return (
    <section id="security" className="w-full py-20 relative z-10">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        {/* Tagline */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 mb-6 rounded-full border border-white/20 bg-white/5 text-[#c4c2c3] text-[0.7rem] font-medium tracking-widest uppercase">
          <span className="w-2 h-2 rounded-full bg-rose-400" />
          <span>SECURITY POSTURE</span>
        </div>

        <h2 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tight text-white mb-4 font-sans">
          ZERO DATA EXFILTRATION BY DESIGN
        </h2>
        <p className="text-xs md:text-sm text-neutral-300 max-w-2xl mb-12 leading-relaxed font-sans">
          VAANI is architecturally incapable of transmitting voice or audio data. Processing begins and ends on local silicon.
        </p>

        {/* 3 Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {SECURITY_PILLARS.map((pillar, i) => (
            <div
              key={i}
              className="rounded-3xl border border-white/10 bg-black/60 backdrop-blur-xl p-7 sm:p-8 hover:border-white/25 hover:shadow-[0_0_35px_rgba(255,255,255,0.08)] transition-all duration-300 group"
            >
              <div className="flex items-center gap-2.5 mb-3.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 group-hover:scale-125 transition-transform" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  {pillar.title}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
