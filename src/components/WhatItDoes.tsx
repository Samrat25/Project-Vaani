"use client";

import React from "react";

export default function WhatItDoes(): React.JSX.Element {
  return (
    <section id="about" className="w-full py-20 relative z-10">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        {/* Section Tagline */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 mb-6 rounded-full border border-white/20 bg-white/5 text-[#c4c2c3] text-[0.7rem] font-medium tracking-widest uppercase">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>WHAT VAANI DOES</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Core Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tight text-white leading-tight font-sans">
              VOICE ISOLATION IN ACOUSTIC EXTREMES
            </h2>

            <p className="text-sm md:text-base text-neutral-300 leading-relaxed font-sans">
              VAANI runs a high-precision, low-parameter neural voice isolation model directly on embedded silicon. It dynamically separates human vocal formants from extreme environmental acoustic chaos — including helicopter blade wash, supersonic gunfire bursts, armored vehicle rumble, and wind buffeting.
            </p>

            <p className="text-sm md:text-base text-neutral-400 leading-relaxed font-sans">
              Unlike legacy DSP spectral subtraction filters that introduce metallic distortion and phase cancellation, VAANI uses TinyML deep perceptual filtering to output crystal-clear, natural speech directly into the radio transmission stage.
            </p>
          </div>

          {/* Right Column: Tactical Air-Gap Card */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-white/10 bg-black/60 backdrop-blur-xl p-7 sm:p-8 shadow-2xl relative group hover:border-white/25 transition-all">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="text-white font-bold text-lg">&gt;&gt;</span>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  EDGE-AI ARCHITECTURE
                </h3>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed mb-6 font-sans">
                The inference loop executes 100% locally inside the microphone capsule, DSP, or tactical headset. Audio never touches external networks or cloud buffers.
              </p>

              <div className="space-y-3 font-mono">
                <div className="flex items-start gap-3 text-xs p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span className="text-neutral-200">Specialised low-power TinyML models</span>
                </div>
                <div className="flex items-start gap-3 text-xs p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span className="text-neutral-200">Cortex-M4/M7/M55 &amp; RISC-V DSP hardware support</span>
                </div>
                <div className="flex items-start gap-3 text-xs p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span className="text-neutral-200">&lt; 2.8ms algorithmic latency for zero-lag comms</span>
                </div>
                <div className="flex items-start gap-3 text-xs p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span className="text-neutral-200">Air-gap native for SCIF and classified zones</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
