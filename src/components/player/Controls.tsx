'use client';

import { usePlayerStore } from '@/lib/store/playerStore';
import type { RepeatMode } from '@/types';

interface ControlsProps {
  size?: 'sm' | 'md' | 'lg';
  showShuffle?: boolean;
  showRepeat?: boolean;
  className?: string;
}

/**
 * Core playback controls component.
 * Used in both desktop side-player and mobile bottom bar.
 * All animations use CSS transforms for GPU acceleration.
 */
export function Controls({ size = 'md', showShuffle = true, showRepeat = true, className = '' }: ControlsProps) {
  const {
    isPlaying,
    togglePlay,
    nextTrack,
    prevTrack,
    shuffle,
    toggleShuffle,
    repeat,
    toggleRepeat,
  } = usePlayerStore();

  const sizeClasses = {
    sm: { button: 'w-8 h-8', icon: 'w-4 h-4', main: 'w-10 h-10', mainIcon: 'w-5 h-5' },
    md: { button: 'w-10 h-10', icon: 'w-5 h-5', main: 'w-14 h-14', mainIcon: 'w-7 h-7' },
    lg: { button: 'w-12 h-12', icon: 'w-6 h-6', main: 'w-16 h-16', mainIcon: 'w-8 h-8' },
  };

  const s = sizeClasses[size];

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {/* Shuffle */}
      {showShuffle && (
        <button
          onClick={toggleShuffle}
          className={`${s.button} flex items-center justify-center rounded-full transition-all duration-200 hover:bg-surface-alt active:scale-90 ${
            shuffle ? 'text-primary' : 'text-text-muted hover:text-text-secondary'
          }`}
          title="Shuffle"
        >
          <svg className={s.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 3 21 3 21 8" />
            <line x1="4" y1="20" x2="21" y2="3" />
            <polyline points="21 16 21 21 16 21" />
            <line x1="15" y1="15" x2="21" y2="21" />
            <line x1="4" y1="4" x2="9" y2="9" />
          </svg>
        </button>
      )}

      {/* Previous */}
      <button
        onClick={prevTrack}
        className={`${s.button} flex items-center justify-center rounded-full transition-all duration-200 hover:bg-surface-alt active:scale-90 text-text-secondary hover:text-text-primary`}
        title="Previous"
      >
        <svg className={s.icon} viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
        </svg>
      </button>

      {/* Play/Pause */}
      <button
        onClick={togglePlay}
        className={`${s.main} flex items-center justify-center rounded-full bg-primary text-white transition-all duration-200 hover:scale-105 hover:shadow-glow active:scale-95`}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <svg className={s.mainIcon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
          </svg>
        ) : (
          <svg className={s.mainIcon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Next */}
      <button
        onClick={nextTrack}
        className={`${s.button} flex items-center justify-center rounded-full transition-all duration-200 hover:bg-surface-alt active:scale-90 text-text-secondary hover:text-text-primary`}
        title="Next"
      >
        <svg className={s.icon} viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
        </svg>
      </button>

      {/* Repeat */}
      {showRepeat && (
        <button
          onClick={toggleRepeat}
          className={`${s.button} flex items-center justify-center rounded-full transition-all duration-200 hover:bg-surface-alt active:scale-90 relative ${
            repeat !== 'none' ? 'text-primary' : 'text-text-muted hover:text-text-secondary'
          }`}
          title={`Repeat: ${repeat}`}
        >
          <svg className={s.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="17 1 21 5 17 9" />
            <path d="M3 11V9a4 4 0 014-4h14" />
            <polyline points="7 23 3 19 7 15" />
            <path d="M21 13v2a4 4 0 01-4 4H3" />
          </svg>
          {repeat === 'one' && (
            <span className="absolute -top-0.5 -right-0.5 text-[8px] font-bold text-primary">1</span>
          )}
        </button>
      )}
    </div>
  );
}
