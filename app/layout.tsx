import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'TripMate — Group Travel & Expense OS',
  description: 'Premium mobile-first travel companion. Split expenses, track payments, share memories, and settle up with UPI — all in one place.',
  keywords: ['trip', 'travel', 'expenses', 'split bills', 'UPI', 'photos', 'friends', 'group travel'],
  authors: [{ name: 'TripMate' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TripMate',
  },
  openGraph: {
    title: 'TripMate — Group Travel & Expense OS',
    description: 'Split expenses, share memories, settle with UPI.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f0f2f5' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0e1a' },
  ],
};

// Inline script to apply theme before first paint (prevents flash)
const themeScript = `
(function() {
  try {
    var saved = localStorage.getItem('tripmate_theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = saved === 'light' ? 'light' : saved === 'dark' ? 'dark' : (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch(e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body>
        {children}
        <Toaster
          position="top-center"
          expand={false}
          richColors
          toastOptions={{
            style: {
              background: 'var(--surface-raised)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-card)',
            },
          }}
        />
      </body>
    </html>
  );
}
