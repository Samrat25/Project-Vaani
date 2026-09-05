"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import viperWaveformsData from "@/data/viperWaveforms.json";

interface Scenario {
  id: string;
  category: "Military" | "Emergency";
  title: string;
  subtitle: string;
  rawSrc: string;
  enhancedSrc: string;
  durationSec: number;
}

const SCENARIOS: Scenario[] = [
  {
    id: "airspace",
    category: "Military",
    title: "AIRSPACE DISPUTE",
    subtitle: "Tactical Fighter Intercept & Air Traffic Vector Clearances",
    rawSrc: "/samples/airspace_dispute_raw.wav",
    enhancedSrc: "/samples/airspace_dispute_enhanced.wav",
    durationSec: 22.0,
  },
  {
    id: "chinook",
    category: "Military",
    title: "CHINOOK",
    subtitle: "Heavy-Lift Rotor Wash & Ground Squad LZ Extraction Comms",
    rawSrc: "/samples/chinook_raw.wav",
    enhancedSrc: "/samples/chinook_enhanced.wav",
    durationSec: 16.1,
  },
  {
    id: "refuelling",
    category: "Military",
    title: "AIRCRAFT REFUELLING",
    subtitle: "Aerial Tanker Boom Operator & Cockpit In-Flight Coupling",
    rawSrc: "/samples/aircraft_refuelling_raw.wav",
    enhancedSrc: "/samples/aircraft_refuelling_enhanced.wav",
    durationSec: 218.4,
  },
  {
    id: "engine",
    category: "Military",
    title: "ENGINE ISSUES",
    subtitle: "Armored Combat Vehicle Intercom & Mechanical Telemetry",
    rawSrc: "/samples/engine_issues_raw.wav",
    enhancedSrc: "/samples/engine_issues_enhanced.wav",
    durationSec: 28.0,
  },
  {
    id: "urban",
    category: "Military",
    title: "URBAN WARFARE",
    subtitle: "Multi-Team Tactical Breach & High-Intensity Combat Comms",
    rawSrc: "/samples/urban_warfare_raw.wav",
    enhancedSrc: "/samples/urban_warfare_enhanced.wav",
    durationSec: 57.9,
  },
  {
    id: "crash",
    category: "Emergency",
    title: "PH CRASH ROADSIDE 01",
    subtitle: "Highway Incident Response & Emergency Medical Radio Relaying",
    rawSrc: "/samples/crash_roadside_raw.wav",
    enhancedSrc: "/samples/crash_roadside_enhanced.wav",
    durationSec: 94.6,
  },
];

export default function ViperAudioPlayer(): React.JSX.Element {
  const [activeTrackIndex, setActiveTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isVoiceIsolated, setIsVoiceIsolated] = useState<boolean>(true);
  const [isSpectrogramView, setIsSpectrogramView] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(SCENARIOS[0].durationSec);

  const rawAudioRef = useRef<HTMLAudioElement | null>(null);
  const enhAudioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Web Audio API for real-time Spectrogram & Waveform analysis
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const currentTrack = SCENARIOS[activeTrackIndex];

  // Initialize Web Audio graph on user interaction
  const ensureAudioGraph = () => {
    if (!audioCtxRef.current && typeof window !== "undefined") {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const ctx = new AudioCtx();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;

        if (enhAudioRef.current && rawAudioRef.current) {
          const srcEnh = ctx.createMediaElementSource(enhAudioRef.current);
          const srcRaw = ctx.createMediaElementSource(rawAudioRef.current);
          srcEnh.connect(analyser);
          srcRaw.connect(analyser);
          analyser.connect(ctx.destination);
        }

        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
      } catch {
        // Elements might already be connected
      }
    }

    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  };

  // Sync volume for instant seamless crossfade
  useEffect(() => {
    if (rawAudioRef.current && enhAudioRef.current) {
      if (isVoiceIsolated) {
        enhAudioRef.current.volume = 1.0;
        rawAudioRef.current.volume = 0.0;
      } else {
        enhAudioRef.current.volume = 0.0;
        rawAudioRef.current.volume = 1.0;
      }
    }
  }, [isVoiceIsolated]);

  // Handle track change
  const selectTrack = (index: number) => {
    setActiveTrackIndex(index);
    setCurrentTime(0);
    setDuration(SCENARIOS[index].durationSec);
    const wasPlaying = isPlaying;

    setTimeout(() => {
      if (rawAudioRef.current && enhAudioRef.current) {
        rawAudioRef.current.currentTime = 0;
        enhAudioRef.current.currentTime = 0;
        if (wasPlaying) {
          ensureAudioGraph();
          rawAudioRef.current.play().catch(() => {});
          enhAudioRef.current.play().catch(() => {});
        }
      }
    }, 50);
  };

  // Play / Pause toggle
  const togglePlay = () => {
    ensureAudioGraph();
    if (!rawAudioRef.current || !enhAudioRef.current) return;

    if (isPlaying) {
      rawAudioRef.current.pause();
      enhAudioRef.current.pause();
      setIsPlaying(false);
    } else {
      const pos = currentTime;
      rawAudioRef.current.currentTime = pos;
      enhAudioRef.current.currentTime = pos;
      Promise.all([rawAudioRef.current.play(), enhAudioRef.current.play()])
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  // Previous & Next track
  const handlePrev = () => {
    const prev = (activeTrackIndex - 1 + SCENARIOS.length) % SCENARIOS.length;
    selectTrack(prev);
  };

  const handleNext = () => {
    const next = (activeTrackIndex + 1) % SCENARIOS.length;
    selectTrack(next);
  };

  // Seek handler
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (rawAudioRef.current && enhAudioRef.current) {
      rawAudioRef.current.currentTime = newTime;
      enhAudioRef.current.currentTime = newTime;
    }
  };

  // Time update sync
  const handleTimeUpdate = () => {
    if (enhAudioRef.current) {
      setCurrentTime(enhAudioRef.current.currentTime);
      if (enhAudioRef.current.duration && !isNaN(enhAudioRef.current.duration)) {
        setDuration(enhAudioRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (enhAudioRef.current && enhAudioRef.current.duration && !isNaN(enhAudioRef.current.duration)) {
      setDuration(enhAudioRef.current.duration);
    }
  };

  // Audio ended handler
  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Draw Dual-Layer Waveform or Spectrogram
  const drawVisualizer = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (isSpectrogramView && analyserRef.current) {
      // 1. Spectrogram Mode: Frequency FFT Waterfall
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);

      const numBins = Math.min(bufferLength, 80);
      const barWidth = width / numBins;

      for (let i = 0; i < numBins; i++) {
        const val = dataArray[i];
        const barHeight = (val / 255) * (height - 20);
        const x = i * barWidth;
        const y = height - barHeight - 10;

        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        if (isVoiceIsolated) {
          gradient.addColorStop(0, "#ff5500");
          gradient.addColorStop(0.5, "#ff9e2c");
          gradient.addColorStop(1, "#00f0ff");
        } else {
          gradient.addColorStop(0, "#555555");
          gradient.addColorStop(0.5, "#888888");
          gradient.addColorStop(1, "#aaaaaa");
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth - 1, barHeight);
      }
    } else {
      // 2. Waveform Mode: Authentic Dual-Layer Vertical Bars from real audio
      const trackData = (viperWaveformsData as Record<string, { raw: number[]; voice: number[]; duration: number }>)[currentTrack.id];
      const rawBars = trackData?.raw || [];
      const voiceBars = trackData?.voice || [];
      const numBars = Math.max(rawBars.length, 76);

      const progressRatio = duration > 0 ? currentTime / duration : 0;
      const barWidth = (width - numBars * 2.5) / numBars;
      const centerY = height / 2;

      for (let i = 0; i < numBars; i++) {
        const barRatio = i / numBars;
        const isPastPlayhead = barRatio <= progressRatio;
        const rawAmp = rawBars[i] ?? 0.3;
        const voiceAmp = voiceBars[i] ?? 0;

        const rawBarH = Math.max(6, rawAmp * (height * 0.82));
        const rawTop = centerY - rawBarH / 2;
        const x = i * (barWidth + 2.5) + 4;

        // Layer 1: Grey raw noise bars
        if (isVoiceIsolated) {
          // When voice is isolated, background raw bars dim
          ctx.fillStyle = isPastPlayhead
            ? "rgba(180, 185, 195, 0.45)"
            : "rgba(110, 115, 125, 0.25)";
        } else {
          // When raw noise pass is active, grey bars are prominent
          ctx.fillStyle = isPastPlayhead
            ? "rgba(235, 235, 240, 0.95)"
            : "rgba(160, 160, 170, 0.50)";
        }
        ctx.fillRect(x, rawTop, barWidth, rawBarH);

        // Layer 2: Orange Isolated Voice Bars
        if (voiceAmp > 0) {
          const voiceBarH = isVoiceIsolated
            ? Math.max(8, voiceAmp * (height * 0.82))
            : Math.max(4, voiceAmp * (height * 0.52));
          const voiceTop = centerY - voiceBarH / 2;

          if (isVoiceIsolated) {
            ctx.fillStyle = isPastPlayhead ? "#FF8C00" : "#FF6600";
            ctx.shadowColor = "rgba(255, 107, 0, 0.45)";
            ctx.shadowBlur = 8;
          } else {
            ctx.fillStyle = "rgba(255, 140, 0, 0.25)";
            ctx.shadowBlur = 0;
          }
          ctx.fillRect(x + 0.5, voiceTop, Math.max(1, barWidth - 1), voiceBarH);
          ctx.shadowBlur = 0;
        }
      }

      // Playhead vertical line
      const playheadX = progressRatio * width;
      ctx.strokeStyle = "#FF8C00";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(playheadX, 4);
      ctx.lineTo(playheadX, height - 4);
      ctx.stroke();
    }

    animFrameIdRef.current = requestAnimationFrame(drawVisualizer);
  }, [isSpectrogramView, isVoiceIsolated, currentTime, duration, currentTrack.id]);

  useEffect(() => {
    animFrameIdRef.current = requestAnimationFrame(drawVisualizer);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [drawVisualizer]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <section id="player" className="w-full py-20 relative z-10 font-sans">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
        {/* Section Title */}
        <div className="text-center mb-8 sm:mb-12">
          <p className="text-[#FF6B00] text-xs sm:text-sm font-mono tracking-widest uppercase mb-2">
            PROJECT VAANI • MISSION-CRITICAL AUDIO DEMONSTRATION
          </p>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold uppercase tracking-wider text-white font-sans">
            EXPERIENCE THE POWER OF OUR AI AUDIO TECHNOLOGY
          </h2>
          <p className="text-neutral-400 text-xs sm:text-sm max-w-2xl mx-auto mt-2">
            Project Vaani authentic two-way military and emergency communications. Toggle Voice Isolation to audition sub-3ms real-time acoustic separation.
          </p>
        </div>

        {/* Hidden Dual Audio Elements for Seamless Crossfade */}
        <audio
          ref={rawAudioRef}
          src={currentTrack.rawSrc}
          preload="auto"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />
        <audio
          ref={enhAudioRef}
          src={currentTrack.enhancedSrc}
          preload="auto"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />

        {/* 2-Column Audio Visualizers Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
          {/* LEFT SIDEBAR: Playlist & Demo CTA */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-4">
            {/* Playlist Container */}
            <div className="bg-[#12141a]/95 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col h-full">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-neutral-400 font-bold mb-3.5">
                <span>SELECT A FILE TO LISTEN TO:</span>
                <span className="text-[10px] text-[#FF6B00] font-mono">6 SCENARIOS</span>
              </div>

              {/* Track List */}
              <div className="space-y-2 flex-1 overflow-y-auto max-h-[360px] pr-1 scrollbar-thin">
                {SCENARIOS.map((track, idx) => {
                  const isSelected = activeTrackIndex === idx;
                  return (
                    <button
                      key={track.id}
                      onClick={() => selectTrack(idx)}
                      className={`w-full text-left p-3 rounded-xl border transition-all duration-200 flex flex-col gap-1 ${
                        isSelected
                          ? "border-[#FF6B00] bg-gradient-to-r from-[#FF6B00]/20 to-transparent shadow-[0_0_18px_rgba(255,107,0,0.22)]"
                          : "border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] uppercase font-bold tracking-wider ${isSelected ? "text-[#FF6B00]" : "text-neutral-400"}`}>
                            {track.category}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            • {formatTime(track.durationSec)}
                          </span>
                        </div>
                        {isSelected && isPlaying && (
                          <span className="w-2 h-2 rounded-full bg-[#FF6B00] animate-ping" />
                        )}
                      </div>
                      <div
                        className={`text-xs sm:text-sm font-bold tracking-wide uppercase ${
                          isSelected ? "text-white" : "text-neutral-300"
                        }`}
                      >
                        {track.title}
                      </div>
                      <div className="text-[11px] text-neutral-400 leading-snug line-clamp-1">
                        {track.subtitle}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Want To Test CTA Card */}
            <div className="bg-[#12141a]/95 border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col justify-between gap-2">
              <div className="text-[11px] uppercase font-bold tracking-wider text-neutral-400">
                WANT TO TEST WITH YOUR OWN AUDIO?
              </div>
              <p className="text-[11px] text-neutral-400 leading-snug">
                Stream live microphone audio directly to our sub-3ms air-gapped DPDFNet-8 DSP pipeline.
              </p>
              <Link
                href="/demo"
                className="w-full mt-1 py-2.5 px-4 bg-[#FF6B00]/10 hover:bg-[#FF6B00]/20 border border-[#FF6B00]/30 hover:border-[#FF6B00] text-white rounded-xl text-xs font-semibold text-center transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <span>Test Live Mic &bull; Full Suite</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>

          {/* RIGHT CENTER: Waveform / Spectrogram Visualizer & Transport Bar */}
          <div className="lg:col-span-8 flex flex-col justify-between bg-[#12141a]/95 border border-white/10 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
            {/* Top Toolbar: View Mode Switch */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF6B00]" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  {currentTrack.title}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-neutral-400 font-mono">
                  {isVoiceIsolated ? "VOICE ISOLATED" : "RAW NOISE PASS"}
                </span>
              </div>

              {/* Spectrogram View Toggle */}
              <button
                onClick={() => {
                  ensureAudioGraph();
                  setIsSpectrogramView(!isSpectrogramView);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                  isSpectrogramView
                    ? "bg-[#FF6B00]/20 border-[#FF6B00] text-white shadow-[0_0_12px_rgba(255,107,0,0.3)]"
                    : "bg-white/5 border-white/15 text-neutral-300 hover:border-white/30"
                }`}
              >
                <span className="text-[11px]">∿</span>
                <span>Spectrogram View</span>
                <span
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                    isSpectrogramView
                      ? "bg-[#FF6B00] text-black"
                      : "bg-neutral-600 text-white"
                  }`}
                >
                  {isSpectrogramView ? "✓" : ""}
                </span>
              </button>
            </div>

            {/* Main Visualizer Canvas Area */}
            <div
              className="relative w-full h-[240px] sm:h-[280px] my-auto bg-black/40 rounded-xl overflow-hidden flex items-center justify-center cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                const seekTime = ratio * duration;
                setCurrentTime(seekTime);
                if (rawAudioRef.current && enhAudioRef.current) {
                  rawAudioRef.current.currentTime = seekTime;
                  enhAudioRef.current.currentTime = seekTime;
                }
              }}
            >
              <canvas
                ref={canvasRef}
                width={800}
                height={280}
                className="w-full h-full object-contain"
              />

              {/* Overlay Prompt if paused */}
              {!isPlaying && currentTime === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/25 backdrop-blur-[1px] pointer-events-none">
                  <div className="px-4 py-2 rounded-full bg-black/80 border border-white/20 text-white text-xs font-semibold shadow-2xl flex items-center gap-2">
                    <span className="text-[#FF6B00]">▶</span>
                    <span>Click Play to Audition 2-Person Tactical Dialogue</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Transport Controls Bar */}
            <div className="mt-4 pt-3 border-t border-white/10 flex flex-col gap-3">
              {/* Timeline Scrubber */}
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max={duration || 10}
                  step="0.05"
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#FF6B00]"
                />
              </div>

              {/* Transport Buttons, Time, and Voice Isolation Switch */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                {/* Left: Previous, Play/Pause, Next & Time Display */}
                <div className="flex items-center gap-3">
                  {/* Prev */}
                  <button
                    onClick={handlePrev}
                    aria-label="Previous Track"
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center text-xs transition-colors"
                  >
                    ◀
                  </button>

                  {/* Play / Pause */}
                  <button
                    onClick={togglePlay}
                    aria-label={isPlaying ? "Pause" : "Play"}
                    className="w-10 h-10 rounded-full bg-[#FF6B00] hover:bg-[#ff7d1a] text-black font-bold flex items-center justify-center text-sm shadow-[0_0_18px_rgba(255,107,0,0.4)] transition-all hover:scale-105"
                  >
                    {isPlaying ? "⏸" : "▶"}
                  </button>

                  {/* Next */}
                  <button
                    onClick={handleNext}
                    aria-label="Next Track"
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center text-xs transition-colors"
                  >
                    ▶
                  </button>

                  {/* Elapsed / Total Time */}
                  <div className="font-mono text-xs text-neutral-400 pl-2">
                    <span>{formatTime(currentTime)}</span>
                    <span className="mx-1">/</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Right: Voice Isolation Toggle Pill */}
                <button
                  type="button"
                  onClick={() => setIsVoiceIsolated(!isVoiceIsolated)}
                  className={`flex items-center gap-3 px-4 py-2 rounded-full border transition-all duration-200 shadow-lg ${
                    isVoiceIsolated
                      ? "border-[#FF6B00] bg-[#FF6B00]/15 text-white shadow-[0_0_20px_rgba(255,107,0,0.35)]"
                      : "border-white/15 bg-white/5 text-neutral-400 hover:border-white/30"
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs">
                    ⚡
                  </div>
                  <span className="text-xs sm:text-sm font-semibold tracking-tight text-white">
                    Voice Isolation
                  </span>
                  {/* Slider Knob Indicator */}
                  <div
                    className={`w-8 h-4 rounded-full p-0.5 transition-colors ${
                      isVoiceIsolated ? "bg-[#FF6B00]" : "bg-neutral-700"
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full bg-white transition-transform ${
                        isVoiceIsolated ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
