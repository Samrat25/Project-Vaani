import React from "react";
import Link from "next/link";
import AudioDemo from "@/components/AudioDemo";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Live Combat Speech Enhancement Suite — VAANI",
  description:
    "Live full-duplex WebSocket microphone streaming test suite for DPDFNet-8 neural voice isolation.",
};

export default function DemoPage(): React.JSX.Element {
  return (
    <main className="min-h-screen text-white relative flex flex-col justify-between">
      {/* Top Floating Bar with Back to Home & Status */}
      <header className="sticky top-0 z-50 w-full pt-4 sm:pt-6 px-4 flex justify-center pointer-events-none">
        <div className="w-full max-w-[1140px] flex items-center justify-between pointer-events-auto bg-[#12141a]/90 backdrop-blur-xl border border-white/10 rounded-full py-2 px-5 shadow-2xl">
          {/* Left: Back Link & Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-white hover:text-orange-400 transition-colors"
          >
            <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md">
              <img
                src="/assets/logo.webp"
                alt="Logo"
                className="w-5 h-5 object-contain"
              />
            </span>
            <span>&larr; Return to Home</span>
          </Link>

          {/* Center: Tactical Live Status */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-white">LIVE COMBAT TEST SUITE</span>
            <span className="text-neutral-500">|</span>
            <span className="text-neutral-400">DPDFNET-8 ONNX</span>
          </div>

          {/* Right: Connect Status */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              LIVE CLOUD DSP
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 pt-4 pb-16">
        <AudioDemo />
      </div>

      <Footer />
    </main>
  );
}
