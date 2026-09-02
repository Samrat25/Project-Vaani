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
    <section id="specs" className="w-full py-20 border-b border-vaani-border bg-vaani-bg">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        {/* Tagline */}
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded border border-vaani-border bg-vaani-card text-vaani-accent text-[0.7rem] font-bold tracking-widest uppercase">
          <span>PERFORMANCE SPECIFICATIONS</span>
        </div>

        <h2 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-vaani-text mb-4">
          EMBEDDED BENCHMARK SHEET
        </h2>
        <p className="text-xs md:text-sm text-vaani-text-muted max-w-2xl mb-10">
          Strict military-grade acoustic and silicon benchmarks measured on ARM Cortex-M architecture.
        </p>

        {/* Spec Table */}
        <div className="rounded-xl border border-vaani-border bg-vaani-surface overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <tbody>
              {SPECS.map((spec, i) => (
                <tr
                  key={i}
                  className={`border-b border-vaani-border-subtle last:border-b-0 hover:bg-vaani-card/60 transition-colors ${
                    i % 2 === 0 ? "bg-vaani-surface" : "bg-vaani-card/30"
                  }`}
                >
                  <td className="py-3.5 px-5 font-bold uppercase text-vaani-text-dim text-[0.7rem] w-[35%] md:w-[30%] tracking-wider">
                    {spec.label}
                  </td>
                  <td className="py-3.5 px-5 text-vaani-text border-l border-vaani-border-subtle">
                    {spec.highlight ? (
                      <span className="font-extrabold text-vaani-accent">{spec.value}</span>
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
