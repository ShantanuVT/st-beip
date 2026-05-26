'use client';

import type { Track, SpotifyPlaylist, SpotifyAuthState, SearchResult } from '@/types';

/**
 * SpotifyService handles authentication and data fetching
 * from the Spotify Web API.
 *
 * Architecture (inspired by Meld):
 * - GraphQL endpoints preferred over REST for rate-limit management
 * - 3-tier data strategy: GraphQL → REST API → local cache
 * - PKCE OAuth flow for secure authentication
 * - Parallel data fetching for optimal loading performance
 */

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const SPOTIFY_GRAPHQL_URL = 'https://api.spotify.com/v1/graphql';
const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || '';
// Must be a function so it works on any domain (both localhost and production)
// Falls back to the current origin for seamless local + production use
function getRedirectUri(): string {
  return (
    process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/api/spotify/callback`
      : 'http://localhost:3000/api/spotify/callback')
  );
}
const SCOPES = [
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-library-read',
  'user-top-read',
  'user-read-recently-played',
  'user-follow-read',
].join(' ');

const CACHE_PREFIX = 'spotify_service_';
const CACHE_TTL = {
  PLAYLISTS: 10 * 60 * 1000,
  TOP_TRACKS: 30 * 60 * 1000,
  RECENTLY_PLAYED: 5 * 60 * 1000,
  ARTIST: 60 * 60 * 1000,
};

interface SpotifyCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

// ──────────────────────────────────────────────
// GraphQL Queries
// ──────────────────────────────────────────────
//
// Using GraphQL endpoints (like Meld) to avoid
// aggressive REST API rate limits.

const GRAPHQL_GET_PLAYLISTS = `
  query($limit: Int!) {
    me {
      playlists(limit: $limit) {
        items {
          ...PlaylistFragment
        }
        total
      }
    }
  }
  fragment PlaylistFragment on Playlist {
    id
    name
    description
    owner { displayName }
    images { url }
    tracks { total }
  }
`;

const GRAPHQL_SEARCH = `
  query($query: String!, $limit: Int!) {
    search(query: $query, types: [TRACK], limit: $limit) {
      tracks {
        items {
          ...TrackFragment
        }
      }
    }
  }
  fragment TrackFragment on Track {
    id
    name
    artists { name }
    album {
      name
      images { url }
    }
    durationMs
    popularity
  }
`;

// ──────────────────────────────────────────────
// Service Class
// ──────────────────────────────────────────────

export class SpotifyService {
  private credentials: SpotifyCredentials | null = null;
  private tokenRefreshTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.loadCredentials();
  }

  // ────────────────────────────────────────
  // Auth
  // ────────────────────────────────────────

  getAuthState(): SpotifyAuthState {
    if (!this.credentials) {
      return { isAuthenticated: false, accessToken: null, expiresAt: null };
    }
    return {
      isAuthenticated: Date.now() < this.credentials.expiresAt,
      accessToken: this.credentials.accessToken,
      expiresAt: this.credentials.expiresAt,
    };
  }

  async login(): Promise<void> {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);

    // Store verifier in both sessionStorage AND cookie for the callback route
    sessionStorage.setItem('spotify_code_verifier', codeVerifier);
    document.cookie = `spotify_code_verifier=${codeVerifier}; Path=/; Max-Age=300; SameSite=Lax`;

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: 'code',
      redirect_uri: getRedirectUri(),
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      scope: SCOPES,
      show_dialog: 'true',
    });

    window.location.href = `${SPOTIFY_AUTH_URL}?${params.toString()}`;
  }

  async handleCallback(code: string): Promise<void> {
    const codeVerifier = sessionStorage.getItem('spotify_code_verifier');
    if (!codeVerifier) throw new Error('No code verifier found');

    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: 'authorization_code',
        code,
        redirect_uri: getRedirectUri(),
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) throw new Error('Token exchange failed');

    const tokenData: any = await tokenResponse.json();
    this.setCredentials({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + tokenData.expires_in * 1000,
    });

    sessionStorage.removeItem('spotify_code_verifier');
  }

  /**
   * Manually set credentials (used by cookie-based auth flow).
   */
  setCredentials(creds: SpotifyCredentials): void {
    this.credentials = creds;
    localStorage.setItem('spotify_credentials', JSON.stringify(creds));
    this.scheduleTokenRefresh(creds);
  }

  logout(): void {
    this.credentials = null;
    localStorage.removeItem('spotify_credentials');
    if (this.tokenRefreshTimer) clearTimeout(this.tokenRefreshTimer);
  }

  // ────────────────────────────────────────
  // Data Fetching — Playlists
  // ────────────────────────────────────────

  async getPlaylists(): Promise<SpotifyPlaylist[]> {
    const token = await this.getValidToken();
    if (!token) throw new Error('Not authenticated');

    // Try GraphQL first (like Meld does)
    try {
      const gqlResult = await this.graphQLQuery(GRAPHQL_GET_PLAYLISTS, { limit: 50 });
      if (gqlResult?.data?.me?.playlists?.items) {
        return gqlResult.data.me.playlists.items.map(this.mapGraphQLPlaylist.bind(this));
      }
    } catch {
      // Fall through to REST
    }

    // REST fallback
    const response = await fetch(`${SPOTIFY_API_BASE}/me/playlists?limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Failed to fetch playlists');
    const data = await response.json();
    return data.items.map(this.mapSpotifyPlaylist.bind(this));
  }

  async getPlaylistTracks(playlistId: string): Promise<Track[]> {
    const token = await this.getValidToken();
    if (!token) throw new Error('Not authenticated');

    const allTracks: Track[] = [];
    let url: string | null = `${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks?limit=50`;

    while (url) {
      const response: Response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch playlist tracks');
      const data: any = await response.json();
      allTracks.push(
        ...data.items
          .filter((item: any) => item.track)
          .map((item: any) => this.mapSpotifyTrack(item.track))
      );
      url = data.next;
    }

    return allTracks;
  }

  // ────────────────────────────────────────
  // Data Fetching — Search & Discovery
  // ────────────────────────────────────────

  async search(query: string): Promise<SearchResult> {
    const token = await this.getValidToken();
    if (!token)    return { tracks: [], query, source: 'spotify' };

    // Try GraphQL first
    try {
      const gqlResult = await this.graphQLQuery(GRAPHQL_SEARCH, { query, limit: 20 });
      if (gqlResult?.data?.search?.tracks?.items) {
        return {
          tracks: gqlResult.data.search.tracks.items.map(this.mapGraphQLTrack.bind(this)),
          query,
          source: 'spotify',
        };
      }
    } catch {
      // Fall through
    }

    // REST fallback
    try {
      const response = await fetch(
        `${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(query)}&type=track&limit=20`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      return {
        tracks: data.tracks.items.map(this.mapSpotifyTrack.bind(this)),
        query,
        source: 'spotify',
      };
    } catch {
      return { tracks: [], query, source: 'spotify' };
    }
  }

  async getTopTracks(limit: number = 20): Promise<Track[]> {
    const token = await this.getValidToken();
    if (!token) return [];

    // Check cache
    const cacheKey = `top_tracks_${limit}`;
    const cached = this.readCache<Track[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `${SPOTIFY_API_BASE}/me/top/tracks?limit=${limit}&time_range=medium_term`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error('Failed to fetch top tracks');
      const data = await response.json();
      const tracks = data.items.map(this.mapSpotifyTrack.bind(this));
      this.writeCache(cacheKey, tracks, CACHE_TTL.TOP_TRACKS);
      return tracks;
    } catch {
      return [];
    }
  }

  async getRecentlyPlayed(limit: number = 20): Promise<Track[]> {
    const token = await this.getValidToken();
    if (!token) return [];

    const cacheKey = 'recently_played';
    const cached = this.readCache<Track[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `${SPOTIFY_API_BASE}/me/player/recently-played?limit=${limit}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error('Failed to fetch recently played');
      const data = await response.json();
      const tracks = data.items.map((item: any) => this.mapSpotifyTrack(item.track));
      this.writeCache(cacheKey, tracks, CACHE_TTL.RECENTLY_PLAYED);
      return tracks;
    } catch {
      return [];
    }
  }

  async getNewReleases(limit: number = 20): Promise<Track[]> {
    const token = await this.getValidToken();
    if (!token) return [];

    try {
      const newReleasesResponse = await fetch(
        `${SPOTIFY_API_BASE}/browse/new-releases?limit=${limit}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!newReleasesResponse.ok) throw new Error('Failed to fetch new releases');
      const newReleasesData: any = await newReleasesResponse.json();
      // New releases return albums, so we map them as album-type entries
      return newReleasesData.albums.items.map((item: any) => ({
        id: `spotify:album:${item.id}`,
        title: item.name,
        artist: item.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
        album: item.name,
        albumArt: item.images?.[0]?.url || '/placeholder-album.svg',
        duration: 0,
        source: 'spotify' as const,
        sourceId: item.id,
      }));
    } catch {
      return [];
    }
  }

  async getSavedTracks(limit: number = 50): Promise<Track[]> {
    const token = await this.getValidToken();
    if (!token) return [];

    try {
      const allTracks: Track[] = [];
      let url: string | null = `${SPOTIFY_API_BASE}/me/tracks?limit=${limit}`;

      while (url) {
        const fetchResponse: Response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!fetchResponse.ok) throw new Error('Failed to fetch saved tracks');
        const data: any = await fetchResponse.json();
        allTracks.push(
          ...data.items
            .filter((item: any) => item.track)
            .map((item: any) => this.mapSpotifyTrack(item.track))
        );
        url = data.next;
      }

      return allTracks;
    } catch {
      return [];
    }
  }

  async getArtistTopTracks(artistId: string): Promise<Track[]> {
    const token = await this.getValidToken();
    if (!token) return [];

    try {
      const response = await fetch(
        `${SPOTIFY_API_BASE}/artists/${artistId}/top-tracks?market=from_token`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error('Failed to fetch artist top tracks');
      const data = await response.json();
      return data.tracks.map(this.mapSpotifyTrack.bind(this));
    } catch {
      return [];
    }
  }

  // ────────────────────────────────────────
  // Private Helpers
  // ────────────────────────────────────────

  private loadCredentials(): void {
    try {
      const stored = localStorage.getItem('spotify_credentials');
      if (stored) {
        this.credentials = JSON.parse(stored);
        if (this.credentials && Date.now() < this.credentials.expiresAt) {
          this.scheduleTokenRefresh(this.credentials);
        }
      }
    } catch {}
  }

  private async getValidToken(): Promise<string | null> {
    this.loadCredentials();
    if (!this.credentials) return null;

    if (Date.now() >= this.credentials.expiresAt && this.credentials.refreshToken) {
      await this.refreshToken();
    }

    return this.credentials?.accessToken ?? null;
  }

  private async refreshToken(): Promise<void> {
    if (!this.credentials?.refreshToken) return;

    try {
      const refreshResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          grant_type: 'refresh_token',
          refresh_token: this.credentials.refreshToken,
        }),
      });

      if (!refreshResponse.ok) throw new Error('Token refresh failed');

      const refreshData: any = await refreshResponse.json();
      this.credentials.accessToken = refreshData.access_token;
      if (refreshData.refresh_token) {
        this.credentials.refreshToken = refreshData.refresh_token;
      }
      this.credentials.expiresAt = Date.now() + refreshData.expires_in * 1000;
      localStorage.setItem('spotify_credentials', JSON.stringify(this.credentials));
    } catch (error) {
      console.error('Failed to refresh Spotify token:', error);
      this.logout();
    }
  }

  private scheduleTokenRefresh(creds: SpotifyCredentials): void {
    if (this.tokenRefreshTimer) clearTimeout(this.tokenRefreshTimer);
    const refreshIn = Math.max(0, creds.expiresAt - Date.now() - 60000);
    this.tokenRefreshTimer = setTimeout(() => this.refreshToken(), refreshIn);
  }

  // ────────────────────────────────────────
  // GraphQL
  // ────────────────────────────────────────

  private async graphQLQuery(query: string, variables: Record<string, any>): Promise<any> {
    const token = await this.getValidToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(SPOTIFY_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) throw new Error(`GraphQL query failed: ${response.status}`);
    return response.json();
  }

  // ────────────────────────────────────────
  // Caching
  // ────────────────────────────────────────

  private readCache<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      if (Date.now() - entry.ts > entry.ttl) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }
      return entry.data;
    } catch {
      return null;
    }
  }

  private writeCache<T>(key: string, data: T, ttl: number): void {
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, ts: Date.now(), ttl }));
    } catch {}
  }

  // ────────────────────────────────────────
  // Mapping
  // ────────────────────────────────────────

  private mapSpotifyTrack(item: any): Track {
    return {
      id: `spotify:${item.id}`,
      title: item.name,
      artist: item.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
      album: item.album?.name || 'Unknown Album',
      albumArt: item.album?.images?.[0]?.url || '/placeholder-album.svg',
      duration: Math.floor((item.duration_ms || 0) / 1000),
      source: 'spotify',
      sourceId: item.id,
    };
  }

  private mapGraphQLTrack(item: any): Track {
    return {
      id: `spotify:${item.id}`,
      title: item.name,
      artist: item.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
      album: item.album?.name || 'Unknown Album',
      albumArt: item.album?.images?.[0]?.url || '/placeholder-album.svg',
      duration: Math.floor((item.durationMs || 0) / 1000),
      source: 'spotify',
      sourceId: item.id,
    };
  }

  private mapSpotifyPlaylist(item: any): SpotifyPlaylist {
    return {
      id: item.id,
      name: item.name,
      description: item.description || '',
      imageUrl: item.images?.[0]?.url || '/placeholder-album.svg',
      tracks: [],
      owner: item.owner?.display_name || 'Unknown',
    };
  }

  private mapGraphQLPlaylist(item: any): SpotifyPlaylist {
    return {
      id: item.id,
      name: item.name,
      description: item.description || '',
      imageUrl: item.images?.[0]?.url || '/placeholder-album.svg',
      tracks: [],
      owner: item.owner?.displayName || 'Unknown',
      trackCount: item.tracks?.total || 0,
    };
  }

  // ────────────────────────────────────────
  // PKCE Helpers
  // ────────────────────────────────────────

  private generateCodeVerifier(): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const array = new Uint8Array(64);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map((x) => possible[x % possible.length])
      .join('');
  }

  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }
}

// Singleton
let spotifyServiceInstance: SpotifyService | null = null;

export function getSpotifyService(): SpotifyService {
  if (!spotifyServiceInstance) {
    spotifyServiceInstance = new SpotifyService();
  }
  return spotifyServiceInstance;
}
