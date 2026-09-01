"use client";

import React from "react";

export default function Hero(): React.JSX.Element {
  return (
    <section className="relative w-full overflow-hidden border-b border-vaani-border bg-hero-glow bg-grid-pattern py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headline & Action */}
          <div className="lg:col-span-7 flex flex-col items-start">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded border border-vaani-accent/30 bg-vaani-accent/10 text-vaani-accent text-[0.7rem] font-bold tracking-widest uppercase shadow-glow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-vaani-emerald animate-ping" />
              <span>EDGE-AI ADAPTIVE NOISE CANCELLATION</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold uppercase tracking-tight text-vaani-text leading-[1.02] mb-6">
              STRIP THE NOISE.
              <br />
              <span className="text-gradient-accent">KEEP THE VOICE.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm md:text-base text-vaani-text-muted leading-relaxed max-w-xl mb-8">
              On-device AI voice isolation engineered for mission-critical defence and emergency radio communications. Suppresses heavy rotor wash, supersonic gunfire, and engine rumble with sub-3ms algorithmic latency.
            </p>

            {/* CTA Group */}
            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
              <a
                href="#player"
                className="w-full sm:w-auto px-8 py-3.5 bg-vaani-accent text-black font-extrabold text-xs uppercase tracking-wider rounded hover:bg-vaani-accent-light transition-all shadow-glow hover:shadow-glow-lg text-center"
              >
                RUN LIVE DEMO &gt;&gt;
              </a>
              <a
                href="#specs"
                className="w-full sm:w-auto px-6 py-3.5 border border-vaani-border bg-vaani-surface/80 hover:border-vaani-accent text-vaani-text font-bold text-xs uppercase tracking-wider rounded hover:text-vaani-accent transition-all text-center"
              >
                VIEW SPEC SHEET
              </a>
            </div>
          </div>

          {/* Right Column: Tactical Status Readout Module */}
          <div className="lg:col-span-5">
            <div className="w-full rounded-xl border border-vaani-border bg-vaani-surface/95 backdrop-blur-sm p-6 shadow-2xl relative overflow-hidden group hover:border-vaani-accent/60 transition-colors">
              {/* Subtle top indicator bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-vaani-accent via-vaani-cyan to-vaani-emerald" />

              <div className="flex items-center justify-between pb-4 mb-4 border-b border-vaani-border">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-vaani-emerald animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-vaani-text">
                    SYSTEM TELEMETRY
                  </span>
                </div>
                <span className="text-[0.65rem] px-2 py-0.5 rounded bg-vaani-card border border-vaani-border text-vaani-text-muted font-mono">
                  DSP-CORE 01
                </span>
              </div>

              {/* Status List */}
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between p-2.5 rounded bg-vaani-card border border-vaani-border-subtle">
                  <span className="text-vaani-text-dim text-[0.7rem] uppercase">FIRMWARE</span>
                  <span className="font-bold text-vaani-text">VAANI EDGE v2.1</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded bg-vaani-card border border-vaani-border-subtle">
                  <span className="text-vaani-text-dim text-[0.7rem] uppercase">PROCESSING</span>
                  <span className="font-bold text-vaani-accent flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-vaani-accent" />
                    ON-DEVICE AIR-GAPPED
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded bg-vaani-card border border-vaani-border-subtle">
                  <span className="text-vaani-text-dim text-[0.7rem] uppercase">FRAME LATENCY</span>
                  <span className="font-bold text-vaani-cyan">&lt; 2.8 ms</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded bg-vaani-card border border-vaani-border-subtle">
                  <span className="text-vaani-text-dim text-[0.7rem] uppercase">DATA EXFILTRATION</span>
                  <span className="font-bold text-vaani-emerald">0 BYTES (NO CLOUD)</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded bg-vaani-card border border-vaani-border-subtle">
                  <span className="text-vaani-text-dim text-[0.7rem] uppercase">ANC STATUS</span>
                  <span className="font-bold text-vaani-emerald flex items-center gap-1">
                    READY / ACTIVE
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
