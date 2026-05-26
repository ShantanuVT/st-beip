'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLibraryStore } from '@/lib/store/libraryStore';
import { usePlayerStore } from '@/lib/store/playerStore';
import { SpotifyLoginButton } from './SpotifyLoginButton';
import { PlaylistLibrary } from './PlaylistLibrary';
import { PlaylistDetail } from './PlaylistDetail';

/**
 * SpotifyLibrary Panel
 *
 * Orchestrates the user flow:
 * 1. Login with Spotify (if not authenticated)
 * 2. Browse playlists and liked songs
 * 3. View playlist tracks
 * 4. Play tracks via YouTube (language preserved)
 *
 * Architecture (inspired by Meld):
 * - Spotify for playlist/library metadata only
 * - YouTube for audio playback
 * - Language preservation via exact track name matching
 */
export function SpotifyLibrary() {
  const {
    isLoggedIn,
    view,
    setView,
    checkAuthAndLoad,
    recentlyPlayed,
    recommendations,
    generateRecommendations,
  } = useLibraryStore();

  const resolveTrackToYouTube = useLibraryStore((s) => s.resolveTrackToYouTube);
  const playerPlayTrack = usePlayerStore((s) => s.playTrack);

  // Check auth on mount
  useEffect(() => {
    checkAuthAndLoad();
  }, [checkAuthAndLoad]);

  // Handler for playing a track from recently played / recommendations
  const handlePlayTrack = async (track: any) => {
    const resolved = await resolveTrackToYouTube(track);
    playerPlayTrack(resolved);
    useLibraryStore.getState().addToRecentlyPlayed(resolved);
    generateRecommendations(resolved);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          <span className="text-sm font-semibold text-text-primary">
            {view === 'playlists' || view === 'liked' ? 'Your Library' :
             view === 'playlist-detail' ? 'Playlist' :
             'Spotify'}
          </span>
        </div>
        {isLoggedIn && view !== 'playlists' && view !== 'liked' && (
          <button
            onClick={() => setView('playlists')}
            className="px-2.5 py-1 text-[10px] font-medium rounded-lg text-text-muted hover:text-text-secondary hover:bg-surface-alt transition-all"
          >
            Library
          </button>
        )}
        {isLoggedIn && view === 'playlists' && (
          <button
            onClick={() => useLibraryStore.getState().fetchPlaylists()}
            className="px-2.5 py-1 text-[10px] font-medium rounded-lg text-text-muted hover:text-text-secondary hover:bg-surface-alt transition-all flex items-center gap-1"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            Refresh
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!isLoggedIn ? (
          <SpotifyLoginButton />
        ) : view === 'playlists' ? (
          <PlaylistLibrary />
        ) : view === 'playlist-detail' ? (
          <PlaylistDetail />
        ) : view === 'liked' ? (
          <LikedSongsView />
        ) : null}

        {/* Recommendations */}
        {recommendations.length > 0 && isLoggedIn && view !== 'playlists' && (
          <div className="p-3 border-t border-border/50">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 px-1">
              Recommended
            </h3>
            <div className="space-y-1">
              {recommendations.slice(0, 5).map((rec: any, index: number) => (
                <motion.button
                  key={rec.track.id}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => handlePlayTrack(rec.track)}
                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-surface-alt transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-alt flex-shrink-0">
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
                    <p className="text-xs font-medium text-text-primary truncate group-hover:text-primary transition-colors">
                      {rec.track.title}
                    </p>
                    <p className="text-[11px] text-text-muted truncate">{rec.track.artist}</p>
                  </div>
                  <span className="text-[10px] text-text-muted/60 px-1.5 py-0.5 rounded-full bg-surface-alt">
                    {rec.score > 50 ? '★' : '○'}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Recently played */}
        {recentlyPlayed.length > 0 && isLoggedIn && view !== 'playlists' && (
          <div className="p-3 border-t border-border/50">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 px-1">
              Recently Played
            </h3>
            <div className="space-y-1">
              {recentlyPlayed.slice(0, 5).map((track: any) => (
                <motion.button
                  key={track.id}
                  onClick={() => handlePlayTrack(track)}
                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-surface-alt transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-alt flex-shrink-0">
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
                    <p className="text-xs font-medium text-text-primary truncate">{track.title}</p>
                    <p className="text-[11px] text-text-muted truncate">{track.artist}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * LikedSongsView
 *
 * Shows the user's saved/liked tracks from Spotify.
 */
function LikedSongsView() {
  const { savedTracks, savedTracksLoading, fetchSavedTracks } = useLibraryStore();
  const playerPlayTrack = usePlayerStore((s) => s.playTrack);
  const resolveTrackToYouTube = useLibraryStore((s) => s.resolveTrackToYouTube);
  const addToRecentlyPlayed = useLibraryStore((s) => s.addToRecentlyPlayed);
  const generateRecommendations = useLibraryStore((s) => s.generateRecommendations);

  // Fetch saved tracks on mount if empty
  if (savedTracks.length === 0 && !savedTracksLoading) {
    fetchSavedTracks();
  }

  const handlePlay = async (track: any) => {
    const resolved = await resolveTrackToYouTube(track);
    playerPlayTrack(resolved);
    addToRecentlyPlayed(resolved);
    generateRecommendations(resolved);
  };

  if (savedTracksLoading) {
    return (
      <div className="p-6 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
            <div className="w-10 h-10 rounded-lg bg-surface-alt" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-40 rounded bg-surface-alt" />
              <div className="h-2.5 w-24 rounded bg-surface-alt/60" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border/50 flex items-center gap-3">
        <button
          onClick={() => useLibraryStore.getState().setView('playlists')}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
          <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Liked Songs</h3>
          <p className="text-xs text-text-muted">{savedTracks.length} tracks</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {savedTracks.map((track: any, index: number) => (
          <motion.button
            key={track.id}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.015 }}
            onClick={() => handlePlay(track)}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-surface-alt transition-all group active:scale-[0.99]"
          >
            <span className="w-5 text-center text-xs text-text-muted tabular-nums">{index + 1}</span>
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
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-medium text-text-primary truncate group-hover:text-primary transition-colors">{track.title}</p>
              <p className="text-[11px] text-text-muted truncate">{track.artist}</p>
            </div>
          </motion.button>
        ))}

        {savedTracks.length === 0 && !savedTracksLoading && (
          <div className="p-8 text-center">
            <p className="text-sm text-text-muted">No liked songs yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
