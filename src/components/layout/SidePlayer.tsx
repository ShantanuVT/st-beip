'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Controls } from '@/components/player/Controls';
import { usePlayerStore, useEdgeLightingStore } from '@/lib/store/playerStore';

/**
 * Desktop Side-Player Panel (Feature 4)
 * 
 * A permanent right-hand vertical panel with:
 * - Track info and album art
 * - Vertical progress bar
 * - Play/Pause, Prev, Next, Shuffle controls
 * - Master Volume slider
 * - Edge Lighting Brightness slider
 * - Collapsible with smooth CSS transform animation
 * - Floating tab to re-expand
 * 
 * All animations use CSS transforms for 60fps performance.
 */
export function SidePlayer() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { currentTrack, currentTime, duration, volume, isMuted, isPlaying, setVolume, toggleMute, seek } = usePlayerStore();
  const { brightness, setBrightness } = useEdgeLightingStore();

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Floating tab to re-expand */}
      <AnimatePresence>
        {isCollapsed && (
          <motion.button
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={toggleCollapse}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-40 w-10 h-20 bg-surface-alt border border-border border-r-0 rounded-l-xl flex items-center justify-center hover:bg-surface-alt/80 transition-colors group"
            title="Show player"
          >
            <svg
              className="w-4 h-4 text-text-secondary group-hover:text-text-primary transition-colors"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Side Panel */}
      <motion.div
        className="fixed right-0 top-0 h-full z-30 bg-surface border-l border-border flex flex-col"
        initial={false}
        animate={{
          x: isCollapsed ? 320 : 0,
        }}
        transition={{
          type: 'spring',
          damping: 25,
          stiffness: 250,
        }}
        style={{ width: 320 }}
      >
        {/* Collapse toggle */}
        <button
          onClick={toggleCollapse}
          className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-surface-alt border border-border rounded-l-lg flex items-center justify-center hover:bg-surface-alt/80 transition-colors z-10 group"
          title="Hide player"
        >
          <svg
            className="w-3 h-3 text-text-secondary group-hover:text-text-primary transition-colors"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="flex-1 flex flex-col items-center justify-between p-6 overflow-y-auto">
          {/* Track Info */}
          <div className="w-full text-center space-y-4">
            {/* Album Art */}
            <div className="relative mx-auto w-48 h-48 rounded-2xl overflow-hidden bg-surface-alt shadow-lg">
              {currentTrack?.albumArt ? (
                <img
                  src={currentTrack.albumArt}
                  alt={currentTrack.album}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-muted">
                  <svg className="w-16 h-16" viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </div>
              )}

              {/* Vinyl spin animation when playing */}
              {isPlaying && (
                <div className="absolute inset-0 rounded-2xl ring-1 ring-white/10" />
              )}
            </div>

            {/* Track Title & Artist */}
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-text-primary truncate">
                {currentTrack?.title || 'No Track Selected'}
              </h3>
              <p className="text-sm text-text-secondary truncate">
                {currentTrack?.artist || 'Select a song to play'}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="w-full space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div
                className="relative w-full h-1.5 bg-surface-alt rounded-full cursor-pointer group"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = (e.clientX - rect.left) / rect.width;
                  seek(percent * duration);
                }}
              >
                <div
                  className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-glow-sm"
                  style={{ left: `calc(${progress}% - 6px)` }}
                />
              </div>
              <div className="flex justify-between text-xs text-text-muted">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <Controls size="sm" />

            {/* Master Volume Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-text-muted uppercase tracking-wider">Volume</label>
                <button
                  onClick={toggleMute}
                  className="text-text-muted hover:text-text-secondary transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {isMuted || volume === 0 ? (
                      <>
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <line x1="23" y1="9" x2="17" y2="15" />
                        <line x1="17" y1="9" x2="23" y2="15" />
                      </>
                    ) : (
                      <>
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full h-1.5 bg-surface-alt rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                  [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-glow-sm
                  [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
                style={{
                  background: `linear-gradient(to right, var(--color-primary) ${volume}%, var(--color-surface-alt) ${volume}%)`,
                }}
              />
            </div>

            {/* Edge Lighting Brightness Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-text-muted uppercase tracking-wider">Edge Light</label>
                <span className="text-xs text-text-muted">{brightness}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full h-1.5 bg-surface-alt rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                  [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-glow-sm
                  [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
                style={{
                  background: `linear-gradient(to right, var(--color-accent) ${brightness}%, var(--color-surface-alt) ${brightness}%)`,
                }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
