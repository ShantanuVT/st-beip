'use client';

import { motion } from 'framer-motion';
import { useLibraryStore } from '@/lib/store/libraryStore';

/**
 * SpotifyLoginButton
 *
 * Renders a "Login with Spotify" button that initiates the
 * PKCE OAuth flow. Shows loading/error states accordingly.
 * The actual redirect happens in the store's login() action.
 */
export function SpotifyLoginButton() {
  const { login, isAuthenticating, authError } = useLibraryStore();

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* Spotify icon */}
      <div className="w-16 h-16 rounded-2xl bg-[#1ed760]/10 flex items-center justify-center">
        <svg className="w-8 h-8 text-[#1ed760]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
      </div>

      <div className="text-center space-y-2 max-w-xs">
        <h3 className="text-base font-semibold text-text-primary">Connect Your Spotify</h3>
        <p className="text-xs text-text-muted leading-relaxed">
          Sign in with your Spotify account to browse your playlists and liked songs.
          All audio plays through YouTube — no Spotify Premium needed.
        </p>
      </div>

      {/* Login button */}
      <motion.button
        onClick={login}
        disabled={isAuthenticating}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-3 px-6 py-3 rounded-xl bg-[#1ed760] text-black font-semibold text-sm
          hover:bg-[#1ed760]/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-wait
          shadow-lg shadow-[#1ed760]/20"
      >
        {isAuthenticating ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Connecting...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            Continue with Spotify
          </>
        )}
      </motion.button>

      {/* Error state */}
      {authError && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 w-full max-w-sm"
        >
          <div className="flex gap-2">
            <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <div className="text-xs text-amber-300 leading-relaxed">{authError}</div>
          </div>
        </motion.div>
      )}

      {/* Tips */}
      <div className="space-y-2 w-full max-w-sm pt-2">
        <p className="text-[10px] text-text-muted/60 uppercase tracking-wider font-semibold text-center">How it works</p>
        <ul className="space-y-1.5">
          <li className="flex items-start gap-2 text-[11px] text-text-muted">
            <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Your playlists and likes are imported from Spotify
          </li>
          <li className="flex items-start gap-2 text-[11px] text-text-muted">
            <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            All songs play via YouTube in their original language
          </li>
          <li className="flex items-start gap-2 text-[11px] text-text-muted">
            <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            No Spotify Premium needed — just a free Spotify account
          </li>
        </ul>
      </div>
    </div>
  );
}
