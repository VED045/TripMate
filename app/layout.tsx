import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'TripMate — Your Trip OS',
  description: 'A premium shared operating system for your trip. Track expenses, share memories, and settle up with your crew.',
  keywords: ['trip', 'travel', 'expenses', 'photos', 'friends', 'split bills'],
  authors: [{ name: 'TripMate' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TripMate',
  },
  openGraph: {
    title: 'TripMate',
    description: 'Your premium trip management app',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#08080f',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body>
        {children}
        <Toaster
          position="top-center"
          expand={false}
          richColors
          theme="dark"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              border: '1px solid var(--border-strong)',
              color: 'var(--text-primary)',
            },
          }}
        />
      </body>
    </html>
  );
}
