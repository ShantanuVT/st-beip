'use client';

import { useRef, useCallback, useEffect } from 'react';

interface GestureConfig {
  onVolumeChange: (delta: number) => void;
  onBrightnessChange: (delta: number) => void;
  sensitivity?: number;
}

interface GestureState {
  isDragging: boolean;
  startY: number;
  currentY: number;
  zone: 'left' | 'right' | null;
}

/**
 * Custom hook that handles touch gestures for mobile playback control.
 * 
 * Gesture Zones:
 * - Left side swipe up/down → Edge Lighting Brightness control
 * - Right side swipe up/down → Master Volume control
 * 
 * Uses hardware-accelerated passive event listeners for 60fps performance.
 */
export function useGesture(config: GestureConfig) {
  const { onVolumeChange, onBrightnessChange, sensitivity = 2 } = config;
  const stateRef = useRef<GestureState>({
    isDragging: false,
    startY: 0,
    currentY: 0,
    zone: null,
  });

  const lastEmittedRef = useRef<{ volume: number; brightness: number }>({
    volume: 0,
    brightness: 0,
  });

  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      const touch = e.touches[0];
      const windowWidth = window.innerWidth;

      // Determine gesture zone based on horizontal touch position
      const zone = touch.clientX < windowWidth / 2 ? 'left' : 'right';

      stateRef.current = {
        isDragging: true,
        startY: touch.clientY,
        currentY: touch.clientY,
        zone,
      };

      lastEmittedRef.current = { volume: 0, brightness: 0 };
    },
    []
  );

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      const state = stateRef.current;
      if (!state.isDragging) return;

      e.preventDefault(); // Prevent page scroll during gesture

      const touch = e.touches[0];
      state.currentY = touch.clientY;

      const deltaY = state.startY - state.currentY;
      const normalizedDelta = (deltaY / window.innerHeight) * 100 * (sensitivity / 2);

      if (state.zone === 'right') {
        // Volume control
        const clampedDelta = Math.max(-100, Math.min(100, normalizedDelta));
        const stepDelta = clampedDelta - lastEmittedRef.current.volume;
        if (Math.abs(stepDelta) > 1) {
          lastEmittedRef.current.volume = clampedDelta;
          onVolumeChange(stepDelta);
        }
      } else if (state.zone === 'left') {
        // Brightness control
        const clampedDelta = Math.max(-100, Math.min(100, normalizedDelta));
        const stepDelta = clampedDelta - lastEmittedRef.current.brightness;
        if (Math.abs(stepDelta) > 1) {
          lastEmittedRef.current.brightness = clampedDelta;
          onBrightnessChange(stepDelta);
        }
      }
    },
    [onVolumeChange, onBrightnessChange, sensitivity]
  );

  const onTouchEnd = useCallback(() => {
    stateRef.current.isDragging = false;
    stateRef.current.zone = null;
    lastEmittedRef.current = { volume: 0, brightness: 0 };
  }, []);

  // Track cleanup function
  const cleanupRef = useRef<(() => void) | null>(null);

  // Attach / detach event listeners
  const attachListeners = useCallback(
    (element: HTMLElement | null) => {
      // Run previous cleanup
      cleanupRef.current?.();
      cleanupRef.current = null;

      if (!element) return;

      element.addEventListener('touchstart', onTouchStart, { passive: true });
      element.addEventListener('touchmove', onTouchMove, { passive: false });
      element.addEventListener('touchend', onTouchEnd, { passive: true });
      element.addEventListener('touchcancel', onTouchEnd, { passive: true });

      cleanupRef.current = () => {
        element.removeEventListener('touchstart', onTouchStart);
        element.removeEventListener('touchmove', onTouchMove);
        element.removeEventListener('touchend', onTouchEnd);
        element.removeEventListener('touchcancel', onTouchEnd);
      };
    },
    [onTouchStart, onTouchMove, onTouchEnd]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, []);

  return { attachListeners };
}

/**
 * Returns CSS classes to indicate gesture zones on the full-screen player.
 */
export function getGestureZoneClasses(): string {
  return [
    'absolute inset-0 z-50',
    'touch-none select-none',
    'pointer-events-auto',
  ].join(' ');
}
