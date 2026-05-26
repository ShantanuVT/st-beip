'use client';

import { create } from 'zustand';
import type { ThemePreset, ThemeColors, ThemeState } from '@/types';

// ──────────────────────────────────────────────
// Theme Presets
// ──────────────────────────────────────────────

export const THEME_PRESETS: Record<Exclude<ThemePreset, 'custom'>, ThemeColors> = {
  dark: {
    surface: '#0f0f11',
    surfaceAlt: '#1a1a1e',
    primary: '#6366f1',
    secondary: '#818cf8',
    accent: '#a855f7',
    accentGlow: 'rgba(168, 85, 247, 0.4)',
    textPrimary: '#f1f1f3',
    textSecondary: '#a1a1aa',
    textMuted: '#52525b',
    border: '#27272a',
  },
  light: {
    surface: '#fafafa',
    surfaceAlt: '#ffffff',
    primary: '#6366f1',
    secondary: '#4f46e5',
    accent: '#7c3aed',
    accentGlow: 'rgba(124, 58, 237, 0.2)',
    textPrimary: '#09090b',
    textSecondary: '#52525b',
    textMuted: '#a1a1aa',
    border: '#e4e4e7',
  },
  cyberpunk: {
    surface: '#0a0a1a',
    surfaceAlt: '#12122a',
    primary: '#ff00ff',
    secondary: '#00ffff',
    accent: '#ff0066',
    accentGlow: 'rgba(255, 0, 102, 0.5)',
    textPrimary: '#f0f0ff',
    textSecondary: '#a0a0ff',
    textMuted: '#5050aa',
    border: '#2a2a5a',
  },
  'amoled-black': {
    surface: '#000000',
    surfaceAlt: '#050505',
    primary: '#6366f1',
    secondary: '#818cf8',
    accent: '#a855f7',
    accentGlow: 'rgba(168, 85, 247, 0.3)',
    textPrimary: '#ffffff',
    textSecondary: '#a1a1aa',
    textMuted: '#3f3f46',
    border: '#18181b',
  },
  'minimalist-pastel': {
    surface: '#fce7f3',
    surfaceAlt: '#fff1f2',
    primary: '#ec4899',
    secondary: '#f472b6',
    accent: '#a78bfa',
    accentGlow: 'rgba(167, 139, 250, 0.3)',
    textPrimary: '#1f1f2e',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    border: '#fbcfe8',
  },
};

export const DEFAULT_THEME_COLORS: ThemeColors = THEME_PRESETS.dark;

// ──────────────────────────────────────────────
// Theme Store
// ──────────────────────────────────────────────

interface ThemeStore extends ThemeState {
  setPreset: (preset: ThemePreset) => void;
  setColors: (colors: ThemeColors) => void;
  resetToPreset: (preset: ThemePreset) => void;
  applyTheme: () => void;
  persist: () => void;
}

const STORAGE_KEY = 'stbeip-theme';

const loadTheme = (): ThemeState => {
  if (typeof window === 'undefined') {
    return { preset: 'dark', colors: DEFAULT_THEME_COLORS, isCustom: false };
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { preset: 'dark', colors: DEFAULT_THEME_COLORS, isCustom: false };
};

export const useThemeStore = create<ThemeStore>((set, get) => ({
  ...loadTheme(),

  setPreset: (preset: ThemePreset) => {
    if (preset === 'custom') {
      set({ preset, isCustom: true });
      return;
    }
    const colors = THEME_PRESETS[preset];
    if (colors) {
      set({ preset, colors, isCustom: false });
      get().applyTheme();
      get().persist();
    }
  },

  setColors: (colors: ThemeColors) => {
    set({ colors, isCustom: true, preset: 'custom' });
    get().applyTheme();
    get().persist();
  },

  resetToPreset: (preset: ThemePreset) => {
    get().setPreset(preset);
  },

  applyTheme: () => {
    const { colors } = get();
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.style.setProperty('--color-surface', colors.surface);
    root.style.setProperty('--color-surface-alt', colors.surfaceAlt);
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-accent-glow', colors.accentGlow);
    root.style.setProperty('--color-text-primary', colors.textPrimary);
    root.style.setProperty('--color-text-secondary', colors.textSecondary);
    root.style.setProperty('--color-text-muted', colors.textMuted);
    root.style.setProperty('--color-border', colors.border);
  },

  persist: () => {
    const { preset, colors, isCustom } = get();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ preset, colors, isCustom }));
  },
}));
