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
    <section id="security" className="w-full py-20 border-b border-vaani-border bg-vaani-bg">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        {/* Tagline */}
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded border border-vaani-border bg-vaani-card text-vaani-accent text-[0.7rem] font-bold tracking-widest uppercase">
          <span>SECURITY POSTURE</span>
        </div>

        <h2 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-vaani-text mb-4">
          ZERO DATA EXFILTRATION BY DESIGN
        </h2>
        <p className="text-xs md:text-sm text-vaani-text-muted max-w-2xl mb-12">
          VAANI is architecturally incapable of transmitting voice or audio data. Processing begins and ends on local silicon.
        </p>

        {/* 3 Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SECURITY_PILLARS.map((pillar, i) => (
            <div
              key={i}
              className="rounded-xl border border-vaani-border bg-vaani-surface p-7 hover:border-vaani-accent/50 transition-all shadow-lg group"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="h-2 w-2 rounded-full bg-vaani-accent group-hover:shadow-glow-sm" />
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-vaani-accent">
                  {pillar.title}
                </h3>
              </div>
              <p className="text-xs text-vaani-text-muted leading-relaxed">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
