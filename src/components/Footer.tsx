"use client";

import React from "react";

export default function Footer(): React.JSX.Element {
  return (
    <footer className="w-full py-8 bg-vaani-bg text-vaani-text border-t border-vaani-border font-mono transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-5 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-vaani-accent" />
          <span className="font-extrabold uppercase tracking-wider">
            VAANI — ADAPTIVE ON-DEVICE VOICE ISOLATION
          </span>
        </div>

        <div className="text-vaani-text-dim text-[0.7rem] uppercase tracking-widest text-center sm:text-right">
          ALL PROCESSING LOCAL / ZERO RF EXFILTRATION
        </div>
      </div>
    </footer>
  );
}
