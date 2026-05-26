'use client';

import { create } from 'zustand';
import type { Track, SpotifyPlaylist } from '@/types';
import { getSpotifyService } from '@/lib/services/spotify';
import { getYouTubeResolver } from '@/lib/services/youtube';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface Recommendation {
  track: Track;
  score: number;
  reason: string;
}

interface LibraryState {
  // Auth
  isLoggedIn: boolean;
  isAuthenticating: boolean;
  authError: string | null;
  userDisplayName: string | null;

  // Playlists
  userPlaylists: SpotifyPlaylist[];
  playlistsLoading: boolean;
  playlistsError: string | null;

  // Selected playlist detail
  selectedPlaylist: SpotifyPlaylist | null;
  playlistTracks: Track[];
  playlistTracksLoading: boolean;

  // Liked / saved tracks
  savedTracks: Track[];
  savedTracksLoading: boolean;

  // YouTube-resolved tracks (tracks that have been matched to YouTube)
  resolvedTracks: Map<string, Track>;

  // Recommendations
  recommendations: Recommendation[];
  recommendationsLoading: boolean;

  // Recently played
  recentlyPlayed: Track[];

  // View state
  view: 'login' | 'playlists' | 'playlist-detail' | 'liked';
}

interface LibraryActions {
  // Auth
  login: () => void;
  logout: () => void;
  checkAuthAndLoad: () => Promise<void>;

  // Playlists
  fetchPlaylists: () => Promise<void>;
  selectPlaylist: (playlist: SpotifyPlaylist) => Promise<void>;
  clearSelectedPlaylist: () => void;

  // Saved tracks
  fetchSavedTracks: () => Promise<void>;

  // Playback (resolve to YouTube + play + recs)
  resolveTrackToYouTube: (track: Track) => Promise<Track>;
  handlePlayTrack: (track: Track) => Promise<void>;

  // Recommendations
  generateRecommendations: (fromTrack: Track) => Promise<void>;
  addToRecentlyPlayed: (track: Track) => void;

  // View
  setView: (view: LibraryState['view']) => void;
}

type LibraryStore = LibraryState & LibraryActions;

// ──────────────────────────────────────────────
// Store
// ──────────────────────────────────────────────

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  // Auth initial
  isLoggedIn: false,
  isAuthenticating: false,
  authError: null,
  userDisplayName: null,

  // Playlists initial
  userPlaylists: [],
  playlistsLoading: false,
  playlistsError: null,

  // Selected playlist
  selectedPlaylist: null,
  playlistTracks: [],
  playlistTracksLoading: false,

  // Saved tracks
  savedTracks: [],
  savedTracksLoading: false,

  // Resolved tracks
  resolvedTracks: new Map(),

  // Recommendations
  recommendations: [],
  recommendationsLoading: false,

  // Recently played
  recentlyPlayed: [],

  // View: start at 'login' — if already authenticated, switches to 'playlists'
  view: 'login',

  // ────────────────────────────────────────
  // Auth Actions
  // ────────────────────────────────────────

  login: () => {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    if (!clientId) {
      set({ authError: 'Spotify Client ID is not configured. Add NEXT_PUBLIC_SPOTIFY_CLIENT_ID to your .env.local' });
      return;
    }
    set({ isAuthenticating: true, authError: null });
    const service = getSpotifyService();
    service.login();
    // Note: login() redirects the browser, so execution stops here.
    // The user will return via the callback route which stores tokens in localStorage.
  },

  logout: () => {
    const service = getSpotifyService();
    service.logout();
    set({
      isLoggedIn: false,
      userPlaylists: [],
      selectedPlaylist: null,
      playlistTracks: [],
      savedTracks: [],
      resolvedTracks: new Map(),
      view: 'login',
      userDisplayName: null,
    });
  },

  /**
   * Called on app mount. Checks if we have stored credentials.
   * If auth just completed (via callback), fetches user data + playlists.
   */
  checkAuthAndLoad: async () => {
    const service = getSpotifyService();
    const authState = service.getAuthState();

    if (authState.isAuthenticated) {
      set({ isLoggedIn: true });

      // Check if auth just completed (user was redirected from callback)
      const justCompleted = localStorage.getItem('spotify_auth_just_completed') === 'true';
      if (justCompleted) {
        localStorage.removeItem('spotify_auth_just_completed');
      }

      // Fetch playlists automatically on auth
      get().fetchPlaylists();
      set({ view: 'playlists' });
    } else {
      // Check if there's an auth error in URL params
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const authError = params.get('spotify-auth-error');
        if (authError) {
          const messages: Record<string, string> = {
            'access_denied': 'You denied the Spotify connection request.',
            'no_code': 'No authorization code received from Spotify.',
            'no_verifier': 'Session expired. Please try logging in again.',
            'no_client_id': 'Spotify Client ID is not configured on the server.',
            'token_exchange': 'Failed to exchange authorization code. Please try again.',
            'exception': 'An unexpected error occurred during Spotify login.',
          };
          set({ authError: messages[authError] || `Spotify auth error: ${authError}` });
          // Clean the URL
          window.history.replaceState({}, '', '/');
        }
      }
    }
  },

  // ────────────────────────────────────────
  // Playlist Actions
  // ────────────────────────────────────────

  fetchPlaylists: async () => {
    set({ playlistsLoading: true, playlistsError: null });
    try {
      const service = getSpotifyService();
      const playlists = await service.getPlaylists();
      set({ userPlaylists: playlists, playlistsLoading: false });

      // Try to get user display name from the first playlist's owner
      if (playlists.length > 0 && playlists[0].owner) {
        set({ userDisplayName: playlists[0].owner });
      }
    } catch (err) {
      set({
        playlistsLoading: false,
        playlistsError: err instanceof Error ? err.message : 'Failed to load playlists',
      });
    }
  },

  selectPlaylist: async (playlist: SpotifyPlaylist) => {
    set({ selectedPlaylist: playlist, playlistTracks: [], playlistTracksLoading: true });

    try {
      const service = getSpotifyService();
      const tracks = await service.getPlaylistTracks(playlist.id);
      set({ playlistTracks: tracks, playlistTracksLoading: false, view: 'playlist-detail' });
    } catch (err) {
      set({
        playlistTracksLoading: false,
        playlistTracks: [],
      });
    }
  },

  clearSelectedPlaylist: () => {
    set({ selectedPlaylist: null, playlistTracks: [], view: 'playlists' });
  },

  // ────────────────────────────────────────
  // Saved Tracks
  // ────────────────────────────────────────

  fetchSavedTracks: async () => {
    set({ savedTracksLoading: true });
    try {
      const service = getSpotifyService();
      const tracks = await service.getSavedTracks(50);
      set({ savedTracks: tracks, savedTracksLoading: false });
    } catch {
      set({ savedTracksLoading: false });
    }
  },

  // ────────────────────────────────────────
  // Playback (YouTube Resolution)
  // ────────────────────────────────────────

  resolveTrackToYouTube: async (track: Track): Promise<Track> => {
    // Check if already resolved
    const existing = get().resolvedTracks.get(track.id);
    if (existing?.youtubeId) return existing;

    try {
      const resolver = getYouTubeResolver();
      // Use exact track name + artist for language preservation
      const result = await resolver.searchTrack(`${track.artist} - ${track.title}`);

      if (result) {
        const resolvedTrack: Track = {
          ...track,
          youtubeId: result.videoId,
          albumArt: result.thumbnail || track.albumArt,
          duration: result.duration || track.duration,
          sourceId: result.videoId,
          source: 'youtube',
        };

        const updated = new Map(get().resolvedTracks);
        updated.set(track.id, resolvedTrack);
        set({ resolvedTracks: updated });

        return resolvedTrack;
      }
    } catch {}

    return track;
  },

  /**
   * Complete play handler: resolve to YouTube → play → add to recently played → generate recs.
   */
  handlePlayTrack: async (track: Track) => {
    const { usePlayerStore } = await import('@/lib/store/playerStore');
    const { playTrack } = usePlayerStore.getState();
    const resolved = await get().resolveTrackToYouTube(track);
    playTrack(resolved);
    get().addToRecentlyPlayed(resolved);
    get().generateRecommendations(resolved);
  },

  // ────────────────────────────────────────
  // Recommendations
  // ────────────────────────────────────────

  generateRecommendations: async (fromTrack: Track) => {
    set({ recommendationsLoading: true });
    try {
      const resolver = getYouTubeResolver();
      const result = await resolver.searchTrack(`${fromTrack.artist} - best songs`);
      if (result) {
        const rec: Recommendation = {
          track: {
            id: `recommended:${Date.now()}`,
            title: result.title,
            artist: fromTrack.artist,
            album: '',
            albumArt: result.thumbnail || '',
            duration: result.duration || 0,
            source: 'youtube',
            sourceId: result.videoId,
            youtubeId: result.videoId,
          },
          score: 85,
          reason: 'Similar artist',
        };
        set({ recommendations: [rec], recommendationsLoading: false });
        return;
      }
      set({ recommendations: [], recommendationsLoading: false });
    } catch {
      set({ recommendations: [], recommendationsLoading: false });
    }
  },

  addToRecentlyPlayed: (track: Track) => {
    set((s) => {
      const filtered = s.recentlyPlayed.filter((t) => t.id !== track.id);
      return { recentlyPlayed: [track, ...filtered].slice(0, 20) };
    });
  },

  setView: (view) => set({ view }),
}));
