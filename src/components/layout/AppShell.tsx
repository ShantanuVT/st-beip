'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SidePlayer } from '@/components/layout/SidePlayer';
import { MobilePlayer } from '@/components/layout/MobilePlayer';
import { EdgeLighting } from '@/components/edge-lighting/EdgeLighting';
import { AudioEngine } from '@/components/player/AudioEngine';
import { ThemeCreator } from '@/components/theme/ThemeCreator';
import { RoomSystem } from '@/components/room/RoomSystem';
import { SpotifyLibrary } from '@/components/spotify/SpotifyLibrary';
import { useEdgeLightingStore } from '@/lib/store/playerStore';
import type { FrequencyData } from '@/types';

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * AppShell is the main layout wrapper that integrates all
 * global UI components:
 * 
 * - AudioEngine (hidden, manages audio pipeline)
 * - EdgeLighting (viewport glow border)
 * - SidePlayer (desktop right panel)
 * - MobilePlayer (mobile bottom bar)
 * - ThemeCreator (custom theme panel)
 * - RoomSystem (sync room panel)
 * 
 * Provides frequency data from AudioEngine to EdgeLighting.
 */
export function AppShell({ children }: AppShellProps) {
  const [showThemeCreator, setShowThemeCreator] = useState(false);
  const [showRoomSystem, setShowRoomSystem] = useState(false);
  const [showSpotifyLibrary, setShowSpotifyLibrary] = useState(false);
  const [frequencyData, setFrequencyData] = useState<FrequencyData | undefined>(undefined);
  const { mode } = useEdgeLightingStore();

  const handleFrequencyData = useCallback((data: FrequencyData) => {
    setFrequencyData(data);
  }, []);

  const isEdgeActive = mode !== 'none';

  return (
    <AudioEngine onFrequencyData={handleFrequencyData}>
      <div className="min-h-screen bg-surface text-text-primary">
        {/* Edge Lighting */}
        <EdgeLighting frequencyData={frequencyData} isActive={isEdgeActive} />

        {/* Main Content Area */}
        <div className="flex">
          {/* Sidebar / Navigation */}
          <aside className="hidden lg:flex flex-col w-16 h-screen fixed left-0 top-0 z-20 bg-surface border-r border-border items-center py-4 gap-6">
            {/* Logo */}
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-glow-sm">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>

            <div className="flex-1 flex flex-col items-center gap-3">
              {/* Home */}
              <button className="w-10 h-10 rounded-xl flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-all" title="Home">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </button>

              {/* Search */}
              <button className="w-10 h-10 rounded-xl flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-all" title="Search">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </button>

              {/* Library */}
              <button className="w-10 h-10 rounded-xl flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-all" title="Library">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                </svg>
              </button>

              {/* Playlists / Spotify */}
              <button
                onClick={() => setShowSpotifyLibrary(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-all"
                title="Spotify Library"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col items-center gap-3">
              {/* Theme */}
              <button
                onClick={() => setShowThemeCreator(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-all"
                title="Theme"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              </button>

              {/* Room */}
              <button
                onClick={() => setShowRoomSystem(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-all"
                title="Listen Together"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87" />
                  <path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
              </button>
            </div>
          </aside>

          {/* Mobile top bar */}
          <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-surface/95 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 py-3">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
              <span className="font-semibold text-text-primary">ST BEIP</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowThemeCreator(true)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              </button>
              <button
                onClick={() => setShowRoomSystem(true)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 lg:pl-16 lg:pr-[320px] pt-0 lg:pt-0 pb-24 lg:pb-0">
            {/* Mobile top spacer */}
            <div className="h-[60px] lg:hidden" />
            {children}
          </main>
        </div>

        {/* Desktop Side Player */}
        <div className="hidden lg:block">
          <SidePlayer />
        </div>

        {/* Mobile Player */}
        <MobilePlayer />

        {/* Theme Creator Panel */}
        <ThemeCreator
          isOpen={showThemeCreator}
          onClose={() => setShowThemeCreator(false)}
        />

        {/* Room System Panel */}
        <RoomSystem
          isOpen={showRoomSystem}
          onClose={() => setShowRoomSystem(false)}
        />

        {/* Spotify Library Panel */}
        <AnimatePresence>
          {showSpotifyLibrary && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSpotifyLibrary(false)}
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              />

              {/* Panel */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed right-0 top-0 h-full z-50 w-full max-w-md bg-surface border-l border-border shadow-2xl"
              >
                {/* Close button */}
                <button
                  onClick={() => setShowSpotifyLibrary(false)}
                  className="absolute top-3 right-3 z-10 w-8 h-8 rounded-lg flex items-center justify-center
                    text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>

                <SpotifyLibrary />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </AudioEngine>
  );
}
