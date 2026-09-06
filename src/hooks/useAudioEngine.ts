"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  EngineState,
  ConnectionStatus,
  TelemetryData,
  AudioDevice,
  ReviewTrack,
} from "@/lib/types";
import { VaaniAudioEngine } from "@/lib/audioEngine";

export function useAudioEngine() {
  const [state, setState] = useState<EngineState>({
    isStreaming: false,
    isBypassActive: false,
    isMicMuted: false,
    isSpeakerMuted: false,
    speakerVolume: 100,
    availableMics: [],
    selectedMicId: "",
    connectionStatus: "idle",
    errorMessage: null,
    activeModelName: "DPDFNet-8 HR (48kHz)",
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
    isReviewPlaying: false,
    activeReviewTrack: null,
    hasRecordedAudio: false,
  });

  const engineRef = useRef<VaaniAudioEngine | null>(null);

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
      onReviewPlaybackStarted: (track: ReviewTrack) => {
        setState((prev) => ({
          ...prev,
          isReviewPlaying: true,
          activeReviewTrack: track,
        }));
      },
      onReviewPlaybackEnded: () => {
        setState((prev) => ({
          ...prev,
          isReviewPlaying: false,
          activeReviewTrack: null,
        }));
      },
    });

    engineRef.current = engine;

    // Enumerate microphones
    engine.enumerateMics().then((mics: AudioDevice[]) => {
      setState((prev) => ({
        ...prev,
        availableMics: mics,
        selectedMicId: mics.length > 0 ? mics[0].deviceId : "",
      }));
    });

    return () => {
      engine.destroy();
    };
  }, []);

  const selectMic = useCallback(async (deviceId: string) => {
    if (!engineRef.current) return;
    engineRef.current.setDeviceId(deviceId);
    setState((prev) => ({ ...prev, selectedMicId: deviceId }));

    // If currently streaming, restart audio stream with new mic
    if (engineRef.current.getIsStreaming()) {
      engineRef.current.stopStream();
      await engineRef.current.startStream();
    }
  }, []);

  const startStream = useCallback(async () => {
    if (!engineRef.current) return;
    setState((prev) => ({
      ...prev,
      errorMessage: null,
      connectionStatus: "connecting",
    }));

    try {
      await engineRef.current.startStream();
      setState((prev) => ({
        ...prev,
        isStreaming: true,
        connectionStatus: "connected",
        hasRecordedAudio: false,
        isReviewPlaying: false,
        activeReviewTrack: null,
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
    const hasRaw = Boolean(
      engineRef.current.frozenRawAudio && engineRef.current.frozenRawAudio.length > 0
    );
    const hasProc = Boolean(
      engineRef.current.frozenProcAudio && engineRef.current.frozenProcAudio.length > 0
    );
    setState((prev) => ({
      ...prev,
      isStreaming: false,
      connectionStatus: "idle",
      hasRecordedAudio: hasRaw || hasProc,
    }));
  }, []);

  const toggleStream = useCallback(() => {
    if (state.isStreaming) {
      stopStream();
    } else {
      startStream();
    }
  }, [state.isStreaming, startStream, stopStream]);

  const toggleBypass = useCallback(() => {
    if (!engineRef.current) return;
    const nextBypass = engineRef.current.toggleBypass();
    setState((prev) => ({ ...prev, isBypassActive: nextBypass }));
  }, []);

  const toggleMuteMic = useCallback(() => {
    if (!engineRef.current) return;
    const nextMuted = engineRef.current.toggleMuteMic();
    setState((prev) => ({ ...prev, isMicMuted: nextMuted }));
  }, []);

  const toggleMuteSpeaker = useCallback(() => {
    if (!engineRef.current) return;
    const nextMuted = engineRef.current.toggleMuteSpeaker();
    setState((prev) => ({ ...prev, isSpeakerMuted: nextMuted }));
  }, []);

  const setVolume = useCallback((volumePercent: number) => {
    if (!engineRef.current) return;
    engineRef.current.setVolume(volumePercent / 100.0);
    setState((prev) => ({ ...prev, speakerVolume: volumePercent }));
  }, []);

  const toggleReviewPlayback = useCallback(async (trackType: "raw" | "proc") => {
    if (!engineRef.current) return;
    await engineRef.current.toggleReviewPlayback(trackType);
    setState((prev) => ({
      ...prev,
      isReviewPlaying: engineRef.current?.getIsReviewPlaying() || false,
      activeReviewTrack: engineRef.current?.getActiveReviewTrack() || null,
    }));
  }, []);

  const startReviewPlaybackAt = useCallback(async (trackType: "raw" | "proc", fraction: number) => {
    if (!engineRef.current) return;
    await engineRef.current.startReviewPlayback(trackType, fraction);
    setState((prev) => ({
      ...prev,
      isReviewPlaying: engineRef.current?.getIsReviewPlaying() || false,
      activeReviewTrack: engineRef.current?.getActiveReviewTrack() || null,
    }));
  }, []);

  const stopReviewPlayback = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.stopReviewPlayback();
    setState((prev) => ({
      ...prev,
      isReviewPlaying: false,
      activeReviewTrack: null,
    }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, errorMessage: null }));
  }, []);

  return {
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
    stopReviewPlayback,
    clearError,
  };
}
