'use client';

import { useMemo, useRef, useEffect } from 'react';
import { useEdgeLightingStore } from '@/lib/store/playerStore';
import type { FrequencyData } from '@/types';
import { frequencyToRGB } from '@/lib/hooks/useAudioAnalysis';

interface EdgeLightingProps {
  frequencyData?: FrequencyData;
  isActive?: boolean;
}

/**
 * EdgeLighting creates a dynamic RGB glow border around the viewport.
 * 
 * Modes:
 * - none: Completely disabled (zero GPU cost)
 * - static-cycle: Smooth HSL hue rotation independent of audio
 * - beat-flicker: Real-time reactive to bass frequencies from Web Audio API
 * 
 * Uses hardware-accelerated CSS properties:
 * - transform, opacity for animations
 * - will-change for GPU layer promotion
 * - box-shadow for the glow effect (no repaints)
 */
export function EdgeLighting({ frequencyData, isActive = true }: EdgeLightingProps) {
  const { mode, brightness } = useEdgeLightingStore();

  const glowColors = useMemo(() => {
    if (mode === 'none' || !isActive) return null;

    // Use frequency data for beat-flicker, or generate based on time for static-cycle
    const data = frequencyData || {
      bass: 0,
      lowMid: 0,
      mid: 0,
      highMid: 0,
      treble: 0,
      timestamp: Date.now(),
    };

    return frequencyToRGB(data, mode, brightness);
  }, [mode, brightness, frequencyData, isActive]);

  if (mode === 'none' || !isActive || !glowColors) {
    return null;
  }

  const intensity = brightness / 100;
  const glowSize = Math.max(2, 8 * intensity);
  const opacity = Math.max(0.1, 0.6 * intensity);

  const { r, g, b } = glowColors;

  // Use a ref to directly update the glow element's style for performance
  // This avoids React re-renders on every animation frame
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = glowRef.current;
    if (!el) return;

    const intensity = brightness / 100;
    const glowSize = Math.max(2, 8 * intensity);
    const opacity = Math.max(0.1, 0.6 * intensity);

    el.style.boxShadow = [
      `inset 0 0 ${glowSize * 0.5}px ${glowSize * 0.3}px rgba(${r}, ${g}, ${b}, ${opacity * 0.3})`,
      `inset 0 0 ${glowSize * 2}px ${glowSize * 0.5}px rgba(${r}, ${g}, ${b}, ${opacity * 0.2})`,
      `0 0 ${glowSize}px ${glowSize * 0.3}px rgba(${r}, ${g}, ${b}, ${opacity * 0.15})`,
    ].join(', ');
    el.style.opacity = String(opacity * 0.5);
  }, [r, g, b, brightness]);

  return (
    <>
      {/* Edge glow using imperative style updates for 60fps performance */}
      <div
        ref={glowRef}
        className="fixed inset-0 pointer-events-none z-[60]"
        style={{
          willChange: 'opacity, box-shadow',
          transition: mode === 'static-cycle' ? 'box-shadow 0.1s ease' : 'box-shadow 0.05s ease',
        }}
      />

      {/* Corner accent gradients for extra visual pop */}
      <div
        className="fixed pointer-events-none z-[60]"
        style={{
          willChange: 'opacity',
          opacity: opacity * 0.5,
        }}
      >
        <div
          className="absolute top-0 left-0 w-32 h-32"
          style={{
            background: `radial-gradient(circle at top left, rgba(${r}, ${g}, ${b}, ${opacity * 0.4}) 0%, transparent 70%)`,
          }}
        />
        <div
          className="absolute top-0 right-0 w-32 h-32"
          style={{
            background: `radial-gradient(circle at top right, rgba(${g}, ${b}, ${r}, ${opacity * 0.4}) 0%, transparent 70%)`,
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-32 h-32"
          style={{
            background: `radial-gradient(circle at bottom left, rgba(${b}, ${r}, ${g}, ${opacity * 0.4}) 0%, transparent 70%)`,
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-32 h-32"
          style={{
            background: `radial-gradient(circle at bottom right, rgba(${r}, ${b}, ${g}, ${opacity * 0.4}) 0%, transparent 70%)`,
          }}
        />
      </div>
    </>
  );
}
