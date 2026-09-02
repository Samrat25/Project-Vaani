"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { EngineState, AudioSample, ViewMode } from '@/lib/types';
import { VaaniAudioEngine } from '@/lib/audioEngine';
import { AUDIO_SAMPLES } from '@/lib/audioSamples';

export function useAudioEngine() {
  const [state, setState] = useState<EngineState>({
    isPlaying: false,
    isIsolationOn: false,
    currentTime: 0,
    duration: 0,
    currentSampleId: null,
    viewMode: 'waveform',
    telemetry: { signalLevel: 0, noiseFloor: -90, snrGain: 0, frameLatency: 0 },
    isLoading: false,
  });

  const engineRef = useRef<VaaniAudioEngine | null>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    engineRef.current = new VaaniAudioEngine();
    return () => {
      engineRef.current?.destroy();
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const updateState = useCallback(() => {
    if (!engineRef.current) return;
    
    const isPlaying = engineRef.current.getIsPlaying();
    const currentTime = engineRef.current.getCurrentTime();
    const duration = engineRef.current.getDuration();
    
    if (isPlaying && currentTime >= duration && duration > 0) {
      engineRef.current.stop();
    }

    setState(prev => ({
      ...prev,
      isPlaying: engineRef.current!.getIsPlaying(),
      currentTime: engineRef.current!.getCurrentTime(),
      duration: engineRef.current!.getDuration(),
      telemetry: engineRef.current!.getTelemetry(),
    }));

    if (engineRef.current.getIsPlaying()) {
      animFrameRef.current = requestAnimationFrame(updateState);
    }
  }, []);

  const loadSample = async (sample: AudioSample) => {
    if (!engineRef.current) return;
    
    setState(prev => ({ ...prev, isLoading: true, currentSampleId: sample.id }));
    
    try {
      await engineRef.current.loadSample(sample);
      setState(prev => ({
        ...prev,
        isLoading: false,
        duration: engineRef.current!.getDuration(),
        currentTime: 0,
      }));
    } catch (error) {
      console.error('Failed to load sample:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const play = () => {
    if (!engineRef.current) return;
    engineRef.current.play();
    updateState();
  };

  const pause = () => {
    if (!engineRef.current) return;
    engineRef.current.pause();
    cancelAnimationFrame(animFrameRef.current);
    updateState();
  };

  const stop = () => {
    if (!engineRef.current) return;
    engineRef.current.stop();
    cancelAnimationFrame(animFrameRef.current);
    updateState();
  };

  const seek = (fraction: number) => {
    if (!engineRef.current) return;
    engineRef.current.seek(fraction);
    updateState();
  };

  const toggleIsolation = (on: boolean) => {
    if (!engineRef.current) return;
    engineRef.current.toggleIsolation(on);
    setState(prev => ({ ...prev, isIsolationOn: on }));
  };

  const setViewMode = (mode: ViewMode) => {
    setState(prev => ({ ...prev, viewMode: mode }));
  };

  const nextTrack = () => {
    if (!state.currentSampleId) return;
    const idx = AUDIO_SAMPLES.findIndex(s => s.id === state.currentSampleId);
    if (idx >= 0) {
      const nextIdx = (idx + 1) % AUDIO_SAMPLES.length;
      loadSample(AUDIO_SAMPLES[nextIdx]);
    }
  };

  const prevTrack = () => {
    if (!state.currentSampleId) return;
    const idx = AUDIO_SAMPLES.findIndex(s => s.id === state.currentSampleId);
    if (idx >= 0) {
      const prevIdx = (idx - 1 + AUDIO_SAMPLES.length) % AUDIO_SAMPLES.length;
      loadSample(AUDIO_SAMPLES[prevIdx]);
    }
  };

  const getRawData = () => engineRef.current?.getRawAnalyserData();
  const getProcData = () => engineRef.current?.getProcessedAnalyserData();

  return {
    state,
    loadSample,
    play,
    pause,
    stop,
    seek,
    toggleIsolation,
    setViewMode,
    nextTrack,
    prevTrack,
    getRawData,
    getProcData
  };
}
