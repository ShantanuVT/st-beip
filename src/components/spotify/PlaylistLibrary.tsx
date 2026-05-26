'use client';

import { motion } from 'framer-motion';
import { useLibraryStore } from '@/lib/store/libraryStore';
import type { SpotifyPlaylist } from '@/types';

/**
 * PlaylistLibrary
 *
 * Displays the user's Spotify playlists in a responsive grid.
 * Shows playlist covers, names, and track counts.
 */
export function PlaylistLibrary() {
  const {
    userPlaylists,
    playlistsLoading,
    playlistsError,
    selectPlaylist,
    fetchPlaylists,
    logout,
    fetchSavedTracks,
    setView,
  } = useLibraryStore();

  if (playlistsLoading) {
    return (
      <div className="p-6 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
            <div className="w-12 h-12 rounded-xl bg-surface-alt" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-32 rounded bg-surface-alt" />
              <div className="h-2.5 w-20 rounded bg-surface-alt/60" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (playlistsError) {
    return (
      <div className="p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        <div>
          <p className="text-sm text-text-primary font-medium">Failed to load playlists</p>
          <p className="text-xs text-text-muted mt-1">{playlistsError}</p>
        </div>
        <div className="flex gap-2 justify-center">
          <button
            onClick={fetchPlaylists}
            className="px-4 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-all"
          >
            Retry
          </button>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg bg-surface-alt text-text-secondary text-xs hover:text-text-primary transition-all"
          >
            Log out
          </button>
        </div>
      </div>
    );
  }

  if (userPlaylists.length === 0) {
    return (
      <div className="p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-surface-alt flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
          </svg>
        </div>
        <p className="text-sm text-text-muted">No playlists found on your account</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with nav */}
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Your Library</h3>
        <button
          onClick={logout}
          className="px-2.5 py-1 text-[10px] font-medium rounded-lg text-text-muted hover:text-text-secondary hover:bg-surface-alt transition-all"
        >
          Disconnect
        </button>
      </div>

      {/* Playlist list */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* Quick links */}
        <div className="px-2 pb-2 border-b border-border/30 mb-2">
          <button
            onClick={() => {
              fetchSavedTracks();
              setView('liked');
            }}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-alt transition-all group"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">Liked Songs</p>
              <p className="text-xs text-text-muted">Your saved tracks</p>
            </div>
            <svg className="w-4 h-4 text-text-muted/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Playlists */}
        {userPlaylists.map((playlist: SpotifyPlaylist, index: number) => (
          <motion.button
            key={playlist.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
            onClick={() => selectPlaylist(playlist)}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-alt active:scale-[0.99] transition-all group"
          >
            {/* Playlist cover */}
            <div className="w-11 h-11 rounded-xl overflow-hidden bg-surface-alt flex-shrink-0 shadow-sm">
              {playlist.imageUrl && !playlist.imageUrl.includes('placeholder') ? (
                <img
                  src={playlist.imageUrl}
                  alt={playlist.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                  <svg className="w-5 h-5 text-text-muted/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                </div>
              )}
            </div>

            {/* Playlist info */}
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-text-primary truncate group-hover:text-primary transition-colors">
                {playlist.name}
              </p>
              <p className="text-xs text-text-muted truncate">
                {playlist.trackCount != null ? `${playlist.trackCount} tracks` : 'Playlist'}
              </p>
            </div>

            {/* Arrow */}
            <svg className="w-4 h-4 text-text-muted/30 group-hover:text-text-muted/60 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
