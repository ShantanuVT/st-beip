// ──────────────────────────────────────────────
// Track & Media Types
// ──────────────────────────────────────────────

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number; // seconds
  source: 'spotify' | 'youtube' | 'local';
  sourceId: string;
  youtubeId?: string;
}

export interface QueueItem {
  track: Track;
  addedBy?: string; // userId who added it (room feature)
}

// ──────────────────────────────────────────────
// Player Types
// ──────────────────────────────────────────────

export type RepeatMode = 'none' | 'one' | 'all';

export interface PlayerState {
  currentTrack: Track | null;
  queue: QueueItem[];
  queueIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
}

// ──────────────────────────────────────────────
// Edge Lighting Types
// ──────────────────────────────────────────────

export type EdgeLightingMode = 'none' | 'static-cycle' | 'beat-flicker';

export interface EdgeLightingState {
  mode: EdgeLightingMode;
  brightness: number; // 0-100
  sensitivity: number; // 0-100
  colorSpeed: number; // 1-10
}

// ──────────────────────────────────────────────
// Theme Types
// ──────────────────────────────────────────────

export type ThemePreset = 'dark' | 'light' | 'cyberpunk' | 'amoled-black' | 'minimalist-pastel' | 'custom';

export interface ThemeColors {
  surface: string;
  surfaceAlt: string;
  primary: string;
  secondary: string;
  accent: string;
  accentGlow: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
}

export interface ThemeState {
  preset: ThemePreset;
  colors: ThemeColors;
  isCustom: boolean;
}

// ──────────────────────────────────────────────
// Room / Sync Types
// ──────────────────────────────────────────────

export interface RoomMember {
  id: string;
  name: string;
  isHost: boolean;
  deviceId: string;
  deviceType: 'phone' | 'tablet' | 'desktop' | 'laptop';
  joinedAt: number;
}

export interface RoomState {
  code: string;
  hostId: string;
  members: RoomMember[];
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  lastUpdated: number;
}

export interface RoomAction {
  type: 'PLAY' | 'PAUSE' | 'SEEK' | 'TRACK_CHANGE' | 'VOLUME';
  payload: unknown;
  timestamp: number;
  userId: string;
}

// ──────────────────────────────────────────────
// Device Matrix Types
// ──────────────────────────────────────────────

export type AudioOutputRoute = 'device-1' | 'device-2' | 'both';

// ──────────────────────────────────────────────
// Frequency Analysis Types
// ──────────────────────────────────────────────

export interface FrequencyData {
  bass: number;      // 20-250 Hz (average 0-255)
  lowMid: number;    // 250-500 Hz
  mid: number;       // 500-2000 Hz
  highMid: number;   // 2000-4000 Hz
  treble: number;    // 4000-20000 Hz
  timestamp: number;
}

// ──────────────────────────────────────────────
// Spotify / YouTube Types
// ──────────────────────────────────────────────

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  tracks: Track[];
  owner: string;
}

export interface SpotifyAuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  expiresAt: number | null;
}

export interface SearchResult {
  tracks: Track[];
  query: string;
  source: 'spotify' | 'youtube';
}

// ──────────────────────────────────────────────
// UI Types
// ──────────────────────────────────────────────

export type ViewState = 'library' | 'search' | 'playlist' | 'settings' | 'room';
