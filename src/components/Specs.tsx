"use client";

import React from "react";

const SPECS = [
  { label: "PROCESSING MODE", value: "Real-time, single-pass, on-device TinyML inference", highlight: false },
  { label: "SAMPLE RATES", value: "8 kHz / 16 kHz / 48 kHz selectable runtime", highlight: false },
  { label: "FRAME LATENCY", value: "< 2.8 ms algorithmic (8 kHz narrowband mode)", highlight: true },
  { label: "COMPUTE BUDGET", value: "≤ 48 MOPS on Cortex-M class cores", highlight: true },
  { label: "MEMORY FOOTPRINT", value: "≤ 512 KB SRAM (model weights + circular buffers)", highlight: true },
  { label: "POWER CONSUMPTION", value: "< 15 mW typical (active inference stage)", highlight: true },
  { label: "NOISE SUPPRESSION", value: "≥ 25 dB broadband, ≥ 35 dB stationary engine/rotor", highlight: true },
  { label: "SPEECH INTEGRITY", value: "< 0.25 PESQ degradation vs clean acoustic reference", highlight: false },
  { label: "CHIPSET ARCHITECTURES", value: "ARM Cortex-M4/M7/M55, RISC-V, Embedded Linux", highlight: false },
  { label: "INTEGRATION BINARY", value: "ANSI C library, CMSIS-NN backend, ONNX micro runtime", highlight: false },
  { label: "CONNECTIVITY REQ.", value: "None — 100% offline, air-gap compatible", highlight: false },
  { label: "OPERATING THERMAL", value: "-40°C to +85°C (industrial & military grade)", highlight: false },
];

export default function Specs(): React.JSX.Element {
  return (
    <section id="specs" className="w-full py-20 relative z-10">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        {/* Tagline */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 mb-6 rounded-full border border-white/20 bg-white/5 text-[#c4c2c3] text-[0.7rem] font-medium tracking-widest uppercase">
          <span className="w-2 h-2 rounded-full bg-indigo-400" />
          <span>PERFORMANCE SPECIFICATIONS</span>
        </div>

        <h2 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tight text-white mb-4 font-sans">
          EMBEDDED BENCHMARK SHEET
        </h2>
        <p className="text-xs md:text-sm text-neutral-300 max-w-2xl mb-10 leading-relaxed font-sans">
          Strict military-grade acoustic and silicon benchmarks measured on ARM Cortex-M and RISC-V architectures.
        </p>

        {/* Spec Table */}
        <div className="rounded-3xl border border-white/10 bg-black/60 backdrop-blur-xl overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <tbody>
              {SPECS.map((spec, i) => (
                <tr
                  key={i}
                  className={`border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors ${
                    i % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent"
                  }`}
                >
                  <td className="py-4 px-6 font-bold uppercase text-neutral-400 text-[0.72rem] w-[35%] md:w-[30%] tracking-wider">
                    {spec.label}
                  </td>
                  <td className="py-4 px-6 text-neutral-200 border-l border-white/5">
                    {spec.highlight ? (
                      <span className="font-extrabold text-white bg-white/10 px-2 py-0.5 rounded border border-white/15">
                        {spec.value}
                      </span>
                    ) : (
                      <span>{spec.value}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
