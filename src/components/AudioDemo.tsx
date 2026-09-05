"use client";

import React from "react";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import Playlist from "./audio/Playlist";
import WaveformVisualizer from "./audio/WaveformVisualizer";
import PlayerControls from "./audio/PlayerControls";
import Telemetry from "./audio/Telemetry";

export default function AudioDemo(): React.JSX.Element {
  const {
    state,
    toggleStream,
    toggleIsolation,
    toggleMuteMic,
    toggleMuteSpeaker,
    setViewMode,
    clearError,
    getRawData,
    getProcData,
  } = useAudioEngine();

  return (
    <section
      id="player"
      className="w-full py-20 border-b border-vaani-border bg-vaani-bg transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto px-5 md:px-8 flex flex-col items-center">
        {/* Tagline */}
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded border border-vaani-accent/40 bg-vaani-accent/10 text-vaani-accent text-[0.7rem] font-bold tracking-widest uppercase shadow-glow-sm">
          <span>REAL-TIME NEURAL STREAMING SUITE</span>
        </div>

        {/* Section Heading */}
        <h2 className="text-2xl md:text-4xl font-extrabold uppercase tracking-tight text-center text-vaani-text mb-4">
          LIVE COMBAT SPEECH ENHANCEMENT DEMO
        </h2>

        <p className="text-xs md:text-sm text-vaani-text-muted text-center max-w-2xl mb-12">
          Click &quot;Start Live Mic Stream&quot; to capture your microphone and stream full-duplex PCM16 frames to the local DPDFNet-8 neural engine at{" "}
          <code className="px-1 py-0.5 rounded bg-vaani-card border border-vaani-border text-vaani-cyan font-mono text-[0.8rem]">
            ws://localhost:8000
          </code>
          . Toggle &quot;Voice Isolation&quot; for instant A/B raw bypass comparison.
        </p>

        {/* Connection / Permission Error Banner */}
        {state.errorMessage && (
          <div className="w-full max-w-4xl mb-6 p-4 rounded-xl border border-rose-500/50 bg-rose-950/30 text-rose-200 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs shadow-lg animate-fadeIn">
            <div className="flex items-start gap-3">
              <span className="text-rose-400 text-lg">⚠️</span>
              <div>
                <div className="font-bold uppercase tracking-wider text-rose-300">
                  CONNECTION OR HARDWARE ERROR
                </div>
                <div className="text-[0.75rem] text-rose-200/80 mt-0.5">
                  {state.errorMessage}
                </div>
                <div className="text-[0.7rem] text-rose-300/60 mt-1">
                  Ensure the backend is running:{" "}
                  <code className="px-1 bg-black/40 rounded text-rose-300">
                    python -m server.main
                  </code>{" "}
                  and browser microphone permission is granted.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={clearError}
                className="px-3 py-1.5 rounded border border-rose-500/40 bg-rose-900/30 hover:bg-rose-900/50 text-rose-300 text-xs font-bold uppercase transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  clearError();
                  toggleStream();
                }}
                className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase transition-colors shadow-sm"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Main Audio Player Suite Container */}
        <div className="w-full rounded-2xl border border-vaani-border bg-vaani-surface shadow-2xl overflow-hidden flex flex-col lg:flex-row transition-all hover:border-vaani-accent/40">
          {/* Left: Hardware & Session HUD (Repurposed from Playlist) */}
          <div className="w-full lg:w-[280px] lg:shrink-0 border-b lg:border-b-0 lg:border-r border-vaani-border bg-vaani-card/50">
            <Playlist
              connectionStatus={state.connectionStatus}
              isStreaming={state.isStreaming}
              activeMicLabel={state.activeMicLabel}
              activeModelName={state.activeModelName}
              isMicMuted={state.isMicMuted}
              isSpeakerMuted={state.isSpeakerMuted}
              onToggleMuteMic={toggleMuteMic}
              onToggleMuteSpeaker={toggleMuteSpeaker}
            />
          </div>

          {/* Right: Main Visualizer & Controls */}
          <div className="flex-1 flex flex-col min-w-0 bg-vaani-bg">
            {/* Visualizer Canvas Area */}
            <div className="flex-1 relative min-h-[260px] md:min-h-[340px]">
              <WaveformVisualizer
                getRawData={getRawData}
                getProcData={getProcData}
                viewMode={state.viewMode}
                isActive={state.isStreaming}
              />
            </div>

            {/* Playback Controls Bar */}
            <PlayerControls
              isStreaming={state.isStreaming}
              connectionStatus={state.connectionStatus}
              streamDuration={state.streamDuration}
              isIsolationOn={state.isIsolationOn}
              viewMode={state.viewMode}
              onToggleStream={toggleStream}
              onToggleIsolation={() => toggleIsolation()}
              onSetViewMode={setViewMode}
            />

            {/* Live Telemetry Row */}
            <Telemetry telemetry={state.telemetry} />
          </div>
        </div>

        {/* Bottom Technical CTA Box */}
        <div className="mt-12 p-6 rounded-xl border border-vaani-border bg-vaani-surface flex flex-col sm:flex-row items-center justify-between w-full max-w-3xl shadow-lg gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-vaani-text">
              WANT TO BENCHMARK WITH CUSTOM ON-TARGET EMBEDDED HARNESS?
            </div>
            <div className="text-[0.75rem] text-vaani-text-muted mt-0.5">
              Run automated streaming benchmarks with simulated combat noise via{" "}
              <code className="text-vaani-accent">python server/client/test_client.py</code>.
            </div>
          </div>
          <a
            href="#specs"
            className="px-5 py-2.5 rounded border border-vaani-border bg-vaani-card hover:border-vaani-accent text-vaani-text hover:text-vaani-accent text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap"
          >
            Technical Specs &gt;&gt;
          </a>
        </div>
      </div>
    </section>
  );
}
