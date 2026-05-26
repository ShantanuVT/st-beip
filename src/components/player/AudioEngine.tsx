'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { usePlayerStore } from '@/lib/store/playerStore';
import { AudioAnalyser } from '@/lib/audio/analyser';
import { useThrottle } from '@/lib/hooks/useDebounce';
import type { FrequencyData } from '@/types';

interface AudioEngineProps {
  onFrequencyData?: (data: FrequencyData) => void;
  children?: React.ReactNode;
}

/**
 * AudioEngine manages the underlying HTMLMediaElement,
 * connects it to the Web Audio API pipeline for analysis,
 * and syncs state with the Zustand player store.
 * 
 * This component is invisible — it renders no UI,
 * only the hidden <audio> element and analysis bridge.
 */
export function AudioEngine({ onFrequencyData, children }: AudioEngineProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AudioAnalyser | null>(null);
  const sourceConnectedRef = useRef(false);

  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    currentTime,
    seek,
    setCurrentTime,
    setDuration,
    nextTrack,
    play,
    pause,
  } = usePlayerStore();

  // Initialize audio element and analyser
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'auto';
      audioRef.current.crossOrigin = 'anonymous';
    }

    const analyser = new AudioAnalyser(0.6);
    analyserRef.current = analyser;

    // Set up frequency data callback
    analyser.onFrequencyData((data) => {
      onFrequencyData?.(data);
    });

    return () => {
      analyser.destroy();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [onFrequencyData]);

  // Handle track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (currentTrack.source === 'youtube' && currentTrack.youtubeId) {
      // Use YouTube stream URL
      audio.src = `https://www.youtube.com/watch?v=${currentTrack.youtubeId}`;
    } else {
      // Use direct audio URL or placeholder
      audio.src = currentTrack.sourceId || '';
    }

    sourceConnectedRef.current = false;

    if (isPlaying) {
      audio.play().catch(console.warn);
    }
  }, [currentTrack]);

  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      audio.play().catch(() => {
        pause();
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack, pause]);

  // Handle volume
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume / 100;
  }, [volume, isMuted]);

  // Connect analyser on first play
  useEffect(() => {
    const audio = audioRef.current;
    const analyser = analyserRef.current;
    if (!audio || !analyser || sourceConnectedRef.current) return;

    const handleCanPlay = () => {
      if (!sourceConnectedRef.current) {
        try {
          analyser.connectToMediaElement(audio);
          sourceConnectedRef.current = true;
        } catch (error) {
          console.warn('Failed to connect audio analyser:', error);
        }
      }
    };

    audio.addEventListener('canplay', handleCanPlay);
    return () => audio.removeEventListener('canplay', handleCanPlay);
  }, [currentTrack]);

  // Guard ref to prevent feedback loop when seeking programmatically
  const isSeekingRef = useRef(false);

  // Throttled time update for performance (stable ref to prevent listener re-attachment)
  const handleTimeUpdateRef = useRef(useThrottle(() => {
    if (isSeekingRef.current) return; // Skip during programmatic seek
    const audio = audioRef.current;
    if (audio) {
      setCurrentTime(audio.currentTime);
    }
  }, 250));
  const handleTimeUpdate = handleTimeUpdateRef.current;

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => handleTimeUpdate();
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      const { repeat, shuffle } = usePlayerStore.getState();
      if (repeat === 'one') {
        audio.currentTime = 0;
        audio.play().catch(console.warn);
      } else {
        nextTrack();
      }
    };
    const onError = () => console.warn('Audio playback error');

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [handleTimeUpdate, setDuration, nextTrack]);

  // Handle external seek with feedback loop protection
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (Math.abs(audio.currentTime - currentTime) > 0.5) {
      isSeekingRef.current = true;
      audio.currentTime = currentTime;
      // Reset guard after a short delay to allow timeupdate to fire
      setTimeout(() => { isSeekingRef.current = false; }, 100);
    }
  }, [currentTime, currentTrack]);

  // Resume AudioContext on user interaction
  const handleUserInteraction = useCallback(() => {
    analyserRef.current?.resume();
  }, []);

  useEffect(() => {
    document.addEventListener('click', handleUserInteraction, { once: true });
    return () => document.removeEventListener('click', handleUserInteraction);
  }, [handleUserInteraction]);

  return (
    <>
      {children}
      {/* Hidden audio element for fallback */}
      <audio ref={audioRef} style={{ display: 'none' }} />
    </>
  );
}
