"use client";

import { useEffect, useRef, RefObject } from 'react';
import { ViewMode, AnalyserData } from '@/lib/types';

interface RendererOptions {
  mode: ViewMode;
  color: string;
  accentColor: string;
  isActive: boolean;
}

export function useCanvasRenderer(
  canvasRef: RefObject<HTMLCanvasElement>,
  getData: () => AnalyserData | undefined,
  options: RendererOptions
) {
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }
    });
    
    resizeObserver.observe(canvas);

    const render = () => {
      if (!options.isActive) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const data = getData();
      if (!data) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);

      ctx.clearRect(0, 0, width, height);

      if (options.mode === 'waveform') {
        const { timeData } = data;
        if (!timeData || timeData.length === 0) {
           animFrameRef.current = requestAnimationFrame(render);
           return;
        }

        const barWidth = 2;
        const gap = 1;
        const numBars = Math.floor(width / (barWidth + gap));
        const step = Math.floor(timeData.length / numBars);

        const centerY = height / 2;

        for (let i = 0; i < numBars; i++) {
          let min = 255;
          let max = 0;
          for (let j = 0; j < step; j++) {
            const val = timeData[i * step + j];
            if (val < min) min = val;
            if (val > max) max = val;
          }

          const amplitude = Math.max(Math.abs(128 - min), Math.abs(max - 128)) / 128;
          const barHeight = amplitude * centerY * 0.9;
          
          const isPeak = amplitude > 0.8;
          ctx.fillStyle = isPeak ? options.accentColor : options.color;

          ctx.fillRect(i * (barWidth + gap), centerY - barHeight, barWidth, barHeight * 2 || 1);
        }
      } else {
        const { freqData } = data;
        if (!freqData || freqData.length === 0) {
           animFrameRef.current = requestAnimationFrame(render);
           return;
        }
        
        const numBins = 256;
        const barWidth = width / numBins;

        for (let i = 0; i < numBins; i++) {
          const val = freqData[i];
          const normVal = val / 255;
          const barHeight = normVal * height;

          ctx.fillStyle = normVal > 0.6 ? options.accentColor : options.color;
          ctx.globalAlpha = 0.2 + normVal * 0.8;
          
          ctx.fillRect(i * barWidth, height - barHeight, Math.max(1, barWidth - 1), barHeight);
          ctx.globalAlpha = 1.0;
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
    };
  }, [canvasRef, getData, options.mode, options.color, options.accentColor, options.isActive]);
}
