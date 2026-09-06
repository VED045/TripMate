'use client';

import React from 'react';

export function MountainBackground({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden pointer-events-none select-none ${className}`}>
      {/* Sun/Moon ambient glow */}
      <div className="absolute top-6 right-12 w-28 h-28 rounded-full bg-gradient-to-tr from-amber-400/20 to-orange-500/20 blur-2xl" />

      <svg
        className="w-full h-full object-cover"
        viewBox="0 0 1200 400"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="mtn-back" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="mtn-mid" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#312e81" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="mtn-front" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4338ca" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#312e81" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Back Peaks */}
        <polygon points="0,400 150,180 320,320 480,120 700,340 920,160 1080,280 1200,190 1200,400" fill="url(#mtn-back)" />

        {/* Mid Peaks */}
        <polygon points="0,400 100,280 260,190 420,310 600,210 780,310 960,220 1120,300 1200,240 1200,400" fill="url(#mtn-mid)" />

        {/* Front Peaks */}
        <polygon points="0,400 80,320 200,240 380,360 520,270 680,350 840,260 1020,340 1200,280 1200,400" fill="url(#mtn-front)" />
      </svg>
    </div>
  );
}
