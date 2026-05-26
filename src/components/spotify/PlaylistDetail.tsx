'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { usePlayerStore } from '@/lib/store/playerStore';
import { useLibraryStore } from '@/lib/store/libraryStore';

/**
 * PlaylistDetail
 *
 * Shows tracks from a user's Spotify playlist.
 * Tracks are resolved to YouTube on-demand when played,
 * preserving the original language of each track title.
 */
export function PlaylistDetail() {
  const {
    selectedPlaylist,
    playlistTracks,
    playlistTracksLoading,
    clearSelectedPlaylist,
    resolveTrackToYouTube,
    resolvedTracks,
  } = useLibraryStore();
  const { playTrack, currentTrack, isPlaying } = usePlayerStore();
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!selectedPlaylist) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-text-muted">No playlist selected</p>
      </div>
    );
  }

  const handlePlayTrack = async (track: any) => {
    setResolvingId(track.id);
    try {
      const resolved = await resolveTrackToYouTube(track);
      playTrack(resolved);
      useLibraryStore.getState().addToRecentlyPlayed(resolved);
      useLibraryStore.getState().generateRecommendations(resolved);
    } catch {}
    setResolvingId(null);
  };

  const handlePlayAll = async () => {
    if (playlistTracks.length > 0) {
      await handlePlayTrack(playlistTracks[0]);
    }
  };

  const isTrackResolved = (trackId: string) => {
    const resolved = resolvedTracks.get(trackId);
    return !!(resolved && resolved.youtubeId);
  };

  // Loading state
  if (playlistTracksLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 pb-3 border-b border-border/50">
          <div className="flex items-start gap-4 animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-surface-alt" />
            <div className="flex gap-3">
              <div className="w-16 h-16 rounded-xl bg-surface-alt" />
              <div className="space-y-2">
                <div className="h-4 w-40 rounded bg-surface-alt" />
                <div className="h-3 w-24 rounded bg-surface-alt/60" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-6 h-4 rounded bg-surface-alt" />
              <div className="w-10 h-10 rounded-lg bg-surface-alt" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-44 rounded bg-surface-alt" />
                <div className="h-2.5 w-28 rounded bg-surface-alt/60" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with playlist info */}
      <div className="p-4 pb-3 space-y-3 border-b border-border/50">
        <div className="flex items-start gap-4">
          {/* Back button */}
          <button
            onClick={clearSelectedPlaylist}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary
              hover:text-text-primary hover:bg-surface-alt transition-all flex-shrink-0 mt-0.5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* Playlist cover and info */}
          <div className="flex gap-3 min-w-0 flex-1">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-alt flex-shrink-0 shadow-md">
              {selectedPlaylist.imageUrl && !selectedPlaylist.imageUrl.includes('placeholder') ? (
                <img
                  src={selectedPlaylist.imageUrl}
                  alt={selectedPlaylist.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                  <svg className="w-6 h-6 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-text-primary truncate">
                {selectedPlaylist.name}
              </h3>
              <p className="text-xs text-text-muted truncate mt-0.5">
                {selectedPlaylist.owner} · {playlistTracks.length} tracks
              </p>
              {selectedPlaylist.description && (
                <p className="text-[11px] text-text-muted/70 mt-1 line-clamp-2">
                  {selectedPlaylist.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Play Playlist button */}
        {playlistTracks.length > 0 && (
          <button
            onClick={handlePlayAll}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-primary/10 text-primary
              text-xs font-medium hover:bg-primary/20 active:scale-[0.99] transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            Play Playlist
          </button>
        )}
      </div>

      {/* Track list */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {playlistTracks.map((track: any, index: number) => {
            const isCurrentTrack = currentTrack?.id === track.id;
            const isResolved = isTrackResolved(track.id);
            const isLoading = resolvingId === track.id;

            return (
              <motion.button
                key={track.id}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => handlePlayTrack(track)}
                disabled={isLoading}
                className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all group
                  hover:bg-surface-alt active:scale-[0.99] disabled:opacity-60 disabled:cursor-wait ${
                  isCurrentTrack ? 'bg-surface-alt border border-primary/20' : ''
                }`}
              >
                {/* Track number / play indicator */}
                <span className="w-6 text-center text-xs text-text-muted group-hover:hidden">
                  {isCurrentTrack && isPlaying ? '♫' : index + 1}
                </span>
                <span className="w-6 text-center text-xs text-primary hidden group-hover:inline">
                  ▶
                </span>

                {/* Album art */}
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-alt flex-shrink-0">
                  {track.albumArt && !track.albumArt.includes('placeholder') ? (
                    <img src={track.albumArt} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-text-muted" viewBox="0 0 24 24" fill="currentColor" opacity="0.4">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Track info */}
                <div className="flex-1 min-w-0 text-left">
                  <p className={`text-xs font-medium truncate ${
                    isCurrentTrack ? 'text-primary' : 'text-text-primary'
                  } group-hover:text-primary transition-colors`}>
                    {track.title}
                  </p>
                  <p className="text-[11px] text-text-muted truncate">{track.artist}</p>
                </div>

                {/* Status indicator */}
                <div className="flex items-center gap-1.5">
                  {isLoading ? (
                    <svg className="animate-spin w-3.5 h-3.5 text-primary" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : isResolved ? (
                    <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 text-text-muted/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  )}
                  {track.duration > 0 && (
                    <span className="text-[11px] text-text-muted tabular-nums ml-1">
                      {formatTime(track.duration)}
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Empty state */}
        {playlistTracks.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-sm text-text-muted">No tracks in this playlist</p>
          </div>
        )}
      </div>
    </div>
  );
}
