"use client";

import React, { useEffect, useCallback } from "react";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { AUDIO_SAMPLES } from "@/lib/audioSamples";
import Playlist from "./audio/Playlist";
import WaveformVisualizer from "./audio/WaveformVisualizer";
import PlayerControls from "./audio/PlayerControls";
import Telemetry from "./audio/Telemetry";
import type { AudioSample } from "@/lib/types";

export default function AudioDemo(): React.JSX.Element {
  const {
    state,
    loadSample,
    play,
    pause,
    seek,
    toggleIsolation,
    setViewMode,
    nextTrack,
    prevTrack,
    getRawData,
    getProcData,
  } = useAudioEngine();

  // Auto-load first sample on mount
  useEffect(() => {
    if (AUDIO_SAMPLES.length > 0 && !state.currentSampleId) {
      loadSample(AUDIO_SAMPLES[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = useCallback(
    (sample: AudioSample) => {
      loadSample(sample);
    },
    [loadSample]
  );

  const handleSeek = useCallback(
    (timeInSeconds: number) => {
      if (state.duration > 0) {
        seek(timeInSeconds / state.duration);
      }
    },
    [seek, state.duration]
  );

  const handleToggleIsolation = useCallback(() => {
    toggleIsolation(!state.isIsolationOn);
  }, [toggleIsolation, state.isIsolationOn]);

  return (
    <section
      id="player"
      className="w-full py-20 border-b border-vaani-border bg-vaani-bg transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto px-5 md:px-8 flex flex-col items-center">
        {/* Tagline */}
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded border border-vaani-accent/40 bg-vaani-accent/10 text-vaani-accent text-[0.7rem] font-bold tracking-widest uppercase shadow-glow-sm">
          <span>INTERACTIVE VOICE ISOLATION DEMO</span>
        </div>

        {/* Section Heading */}
        <h2 className="text-2xl md:text-4xl font-extrabold uppercase tracking-tight text-center text-vaani-text mb-4">
          EXPERIENCE THE POWER OF OUR AI AUDIO TECHNOLOGY
        </h2>

        <p className="text-xs md:text-sm text-vaani-text-muted text-center max-w-2xl mb-12">
          Select a defence or emergency noise profile below. Toggle &quot;Voice Isolation&quot; to hear and visualize how VAANI strips chaotic noise while isolating intelligible voice in real time.
        </p>

        {/* Main Audio Player Suite Container */}
        <div className="w-full rounded-2xl border border-vaani-border bg-vaani-surface shadow-2xl overflow-hidden flex flex-col lg:flex-row transition-all hover:border-vaani-accent/40">
          {/* Left: Playlist Sidebar */}
          <div className="w-full lg:w-[250px] lg:shrink-0 border-b lg:border-b-0 lg:border-r border-vaani-border bg-vaani-card/50">
            <Playlist
              samples={AUDIO_SAMPLES}
              currentSampleId={state.currentSampleId}
              onSelect={handleSelect}
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
                isActive={state.isPlaying}
              />
            </div>

            {/* Playback Controls Bar */}
            <PlayerControls
              isPlaying={state.isPlaying}
              currentTime={state.currentTime}
              duration={state.duration}
              isIsolationOn={state.isIsolationOn}
              viewMode={state.viewMode}
              isLoading={state.isLoading}
              onPlay={play}
              onPause={pause}
              onSeek={handleSeek}
              onToggleIsolation={handleToggleIsolation}
              onSetViewMode={setViewMode}
              onPrev={prevTrack}
              onNext={nextTrack}
            />

            {/* Live Telemetry Row */}
            <Telemetry telemetry={state.telemetry} />
          </div>
        </div>

        {/* Bottom CTA Box */}
        <div className="mt-12 p-6 rounded-xl border border-vaani-border bg-vaani-surface flex flex-col sm:flex-row items-center justify-between w-full max-w-3xl shadow-lg gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-vaani-text">
              WANT TO BENCHMARK WITH CUSTOM ACOUSTIC PROFILES?
            </div>
            <div className="text-[0.75rem] text-vaani-text-muted mt-0.5">
              Contact our engineering team for on-target embedded evaluation kits and CMSIS-NN SDK binaries.
            </div>
          </div>
          <a
            href="#specs"
            className="px-5 py-2.5 rounded border border-vaani-border bg-vaani-card hover:border-vaani-accent text-vaani-text hover:text-vaani-accent text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap"
          >
            Request SDK &gt;&gt;
          </a>
        </div>
      </div>
    </section>
  );
}
