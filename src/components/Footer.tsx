"use client";

import React from "react";

export default function Footer(): React.JSX.Element {
  return (
    <footer className="w-full py-10 border-t border-white/10 bg-black/70 backdrop-blur-xl text-neutral-400 font-sans relative z-10">
      <div className="max-w-7xl mx-auto px-5 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
          <span className="font-bold uppercase tracking-wider text-white">
            VAANI — NEURAL VOICE ISOLATION PLATFORM
          </span>
        </div>

        <div className="text-neutral-400 text-xs tracking-wider text-center sm:text-right font-mono">
          AIR-GAPPED EMBEDDED DSP &bull; ZERO RF EXFILTRATION &bull; MIL-STD-810
        </div>
      </div>
    </footer>
  );
}
