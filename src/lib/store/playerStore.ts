'use client';

import { create } from 'zustand';
import type { Track, RepeatMode, QueueItem, PlayerState, EdgeLightingState, EdgeLightingMode } from '@/types';

// ──────────────────────────────────────────────
// Player Store
// ──────────────────────────────────────────────

interface PlayerStore extends PlayerState {
  // Actions
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setRepeat: (mode: RepeatMode) => void;
  playTrack: (track: Track) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setQueue: (queue: QueueItem[]) => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  // Initial state
  currentTrack: null,
  queue: [],
  queueIndex: -1,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 70,
  isMuted: false,
  shuffle: false,
  repeat: 'none',

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

  seek: (time: number) => set({ currentTime: time }),

  setVolume: (volume: number) => set({ volume: Math.max(0, Math.min(100, volume)), isMuted: false }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),

  nextTrack: () => {
    const { queue, queueIndex, shuffle } = get();
    if (queue.length === 0) return;
    let nextIndex: number;
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = (queueIndex + 1) % queue.length;
    }
    set({
      queueIndex: nextIndex,
      currentTrack: queue[nextIndex]?.track ?? null,
      currentTime: 0,
      isPlaying: true,
    });
  },

  prevTrack: () => {
    const { queue, queueIndex, currentTime } = get();
    if (queue.length === 0) return;
    // If more than 3 seconds in, restart current track
    if (currentTime > 3) {
      set({ currentTime: 0 });
      return;
    }
    const prevIndex = queueIndex <= 0 ? queue.length - 1 : queueIndex - 1;
    set({
      queueIndex: prevIndex,
      currentTrack: queue[prevIndex]?.track ?? null,
      currentTime: 0,
      isPlaying: true,
    });
  },

  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
  toggleRepeat: () => {
    const { repeat } = get();
    const modes: RepeatMode[] = ['none', 'one', 'all'];
    const nextIndex = (modes.indexOf(repeat) + 1) % modes.length;
    set({ repeat: modes[nextIndex] });
  },
  setRepeat: (mode: RepeatMode) => set({ repeat: mode }),

  playTrack: (track: Track) => {
    const { queue } = get();
    const existingIndex = queue.findIndex((q) => q.track.id === track.id);
    if (existingIndex >= 0) {
      set({
        currentTrack: track,
        queueIndex: existingIndex,
        currentTime: 0,
        isPlaying: true,
      });
    } else {
      const newQueue = [...queue, { track }];
      set({
        queue: newQueue,
        queueIndex: newQueue.length - 1,
        currentTrack: track,
        currentTime: 0,
        isPlaying: true,
      });
    }
  },

  addToQueue: (track: Track) =>
    set((s) => ({ queue: [...s.queue, { track }] })),

  removeFromQueue: (index: number) =>
    set((s) => ({
      queue: s.queue.filter((_, i) => i !== index),
    })),

  clearQueue: () => set({ queue: [], queueIndex: -1, currentTrack: null, isPlaying: false, currentTime: 0 }),

  setCurrentTime: (time: number) => set({ currentTime: time }),
  setDuration: (duration: number) => set({ duration }),
  setQueue: (queue: QueueItem[]) => set({ queue }),
}));

// ──────────────────────────────────────────────
// Edge Lighting Store
// ──────────────────────────────────────────────

interface EdgeLightingStore extends EdgeLightingState {
  setMode: (mode: EdgeLightingMode) => void;
  setBrightness: (brightness: number) => void;
  setSensitivity: (sensitivity: number) => void;
  setColorSpeed: (speed: number) => void;
}

export const useEdgeLightingStore = create<EdgeLightingStore>((set) => ({
  mode: 'static-cycle',
  brightness: 50,
  sensitivity: 60,
  colorSpeed: 5,

  setMode: (mode: EdgeLightingMode) => set({ mode }),
  setBrightness: (brightness: number) => set({ brightness: Math.max(0, Math.min(100, brightness)) }),
  setSensitivity: (sensitivity: number) => set({ sensitivity: Math.max(0, Math.min(100, sensitivity)) }),
  setColorSpeed: (colorSpeed: number) => set({ colorSpeed: Math.max(1, Math.min(10, colorSpeed)) }),
}));
