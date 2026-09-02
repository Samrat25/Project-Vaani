"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";

export default function Navbar(): React.JSX.Element {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full bg-vaani-bg/90 backdrop-blur-md border-b border-vaani-border font-mono transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between py-3.5 px-5 md:px-8">
        {/* Left: VAANI logo */}
        <a
          href="#"
          className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-vaani-text group"
        >
          <span className="flex h-2.5 w-2.5 rounded-full bg-vaani-accent animate-pulse shadow-glow-sm" />
          <span>VAANI</span>
          <span className="text-[0.65rem] px-2 py-0.5 rounded border border-vaani-accent/40 text-vaani-accent bg-vaani-accent/10 font-bold uppercase tracking-wider">
            EDGE-ANC
          </span>
        </a>

        {/* Right: Nav Links + Theme Toggle */}
        <nav className="flex items-center gap-1 md:gap-3" aria-label="Main Navigation">
          <a
            href="#about"
            className="px-3 py-1.5 text-xs font-semibold uppercase text-vaani-text-muted hover:text-vaani-accent transition-colors"
          >
            About
          </a>
          <a
            href="#targets"
            className="px-3 py-1.5 text-xs font-semibold uppercase text-vaani-text-muted hover:text-vaani-accent transition-colors hidden sm:inline-block"
          >
            Targets
          </a>
          <a
            href="#player"
            className="px-3 py-1.5 text-xs font-semibold uppercase text-vaani-text-muted hover:text-vaani-accent transition-colors"
          >
            Live Demo
          </a>
          <a
            href="#specs"
            className="px-3 py-1.5 text-xs font-semibold uppercase text-vaani-text-muted hover:text-vaani-accent transition-colors hidden sm:inline-block"
          >
            Specs
          </a>
          <a
            href="#security"
            className="px-3 py-1.5 text-xs font-semibold uppercase text-vaani-text-muted hover:text-vaani-accent transition-colors hidden md:inline-block"
          >
            Security
          </a>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="ml-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase rounded border border-vaani-border bg-vaani-card hover:border-vaani-accent text-vaani-text hover:text-vaani-accent transition-all shadow-sm"
          >
            {theme === "dark" ? (
              <>
                <span className="text-amber-400 text-sm leading-none">☀</span>
                <span className="hidden sm:inline text-[0.7rem]">LIGHT</span>
              </>
            ) : (
              <>
                <span className="text-indigo-400 text-sm leading-none">🌙</span>
                <span className="hidden sm:inline text-[0.7rem]">DARK</span>
              </>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
