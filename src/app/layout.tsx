import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ClientLayout } from './client-layout';

export const metadata: Metadata = {
  title: 'ST BEIP — Premium Music Streaming',
  description: 'A premium, ad-free music streaming platform with real-time room sync, audio-reactive visuals, and custom themes.',
  keywords: ['music', 'streaming', 'spotify', 'youtube', 'audio', 'real-time', 'sync'],
  authors: [{ name: 'ST BEIP' }],
  openGraph: {
    title: 'ST BEIP — Premium Music Streaming',
    description: 'A premium, ad-free music streaming platform with real-time room sync and audio-reactive visuals.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f0f11',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to critical origins */}
        <link rel="preconnect" href="https://i.scdn.co" />
        <link rel="preconnect" href="https://i.ytimg.com" />
        <link rel="dns-prefetch" href="https://api.spotify.com" />
      </head>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
