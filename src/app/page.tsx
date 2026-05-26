'use client';

import { motion } from 'framer-motion';
import { Controls } from '@/components/player/Controls';
import { usePlayerStore } from '@/lib/store/playerStore';
import { useEdgeLightingStore } from '@/lib/store/playerStore';
import { useLibraryStore } from '@/lib/store/libraryStore';
import type { Track, EdgeLightingMode } from '@/types';

// Sample tracks for demonstration (fallback when Spotify not connected)
const SAMPLE_TRACKS: Track[] = [
  { id: '1', title: 'Midnight Dreams', artist: 'Lunar Echo', album: 'Dreamscape', albumArt: '', duration: 247, source: 'local', sourceId: '' },
  { id: '2', title: 'Electric Pulse', artist: 'Neon Wave', album: 'Digital Horizon', albumArt: '', duration: 203, source: 'local', sourceId: '' },
  { id: '3', title: 'Ocean Breeze', artist: 'Coral Reef', album: 'Deep Blue', albumArt: '', duration: 315, source: 'local', sourceId: '' },
  { id: '4', title: 'Stellar Drift', artist: 'Cosmos', album: 'Infinite Space', albumArt: '', duration: 278, source: 'local', sourceId: '' },
  { id: '5', title: 'Urban Flow', artist: 'City Lights', album: 'Metropolis', albumArt: '', duration: 192, source: 'local', sourceId: '' },
  { id: '6', title: 'Golden Hour', artist: 'Sunset Blvd', album: 'Twilight', albumArt: '', duration: 234, source: 'local', sourceId: '' },
];

export default function HomePage() {
  const { playTrack, currentTrack, isPlaying, currentTime, duration } = usePlayerStore();
  const { mode, setMode } = useEdgeLightingStore();
  const {
    recentlyPlayed,
    recommendations,
    resolveTrackToYouTube,
    generateRecommendations,
    addToRecentlyPlayed,
  } = useLibraryStore();

  const edgeModes: { value: EdgeLightingMode; label: string }[] = [
    { value: 'none', label: 'None' },
    { value: 'static-cycle', label: 'Static Cycle' },
    { value: 'beat-flicker', label: 'Beat Flicker' },
  ];

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center md:text-left"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-text-primary">
          Welcome to{' '}
          <span className="text-primary">ST BEIP</span>
        </h1>
        <p className="text-text-secondary mt-2 max-w-2xl">
          Premium ad-free music streaming with real-time room sync, audio-reactive visuals, and full cross-platform support.
        </p>
      </motion.div>

      {/* Controls Row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-surface-alt/50 border border-border"
      >
        {/* Edge Lighting Mode Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted uppercase tracking-wider">Edge Light</span>
          <div className="flex bg-surface rounded-lg p-0.5">
            {edgeModes.map((edgeMode) => (
              <button
                key={edgeMode.value}
                onClick={() => setMode(edgeMode.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  mode === edgeMode.value
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {edgeMode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px h-6 bg-border" />

        {/* Current Track Info */}
        <div className="flex-1 min-w-0">
          {currentTrack ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-alt flex items-center justify-center overflow-hidden flex-shrink-0">
                {currentTrack.albumArt ? (
                  <img src={currentTrack.albumArt} alt="" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-5 h-5 text-text-muted" viewBox="0 0 24 24" fill="currentColor" opacity="0.5">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{currentTrack.title}</p>
                <p className="text-xs text-text-secondary truncate">{currentTrack.artist}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-muted">No track playing — select a song below</p>
          )}
        </div>

        <Controls size="sm" />
      </motion.div>

      {/* ──────────────────────────────────────── */}
      {/* Recently Played Section               */}
      {/* Shows tracks you've played recently   */}
      {/* ──────────────────────────────────────── */}
      {recentlyPlayed.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <h2 className="text-lg font-semibold text-text-primary">Recently Played</h2>
          </div>
          <div className="grid gap-1">
            {recentlyPlayed.slice(0, 8).map((track: Track, index: number) => (
              <motion.button
                key={track.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={async () => {
                  const resolved = await resolveTrackToYouTube(track);
                  playTrack(resolved);
                  addToRecentlyPlayed(resolved);
                }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all hover:bg-surface-alt active:scale-[0.99] group ${
                  currentTrack?.id === track.id ? 'bg-surface-alt border border-primary/30' : 'border border-transparent'
                }`}
              >
                <span className="w-6 text-center text-xs text-text-muted tabular-nums">{index + 1}</span>
                <div className="w-11 h-11 rounded-xl overflow-hidden bg-surface-alt flex-shrink-0">
                  {track.albumArt ? (
                    <img src={track.albumArt} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-text-muted" viewBox="0 0 24 24" fill="currentColor" opacity="0.4">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-text-primary truncate group-hover:text-primary transition-colors">
                    {track.title}
                  </p>
                  <p className="text-xs text-text-secondary truncate">{track.artist}</p>
                </div>
                <span className="text-xs text-text-muted tabular-nums">{formatTime(track.duration)}</span>
                {currentTrack?.id === track.id && isPlaying && (
                  <div className="flex gap-0.5 items-end h-4">
                    <span className="w-0.5 h-3 bg-primary rounded-full animate-pulse" />
                    <span className="w-0.5 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <span className="w-0.5 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {/* ──────────────────────────────────────────── */}
      {/* Smart Recommendations Section               */}
      {/* Generated from your recently played tracks  */}
      {/* ──────────────────────────────────────────── */}
      {recommendations.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <h2 className="text-lg font-semibold text-text-primary">Recommended for You</h2>
          </div>
          <div className="grid gap-1">
            {recommendations.slice(0, 5).map((rec: { track: Track; score: number; reason: string }, index: number) => (
              <motion.button
                key={rec.track.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                onClick={async () => {
                  const resolved = await resolveTrackToYouTube(rec.track);
                  playTrack(resolved);
                  addToRecentlyPlayed(resolved);
                  useLibraryStore.getState().generateRecommendations(resolved);
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-alt transition-all group active:scale-[0.99]"
              >
                <div className="w-11 h-11 rounded-xl overflow-hidden bg-surface-alt flex-shrink-0">
                  {rec.track.albumArt ? (
                    <img src={rec.track.albumArt} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-text-muted" viewBox="0 0 24 24" fill="currentColor" opacity="0.4">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-text-primary truncate group-hover:text-accent transition-colors">
                    {rec.track.title}
                  </p>
                  <p className="text-xs text-text-secondary truncate">{rec.track.artist}</p>
                </div>
                <span className="text-[10px] text-text-muted/60 px-2 py-1 rounded-full bg-surface-alt/80 whitespace-nowrap">
                  {rec.reason}
                </span>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {/* Featured Tracks */}
      {recentlyPlayed.length === 0 && (
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Featured Tracks</h2>
          <div className="grid gap-2">
            {SAMPLE_TRACKS.map((track, index) => (
              <motion.button
                key={track.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                onClick={() => playTrack(track)}
                className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all hover:bg-surface-alt active:scale-[0.99] group ${
                  currentTrack?.id === track.id ? 'bg-surface-alt border border-primary/30' : 'border border-transparent'
                }`}
              >
                {/* Album Art Placeholder */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  index % 3 === 0 ? 'bg-gradient-to-br from-primary/30 to-accent/30' :
                  index % 3 === 1 ? 'bg-gradient-to-br from-blue-500/30 to-cyan-500/30' :
                  'bg-gradient-to-br from-emerald-500/30 to-teal-500/30'
                }`}>
                  <svg className="w-6 h-6 text-text-secondary" viewBox="0 0 24 24" fill="currentColor" opacity="0.6">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-text-primary truncate group-hover:text-primary transition-colors">
                    {track.title}
                  </p>
                  <p className="text-xs text-text-secondary truncate">{track.artist} · {track.album}</p>
                </div>

                {/* Duration */}
                <span className="text-xs text-text-muted">{formatTime(track.duration)}</span>

                {/* Play indicator */}
                {currentTrack?.id === track.id && isPlaying && (
                  <div className="flex gap-0.5 items-end h-4">
                    <span className="w-0.5 h-3 bg-primary rounded-full animate-pulse" />
                    <span className="w-0.5 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <span className="w-0.5 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {/* Feature Highlights */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4"
      >
        <div className="p-5 rounded-2xl bg-surface-alt/50 border border-border">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-text-primary mb-1">Audio-Reactive Visuals</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Real-time RGB edge lighting that pulses and flickers to the beat of your music using Web Audio API analysis.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-surface-alt/50 border border-border">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-text-primary mb-1">Real-Time Room Sync</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Create synchronized listening rooms with friends. Playback stays perfectly in sync across all devices.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-surface-alt/50 border border-border">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-text-primary mb-1">Custom Theme Engine</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Five premium themes plus a custom theme creator. Pick every color and save your perfect look.
          </p>
        </div>
      </motion.section>
    </div>
  );
}
