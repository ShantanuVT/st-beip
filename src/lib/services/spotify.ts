'use client';

import type { Track, SpotifyPlaylist, SpotifyAuthState, SearchResult } from '@/types';

/**
 * SpotifyService handles authentication and data fetching
 * from the Spotify Web API.
 * 
 * Architecture:
 * - Uses OAuth PKCE flow for authentication
 * - Fetches playlists, track metadata, and user library
 * - Results are structured for the unified media pipeline
 * - GraphQL endpoints preferred over REST for rate-limit management
 */

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const SPOTIFY_GRAPHQL_URL = 'https://api.spotify.com/v1/graphql';
const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || '';
const REDIRECT_URI = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || 'http://localhost:3000/api/spotify/callback';
const SCOPES = [
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-library-read',
  'user-top-read',
  'user-read-recently-played',
].join(' ');

interface SpotifyCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

export class SpotifyService {
  private credentials: SpotifyCredentials | null = null;
  private tokenRefreshTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Get the auth state.
   */
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

  /**
   * Initiate OAuth PKCE flow.
   * Opens Spotify login in a popup or redirects.
   */
  async login(): Promise<void> {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);

    // Store verifier for the callback
    sessionStorage.setItem('spotify_code_verifier', codeVerifier);

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      scope: SCOPES,
    });

    window.location.href = `${SPOTIFY_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Handle the OAuth callback and exchange code for tokens.
   */
  async handleCallback(code: string): Promise<void> {
    const codeVerifier = sessionStorage.getItem('spotify_code_verifier');
    if (!codeVerifier) throw new Error('No code verifier found');

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) throw new Error('Token exchange failed');

    const data = await response.json();
    this.setCredentials({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    });

    sessionStorage.removeItem('spotify_code_verifier');
  }

  /**
   * Fetch user's Spotify playlists.
   */
  async getPlaylists(): Promise<SpotifyPlaylist[]> {
    const token = await this.getValidToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${SPOTIFY_API_BASE}/me/playlists?limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Failed to fetch playlists');

    const data = await response.json();
    return data.items.map(this.mapSpotifyPlaylist.bind(this));
  }

  /**
   * Fetch tracks from a specific playlist.
   */
  async getPlaylistTracks(playlistId: string): Promise<Track[]> {
    const token = await this.getValidToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks?limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Failed to fetch playlist tracks');

    const data = await response.json();
    return data.items
      .filter((item: any) => item.track)
      .map((item: any) => this.mapSpotifyTrack(item.track));
  }

  /**
   * Search for tracks on Spotify.
   */
  async search(query: string): Promise<SearchResult> {
    const token = await this.getValidToken();
    if (!token) return { tracks: [], query, source: 'spotify' };

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
  }

  /**
   * Fetch user's top tracks for recommendation engine.
   */
  async getTopTracks(limit: number = 20): Promise<Track[]> {
    const token = await this.getValidToken();
    if (!token) return [];

    const response = await fetch(
      `${SPOTIFY_API_BASE}/me/top/tracks?limit=${limit}&time_range=medium_term`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) throw new Error('Failed to fetch top tracks');

    const data = await response.json();
    return data.items.map(this.mapSpotifyTrack.bind(this));
  }

  /**
   * Logout and clear credentials.
   */
  logout(): void {
    this.credentials = null;
    localStorage.removeItem('spotify_credentials');
    if (this.tokenRefreshTimer) clearTimeout(this.tokenRefreshTimer);
  }

  // ────────────────────────────────────────────
  // Private Helpers
  // ────────────────────────────────────────────

  private setCredentials(creds: SpotifyCredentials): void {
    this.credentials = creds;
    localStorage.setItem('spotify_credentials', JSON.stringify(creds));
    this.scheduleTokenRefresh(creds);
  }

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
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          grant_type: 'refresh_token',
          refresh_token: this.credentials.refreshToken,
        }),
      });

      if (!response.ok) throw new Error('Token refresh failed');

      const data = await response.json();
      this.credentials.accessToken = data.access_token;
      if (data.refresh_token) {
        this.credentials.refreshToken = data.refresh_token;
      }
      this.credentials.expiresAt = Date.now() + data.expires_in * 1000;
      localStorage.setItem('spotify_credentials', JSON.stringify(this.credentials));
    } catch (error) {
      console.error('Failed to refresh Spotify token:', error);
      this.logout();
    }
  }

  private scheduleTokenRefresh(creds: SpotifyCredentials): void {
    if (this.tokenRefreshTimer) clearTimeout(this.tokenRefreshTimer);
    const refreshIn = Math.max(0, creds.expiresAt - Date.now() - 60000); // 1 min before expiry
    this.tokenRefreshTimer = setTimeout(() => this.refreshToken(), refreshIn);
  }

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
