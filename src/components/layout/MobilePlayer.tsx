'use client';

import { useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Controls } from '@/components/player/Controls';
import { usePlayerStore, useEdgeLightingStore } from '@/lib/store/playerStore';
import { useGesture } from '@/lib/hooks/useGesture';

/**
 * Mobile Player Layout (Feature 5)
 * 
 * For small-screen breakpoints, transforms the layout into:
 * - A sleek horizontal persistent bottom bar with essential controls
 * - Touch gesture overlay for full-screen player view:
 *   - Right side swipe up/down → Volume control
 *   - Left side swipe up/down → Edge Lighting Brightness control
 * 
 * Automatically hidden on desktop via CSS media queries.
 */
export function MobilePlayer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const gestureOverlayRef = useRef<HTMLDivElement | null>(null);
  const { currentTrack, currentTime, duration, volume, setVolume } = usePlayerStore();
  const { brightness, setBrightness } = useEdgeLightingStore();

  // Gesture handlers
  const handleVolumeChange = useCallback(
    (delta: number) => {
      setVolume(Math.max(0, Math.min(100, volume + delta)));
    },
    [volume, setVolume]
  );

  const handleBrightnessChange = useCallback(
    (delta: number) => {
      setBrightness(Math.max(0, Math.min(100, brightness + delta)));
    },
    [brightness, setBrightness]
  );

  const { attachListeners } = useGesture({
    onVolumeChange: handleVolumeChange,
    onBrightnessChange: handleBrightnessChange,
    sensitivity: 2,
  });

  const gestureRef = useCallback(
    (node: HTMLDivElement | null) => {
      gestureOverlayRef.current = node;
      if (node) {
        attachListeners(node);
      }
    },
    [attachListeners]
  );

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Full-screen player overlay */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-50 bg-surface md:hidden"
          >
            {/* Gesture overlay zone */}
            <div
              ref={gestureRef}
              className="absolute inset-0 z-10 touch-none select-none"
            />

            {/* Gesture zone indicators */}
            <div className="absolute left-0 top-0 bottom-20 w-1/2 z-20 flex items-center justify-start pl-4 pointer-events-none">
              <div className="flex flex-col items-center gap-1 opacity-20">
                <svg className="w-5 h-5 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 15l-6-6-6 6" />
                </svg>
                <span className="text-[10px] text-text-secondary uppercase tracking-widest">Brightness</span>
                <svg className="w-5 h-5 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>

            <div className="absolute right-0 top-0 bottom-20 w-1/2 z-20 flex items-center justify-end pr-4 pointer-events-none">
              <div className="flex flex-col items-center gap-1 opacity-20">
                <svg className="w-5 h-5 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 15l-6-6-6 6" />
                </svg>
                <span className="text-[10px] text-text-secondary uppercase tracking-widest">Volume</span>
                <svg className="w-5 h-5 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>

            {/* Content */}
            <div className="relative z-30 flex flex-col items-center justify-center h-full px-8">
              {/* Album Art */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="w-72 h-72 rounded-3xl overflow-hidden bg-surface-alt shadow-2xl mb-8"
              >
                {currentTrack?.albumArt ? (
                  <img src={currentTrack.albumArt} alt={currentTrack.album} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-muted">
                    <svg className="w-24 h-24" viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                    </svg>
                  </div>
                )}
              </motion.div>

              {/* Track Info */}
              <div className="text-center mb-8">
                <h2 className="text-xl font-semibold text-text-primary">
                  {currentTrack?.title || 'No Track Selected'}
                </h2>
                <p className="text-sm text-text-secondary mt-1">
                  {currentTrack?.artist || 'Select a song to play'}
                </p>
              </div>

              {/* Progress */}
              <div className="w-full max-w-sm mb-6">
                <div
                  className="relative h-1 bg-surface-alt rounded-full cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    usePlayerStore.getState().seek(percent * usePlayerStore.getState().duration);
                  }}
                >
                  <div
                    className="absolute left-0 top-0 h-full bg-primary rounded-full"
                    style={{ width: `${(currentTime / Math.max(1, duration)) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-text-muted">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <Controls size="lg" showShuffle={false} showRepeat={false} />

              {/* Close button */}
              <button
                onClick={() => setIsExpanded(false)}
                className="absolute top-12 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-surface-alt text-text-secondary hover:text-text-primary transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Bar (persistent on mobile) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-xl border-t border-border md:hidden">
        {/* Mini progress bar */}
        <div className="h-0.5 bg-surface-alt">
          <div
            className="h-full bg-primary transition-all duration-200"
            style={{ width: `${(currentTime / Math.max(1, duration)) * 100}%` }}
          />
        </div>

        <div className="flex items-center gap-3 px-4 py-3">
          {/* Track info (tap to expand) */}
          <button
            onClick={() => setIsExpanded(true)}
            className="flex-1 flex items-center gap-3 min-w-0"
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-surface-alt flex-shrink-0">
              {currentTrack?.albumArt ? (
                <img src={currentTrack.albumArt} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-text-muted" viewBox="0 0 24 24" fill="currentColor" opacity="0.5">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {currentTrack?.title || 'No Track'}
              </p>
              <p className="text-xs text-text-secondary truncate">
                {currentTrack?.artist || 'Select a song'}
              </p>
            </div>
          </button>

          {/* Controls */}
          <Controls size="sm" showShuffle={false} showRepeat={false} />
        </div>
      </div>
    </>
  );
}
