"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { EngineState, ViewMode, ConnectionStatus, TelemetryData } from "@/lib/types";
import { VaaniAudioEngine } from "@/lib/audioEngine";

export function useAudioEngine() {
  const [state, setState] = useState<EngineState>({
    isStreaming: false,
    isIsolationOn: true,
    isMicMuted: false,
    isSpeakerMuted: false,
    connectionStatus: "idle",
    errorMessage: null,
    activeMicLabel: "Default Microphone",
    activeModelName: "DPDFNet-8 HR (48kHz)",
    streamDuration: 0,
    viewMode: "waveform",
    telemetry: {
      signalLevel: 0,
      rawLevel: -100,
      suppressionGain: 0,
      frameLatency: 0,
      rawSnr: 0,
      enhancedSnr: 0,
      pesq: 2.5,
      stoi: 0.85,
    },
  });

  const engineRef = useRef<VaaniAudioEngine | null>(null);
  const streamTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize engine instance
  useEffect(() => {
    const engine = new VaaniAudioEngine({
      onStatusChange: (status: ConnectionStatus) => {
        setState((prev) => ({
          ...prev,
          connectionStatus: status,
          isStreaming: status === "connected",
        }));
      },
      onError: (errMsg: string) => {
        setState((prev) => ({
          ...prev,
          errorMessage: errMsg,
          connectionStatus: "error",
          isStreaming: false,
        }));
      },
      onHandshake: (handshake) => {
        setState((prev) => ({
          ...prev,
          activeModelName: handshake.model || prev.activeModelName,
        }));
      },
      onTelemetry: (telemetry: TelemetryData) => {
        setState((prev) => ({
          ...prev,
          telemetry,
        }));
      },
    });

    engineRef.current = engine;

    return () => {
      if (streamTimerRef.current) {
        clearInterval(streamTimerRef.current);
      }
      engine.destroy();
    };
  }, []);

  // Stream duration counter
  useEffect(() => {
    if (state.isStreaming) {
      const startTime = Date.now() - state.streamDuration * 1000;
      streamTimerRef.current = setInterval(() => {
        const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
        setState((prev) => ({ ...prev, streamDuration: elapsedSec }));
      }, 1000);
    } else {
      if (streamTimerRef.current) {
        clearInterval(streamTimerRef.current);
        streamTimerRef.current = null;
      }
    }
    return () => {
      if (streamTimerRef.current) {
        clearInterval(streamTimerRef.current);
      }
    };
  }, [state.isStreaming]);

  const startStream = useCallback(async () => {
    if (!engineRef.current) return;
    setState((prev) => ({
      ...prev,
      errorMessage: null,
      streamDuration: 0,
      connectionStatus: "connecting",
    }));

    try {
      await engineRef.current.startStream();
      setState((prev) => ({
        ...prev,
        isStreaming: true,
        connectionStatus: "connected",
        activeMicLabel: engineRef.current?.getActiveMicLabel() || prev.activeMicLabel,
        activeModelName: engineRef.current?.getActiveModelName() || prev.activeModelName,
      }));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to connect to streaming server";
      setState((prev) => ({
        ...prev,
        errorMessage: message,
        connectionStatus: "error",
        isStreaming: false,
      }));
    }
  }, []);

  const stopStream = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.stopStream();
    setState((prev) => ({
      ...prev,
      isStreaming: false,
      connectionStatus: "idle",
    }));
  }, []);

  const toggleStream = useCallback(() => {
    if (state.isStreaming) {
      stopStream();
    } else {
      startStream();
    }
  }, [state.isStreaming, startStream, stopStream]);

  const toggleIsolation = useCallback((on?: boolean) => {
    if (!engineRef.current) return;
    const target = on !== undefined ? on : !engineRef.current.getIsIsolationOn();
    engineRef.current.toggleIsolation(target);
    setState((prev) => ({ ...prev, isIsolationOn: target }));
  }, []);

  const toggleMuteMic = useCallback(() => {
    if (!engineRef.current) return;
    const nextMuted = !state.isMicMuted;
    engineRef.current.toggleMuteMic(nextMuted);
    setState((prev) => ({ ...prev, isMicMuted: nextMuted }));
  }, [state.isMicMuted]);

  const toggleMuteSpeaker = useCallback(() => {
    if (!engineRef.current) return;
    const nextMuted = !state.isSpeakerMuted;
    engineRef.current.toggleMuteSpeaker(nextMuted);
    setState((prev) => ({ ...prev, isSpeakerMuted: nextMuted }));
  }, [state.isSpeakerMuted]);

  const setViewMode = useCallback((mode: ViewMode) => {
    setState((prev) => ({ ...prev, viewMode: mode }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, errorMessage: null }));
  }, []);

  const getRawData = useCallback(() => {
    return engineRef.current?.getRawAnalyserData();
  }, []);

  const getProcData = useCallback(() => {
    return engineRef.current?.getProcessedAnalyserData();
  }, []);

  return {
    state,
    startStream,
    stopStream,
    toggleStream,
    toggleIsolation,
    toggleMuteMic,
    toggleMuteSpeaker,
    setViewMode,
    clearError,
    getRawData,
    getProcData,
  };
}
