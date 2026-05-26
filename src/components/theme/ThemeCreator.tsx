'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore, THEME_PRESETS } from '@/lib/store/themeStore';
import type { ThemePreset, ThemeColors } from '@/types';

const PRESET_NAMES: Record<ThemePreset, string> = {
  dark: 'Dark',
  light: 'Light',
  cyberpunk: 'Cyberpunk',
  'amoled-black': 'AMOLED Black',
  'minimalist-pastel': 'Minimalist Pastel',
  custom: 'Custom',
};

const COLOR_LABELS: { key: keyof ThemeColors; label: string }[] = [
  { key: 'surface', label: 'Background' },
  { key: 'surfaceAlt', label: 'Surface Alt' },
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'accent', label: 'Accent' },
  { key: 'accentGlow', label: 'Accent Glow' },
  { key: 'textPrimary', label: 'Text Primary' },
  { key: 'textSecondary', label: 'Text Secondary' },
  { key: 'textMuted', label: 'Text Muted' },
  { key: 'border', label: 'Border' },
];

interface ThemeCreatorProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * ThemeCreator panel for browsing presets and creating custom themes.
 * Features:
 * - Preset theme selection (Dark, Light, Cyberpunk, AMOLED Black, Pastel)
 * - Custom hex color pickers for each CSS variable
 * - Live preview through CSS custom properties
 * - Persists to localStorage
 */
export function ThemeCreator({ isOpen, onClose }: ThemeCreatorProps) {
  const { preset, colors, setPreset, setColors } = useThemeStore();
  const [customColors, setCustomColors] = useState<ThemeColors>(colors);
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');

  const handlePresetSelect = useCallback(
    (preset: ThemePreset) => {
      setPreset(preset);
      if (preset !== 'custom') {
        setCustomColors(THEME_PRESETS[preset as keyof typeof THEME_PRESETS]);
      }
    },
    [setPreset]
  );

  const handleColorChange = useCallback(
    (key: keyof ThemeColors, value: string) => {
      const updated = { ...customColors, [key]: value };
      setCustomColors(updated);
      setColors(updated);
    },
    [customColors, setColors]
  );

  const presetEntries = Object.entries(THEME_PRESETS) as [ThemePreset, ThemeColors][];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed right-0 top-0 h-full w-full max-w-md bg-surface border-l border-border z-50 overflow-y-auto"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="sticky top-0 bg-surface border-b border-border z-10 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary">Theme Creator</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-alt transition-colors text-text-secondary hover:text-text-primary"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Tab Switcher */}
              <div className="flex bg-surface-alt rounded-xl p-1">
                <button
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'presets'
                      ? 'bg-primary text-white shadow-lg shadow-primary/30'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                  onClick={() => setActiveTab('presets')}
                >
                  Presets
                </button>
                <button
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'custom'
                      ? 'bg-primary text-white shadow-lg shadow-primary/30'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                  onClick={() => setActiveTab('custom')}
                >
                  Custom
                </button>
              </div>

              {/* Preset Themes */}
              {activeTab === 'presets' && (
                <div className="grid grid-cols-2 gap-3">
                  {presetEntries.map(([presetName, presetColors]) => (
                    <button
                      key={presetName}
                      onClick={() => handlePresetSelect(presetName)}
                      className={`relative p-4 rounded-xl border-2 transition-all ${
                        preset === presetName
                          ? 'border-primary bg-surface-alt shadow-glow-sm'
                          : 'border-border hover:border-text-muted hover:bg-surface-alt/50'
                      }`}
                    >
                      {/* Color preview dots */}
                      <div className="flex gap-1.5 mb-3">
                        <div className="w-5 h-5 rounded-full border border-white/10" style={{ backgroundColor: presetColors.surface }} />
                        <div className="w-5 h-5 rounded-full border border-white/10" style={{ backgroundColor: presetColors.primary }} />
                        <div className="w-5 h-5 rounded-full border border-white/10" style={{ backgroundColor: presetColors.accent }} />
                        <div className="w-5 h-5 rounded-full border border-white/10" style={{ backgroundColor: presetColors.textPrimary }} />
                      </div>
                      <span className="text-sm font-medium text-text-primary">
                        {PRESET_NAMES[presetName]}
                      </span>
                      {preset === presetName && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Custom Theme */}
              {activeTab === 'custom' && (
                <div className="space-y-3">
                  {COLOR_LABELS.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-3">
                      <label className="flex-1 text-sm text-text-secondary">{label}</label>
                      <div className="relative">
                        <input
                          type="color"
                          value={customColors[key]}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer border border-border bg-transparent"
                        />
                        <div className="absolute inset-0 rounded-lg border border-white/5 pointer-events-none" />
                      </div>
                      <input
                        type="text"
                        value={customColors[key]}
                        onChange={(e) => handleColorChange(key, e.target.value)}
                        className="w-24 px-2 py-1.5 text-xs font-mono bg-surface-alt border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                        maxLength={7}
                      />
                    </div>
                  ))}

                  {/* Preview */}
                  <div className="mt-6 p-4 rounded-xl border border-border bg-surface-alt">
                    <p className="text-xs text-text-muted mb-2">Preview</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: customColors.primary }} />
                        <div>
                          <p className="text-sm font-medium" style={{ color: customColors.textPrimary }}>
                            ST BEIP
                          </p>
                          <p className="text-xs" style={{ color: customColors.textSecondary }}>
                            Now Playing — Song Title
                          </p>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ backgroundColor: customColors.border }}>
                        <div className="h-1.5 rounded-full w-2/3" style={{ backgroundColor: customColors.accent }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
