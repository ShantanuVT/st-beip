'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/lib/store/themeStore';

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * ThemeProvider applies the current theme's CSS custom properties
 * to the document root on mount and whenever the theme changes.
 * 
 * Uses CSS custom properties for hardware-accelerated theme switching
 * without re-renders.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const applyTheme = useThemeStore((s) => s.applyTheme);

  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  return <>{children}</>;
}
