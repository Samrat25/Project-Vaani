"use client";

import React from "react";

export default function WhatItDoes(): React.JSX.Element {
  return (
    <section id="about" className="w-full py-20 border-b border-vaani-border bg-vaani-bg">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        {/* Section Tagline */}
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded border border-vaani-border bg-vaani-card text-vaani-accent text-[0.7rem] font-bold tracking-widest uppercase">
          <span>WHAT VAANI DOES</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Core Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-vaani-text leading-tight">
              VOICE ISOLATION IN ACOUSTIC EXTREMES
            </h2>

            <p className="text-sm md:text-base text-vaani-text-muted leading-relaxed">
              VAANI runs a high-precision, low-parameter neural voice isolation model directly on embedded silicon. It dynamically separates human vocal formants from extreme environmental acoustic chaos — including helicopter blade wash, supersonic gunfire bursts, armored vehicle rumble, and wind buffeting.
            </p>

            <p className="text-sm md:text-base text-vaani-text-muted leading-relaxed">
              Unlike legacy DSP spectral subtraction filters that introduce metallic distortion and phase cancellation, VAANI uses TinyML deep perceptual filtering to output crystal-clear, natural speech directly into the radio transmission stage.
            </p>
          </div>

          {/* Right Column: Tactical Air-Gap Card */}
          <div className="lg:col-span-5">
            <div className="rounded-xl border border-vaani-border bg-vaani-surface p-7 shadow-lg relative group hover:border-vaani-accent/50 transition-all">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-vaani-accent font-bold text-lg">&gt;&gt;</span>
                <h3 className="text-sm font-bold uppercase tracking-wider text-vaani-text">
                  EDGE-AI ARCHITECTURE
                </h3>
              </div>

              <p className="text-xs text-vaani-text-muted leading-relaxed mb-6">
                The inference loop executes 100% locally inside the microphone capsule, DSP, or tactical headset. Audio never touches external networks or buffers.
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3 text-xs p-2.5 rounded bg-vaani-card border border-vaani-border-subtle">
                  <span className="text-vaani-emerald font-bold">✓</span>
                  <span className="text-vaani-text">Specialised low-power TinyML models</span>
                </div>
                <div className="flex items-start gap-3 text-xs p-2.5 rounded bg-vaani-card border border-vaani-border-subtle">
                  <span className="text-vaani-emerald font-bold">✓</span>
                  <span className="text-vaani-text">Cortex-M4/M7/M55 &amp; RISC-V DSP hardware support</span>
                </div>
                <div className="flex items-start gap-3 text-xs p-2.5 rounded bg-vaani-card border border-vaani-border-subtle">
                  <span className="text-vaani-emerald font-bold">✓</span>
                  <span className="text-vaani-text">&lt; 3ms algorithmic latency for zero-lag comms</span>
                </div>
                <div className="flex items-start gap-3 text-xs p-2.5 rounded bg-vaani-card border border-vaani-border-subtle">
                  <span className="text-vaani-emerald font-bold">✓</span>
                  <span className="text-vaani-text">Air-gap native for SCIF and classified zones</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
