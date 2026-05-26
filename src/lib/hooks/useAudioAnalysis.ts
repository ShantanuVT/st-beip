'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import type { FrequencyData, EdgeLightingMode } from '@/types';

interface UseAudioAnalysisOptions {
  mode: EdgeLightingMode;
  sensitivity: number;
  fftSize?: number;
}

interface UseAudioAnalysisReturn {
  frequencyData: FrequencyData;
  isAnalyzing: boolean;
  connectSource: (source: MediaElementAudioSourceNode | MediaStreamAudioSourceNode) => void;
  disconnect: () => void;
  analyserNode: AnalyserNode | null;
}

/**
 * Custom hook that provides real-time audio frequency analysis
 * using the Web Audio API. Returns frequency band data (bass, mids, treble)
 * for powering reactive visualizations like edge lighting.
 */
export function useAudioAnalysis(options: UseAudioAnalysisOptions): UseAudioAnalysisReturn {
  const { mode, sensitivity, fftSize = 256 } = options;

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioNode | null>(null);
  const rafRef = useRef<number>(0);

  const [frequencyData, setFrequencyData] = useState<FrequencyData>({
    bass: 0,
    lowMid: 0,
    mid: 0,
    highMid: 0,
    treble: 0,
    timestamp: 0,
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Initialize AudioContext and AnalyserNode
  const initContext = useCallback(() => {
    if (audioContextRef.current) return;

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = fftSize;
    analyser.smoothingTimeConstant = 0.8;

    audioContextRef.current = ctx;
    analyserRef.current = analyser;
  }, [fftSize]);

  // Analysis loop using requestAnimationFrame
  const startAnalysisLoop = useCallback(() => {
    const analyser = analyserRef.current;
    const ctx = audioContextRef.current;
    if (!analyser || !ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const sampleRate = ctx.sampleRate;
    const binWidth = sampleRate / analyser.fftSize;

    const analyze = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);

      // Calculate frequency band energies
      const getEnergy = (startFreq: number, endFreq: number): number => {
        const minIndex = Math.floor(startFreq / binWidth);
        const maxIndex = Math.min(Math.floor(endFreq / binWidth), bufferLength - 1);
        let sum = 0;
        let count = 0;
        for (let i = minIndex; i <= maxIndex; i++) {
          sum += dataArray[i];
          count++;
        }
        return count > 0 ? sum / count : 0;
      };

      // Apply sensitivity scaling (sensitivity: 0-100 maps to 0.2-2.0 multiplier)
      const s = 0.2 + (sensitivity / 100) * 1.8;

      const data: FrequencyData = {
        bass: Math.min(255, getEnergy(20, 250) * s),
        lowMid: Math.min(255, getEnergy(250, 500) * s),
        mid: Math.min(255, getEnergy(500, 2000) * s),
        highMid: Math.min(255, getEnergy(2000, 4000) * s),
        treble: Math.min(255, getEnergy(4000, 20000) * s),
        timestamp: Date.now(),
      };

      setFrequencyData(data);
      rafRef.current = requestAnimationFrame(analyze);
    };

    rafRef.current = requestAnimationFrame(analyze);
  }, [sensitivity]);

  // Connect a media element source
  const connectSource = useCallback(
    (source: MediaElementAudioSourceNode | MediaStreamAudioSourceNode) => {
      initContext();

      const ctx = audioContextRef.current;
      const analyser = analyserRef.current;
      if (!ctx || !analyser) return;

      // Disconnect previous source
      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect(analyser);
        } catch {}
      }

      source.connect(analyser);
      sourceRef.current = source;

      // Resume context if suspended (autoplay policy)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      setIsAnalyzing(true);
      startAnalysisLoop();
    },
    [initContext, startAnalysisLoop]
  );

  // Disconnect and stop analysis
  const disconnect = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }

    if (sourceRef.current && analyserRef.current) {
      try {
        sourceRef.current.disconnect(analyserRef.current);
      } catch {}
    }
    sourceRef.current = null;
    setIsAnalyzing(false);

    setFrequencyData({
      bass: 0,
      lowMid: 0,
      mid: 0,
      highMid: 0,
      treble: 0,
      timestamp: 0,
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  return {
    frequencyData,
    isAnalyzing,
    connectSource,
    disconnect,
    analyserNode: analyserRef.current,
  };
}

/**
 * Maps frequency data to RGB values based on the edge lighting mode.
 */
export function frequencyToRGB(
  data: FrequencyData,
  mode: EdgeLightingMode,
  brightness: number
): { r: number; g: number; b: number } {
  const bFactor = brightness / 100;

  switch (mode) {
    case 'static-cycle': {
      // Smooth HSL hue rotation
      const hue = (Date.now() / 30) % 360;
      return hslToRgb(hue, 100, 50 + 25 * bFactor);
    }

    case 'beat-flicker': {
      // Bass-driven RGB with dynamic color mapping
      const bassEnergy = data.bass / 255;
      const midEnergy = data.mid / 255;
      const trebleEnergy = data.treble / 255;

      // Map frequency bands to RGB channels
      const r = Math.min(255, Math.floor(180 + bassEnergy * 75 * bFactor));
      const g = Math.min(255, Math.floor(100 + midEnergy * 155 * bFactor));
      const b = Math.min(255, Math.floor(50 + trebleEnergy * 205 * bFactor));

      return { r, g, b };
    }

    default:
      return { r: 0, g: 0, b: 0 };
  }
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return {
    r: Math.round(255 * f(0)),
    g: Math.round(255 * f(8)),
    b: Math.round(255 * f(4)),
  };
}
