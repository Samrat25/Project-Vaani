"use client";

import React from "react";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import AudacityWaveformTrack from "./audio/AudacityWaveformTrack";
import Telemetry from "./audio/Telemetry";

export default function AudioDemo(): React.JSX.Element {
  const {
    state,
    engineRef,
    selectMic,
    toggleStream,
    toggleBypass,
    toggleMuteMic,
    toggleMuteSpeaker,
    setVolume,
    toggleReviewPlayback,
    startReviewPlaybackAt,
    clearError,
  } = useAudioEngine();

  // Status Badge Helper
  const renderStatusBadge = () => {
    switch (state.connectionStatus) {
      case "connected":
        return (
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold">Streaming (ws://localhost:8000)</span>
          </div>
        );
      case "connecting":
        return (
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-spin" />
            <span className="font-bold">Connecting...</span>
          </div>
        );
      case "error":
        return (
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            <span className="font-bold">Server Offline</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono bg-slate-500/10 border border-slate-500/30 text-slate-400">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            <span className="font-bold">Ready</span>
          </div>
        );
    }
  };

  const rawSnrSign = state.telemetry.rawSnr && state.telemetry.rawSnr > 0 ? "+" : "";
  const procSnrSign = state.telemetry.enhancedSnr && state.telemetry.enhancedSnr > 0 ? "+" : "";

  return (
    <section
      id="player"
      className="w-full py-16 border-b border-vaani-border bg-vaani-bg transition-colors duration-200"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-vaani-accent/40 bg-vaani-accent/10 text-vaani-accent text-[0.7rem] font-bold tracking-widest uppercase shadow-glow-sm">
            <span>FULL-DUPLEX WEBSOCKET NEURAL STREAMING SUITE</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold uppercase tracking-tight text-vaani-text">
            LIVE COMBAT SPEECH ENHANCEMENT DEMO
          </h2>
          <p className="text-xs md:text-sm text-vaani-text-muted max-w-2xl">
            Stream microphone audio over WebSockets to <code className="text-vaani-accent">DPDFNet-8 ONNX</code>. Inspect the continuous 30-second rolling waveforms in real time, compare with Raw Bypass, and click any waveform to play back review segments.
          </p>
        </div>

        {/* Connection / Permission Error Alert */}
        {state.errorMessage && (
          <div className="p-4 rounded-xl border border-rose-500/50 bg-rose-950/30 text-rose-200 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs shadow-lg animate-fadeIn">
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
                  Ensure the backend is running: <code className="px-1 bg-black/40 rounded text-rose-300">python -m server.main</code> and browser microphone permission is granted.
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

        {/* CONTROLS BAR */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs font-mono transition-colors">
          {/* Left: Mic Select & Stream Start / Stop */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Microphone Dropdown */}
            <div className="relative min-w-[200px] sm:min-w-[250px]">
              <select
                value={state.selectedMicId}
                onChange={(e) => selectMic(e.target.value)}
                disabled={state.isStreaming}
                className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-3 py-2 pr-8 appearance-none focus:outline-none focus:ring-1 focus:ring-slate-400 transition-colors disabled:opacity-60"
              >
                {state.availableMics.length === 0 ? (
                  <option value="">Default Microphone</option>
                ) : (
                  state.availableMics.map((mic) => (
                    <option key={mic.deviceId} value={mic.deviceId}>
                      {mic.label}
                    </option>
                  ))
                )}
              </select>
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                ▼
              </span>
            </div>

            {/* Stream Toggle Button */}
            <button
              onClick={toggleStream}
              disabled={state.connectionStatus === "connecting"}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all shadow-xs active:scale-[0.98] ${
                state.isStreaming
                  ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40"
                  : "bg-slate-900 dark:bg-vaani-accent text-white dark:text-black hover:bg-slate-800 dark:hover:bg-vaani-accent-light"
              } disabled:opacity-50`}
            >
              <span>{state.isStreaming ? "⏹" : "▶"}</span>
              <span>{state.isStreaming ? "Stop" : "Start"}</span>
            </button>
          </div>

          {/* Right: Bypass Filter, Mute Mic, Mute Speaker, Volume Slider, Status */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Bypass Filtering Button */}
            <button
              onClick={toggleBypass}
              title="Toggle filter bypass (listen to raw mic instead of filtered audio)"
              className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 border transition-colors ${
                state.isBypassActive
                  ? "bg-amber-500/15 border-amber-500/50 text-amber-500"
                  : "bg-slate-50 dark:bg-[#0d1117] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              }`}
            >
              <span>⚙</span>
              <span>{state.isBypassActive ? "Bypass: Active" : "Bypass Filter"}</span>
            </button>

            {/* Mute Mic Button */}
            <button
              onClick={toggleMuteMic}
              className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 border transition-colors ${
                state.isMicMuted
                  ? "bg-rose-500/15 border-rose-500/50 text-rose-400"
                  : "bg-slate-50 dark:bg-[#0d1117] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              }`}
            >
              <span>🎤</span>
              <span>{state.isMicMuted ? "Mic Muted" : "Mute Mic"}</span>
            </button>

            {/* Mute Speaker Button */}
            <button
              onClick={toggleMuteSpeaker}
              className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 border transition-colors ${
                state.isSpeakerMuted
                  ? "bg-rose-500/15 border-rose-500/50 text-rose-400"
                  : "bg-slate-50 dark:bg-[#0d1117] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              }`}
            >
              <span>🔊</span>
              <span>{state.isSpeakerMuted ? "Speaker Muted" : "Mute Speaker"}</span>
            </button>

            {/* Speaker Volume Slider */}
            <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 text-xs">🔈</span>
              <input
                type="range"
                min="0"
                max="100"
                value={state.speakerVolume}
                onChange={(e) => setVolume(parseInt(e.target.value, 10))}
                className="w-20 accent-slate-700 dark:accent-vaani-accent h-1 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                title="Speaker volume"
              />
            </div>

            {/* Status Badge */}
            <div className="pl-2 border-l border-slate-200 dark:border-slate-800">
              {renderStatusBadge()}
            </div>
          </div>
        </div>

        {/* AUDACITY-STYLE 30-SECOND CONTINUOUS ROLLING WAVEFORMS */}
        <div className="space-y-4">
          {/* TRACK 1: RAW INPUT WAVEFORM */}
          <AudacityWaveformTrack
            trackType="raw"
            title="Raw Input"
            badgeDotClass="bg-blue-500"
            strokeColor="#2563eb"
            fillColor="rgba(59, 130, 246, 0.22)"
            isStreaming={state.isStreaming}
            hasRecordedAudio={state.hasRecordedAudio}
            isReviewPlaying={state.isReviewPlaying}
            activeReviewTrack={state.activeReviewTrack}
            engineRef={engineRef}
            onToggleReview={toggleReviewPlayback}
            onSeekReview={startReviewPlaybackAt}
            snrText={
              state.telemetry.rawSnr !== undefined
                ? `SNR: ${rawSnrSign}${state.telemetry.rawSnr.toFixed(1)} dB`
                : "SNR: -- dB"
            }
            levelText={
              state.telemetry.rawLevel > -90
                ? `${state.telemetry.rawLevel.toFixed(1)} dB`
                : "-inf dB"
            }
          />

          {/* TRACK 2: ENHANCED SAMPLE WAVEFORM */}
          <AudacityWaveformTrack
            trackType="proc"
            title="Enhanced Sample (DPDFNet-8)"
            badgeDotClass="bg-teal-500"
            strokeColor="#0d9488"
            fillColor="rgba(13, 148, 136, 0.22)"
            isStreaming={state.isStreaming}
            hasRecordedAudio={state.hasRecordedAudio}
            isReviewPlaying={state.isReviewPlaying}
            activeReviewTrack={state.activeReviewTrack}
            engineRef={engineRef}
            onToggleReview={toggleReviewPlayback}
            onSeekReview={startReviewPlaybackAt}
            snrText={
              state.telemetry.enhancedSnr !== undefined
                ? `SNR: ${procSnrSign}${state.telemetry.enhancedSnr.toFixed(1)} dB`
                : "SNR: -- dB"
            }
            pesqText={
              state.telemetry.pesq !== undefined
                ? `PESQ: ${state.telemetry.pesq.toFixed(2)}`
                : undefined
            }
            stoiText={
              state.telemetry.stoi !== undefined
                ? `STOI: ${state.telemetry.stoi.toFixed(2)}`
                : undefined
            }
            levelText={
              state.telemetry.signalLevel > -90
                ? `${state.telemetry.signalLevel.toFixed(1)} dB`
                : "-inf dB"
            }
          />
        </div>

        {/* Real-time Telemetry HUD */}
        <div className="rounded-xl border border-vaani-border overflow-hidden shadow-lg">
          <Telemetry telemetry={state.telemetry} />
        </div>

        {/* Footer Technical Note */}
        <div className="text-center text-xs font-mono text-vaani-text-dim">
          <span>Continuous 30.0s Rolling Window Buffer &bull; Click Waveform to Playback &bull; ONNX Recurrent STFT</span>
        </div>

      </div>
    </section>
  );
}
