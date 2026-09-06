'use client';

import React from 'react';

interface WaveBackgroundProps {
  className?: string;
  intensity?: 'subtle' | 'vibrant';
  animated?: boolean;
}

export function WaveBackground({ className = '', intensity = 'vibrant', animated = true }: WaveBackgroundProps) {
  const opacity1 = intensity === 'vibrant' ? '0.45' : '0.2';
  const opacity2 = intensity === 'vibrant' ? '0.35' : '0.15';
  const opacity3 = intensity === 'vibrant' ? '0.25' : '0.1';

  return (
    <div className={`relative overflow-hidden pointer-events-none select-none ${className}`}>
      {/* Glow Orbs */}
      <div className="absolute -top-24 -left-20 w-96 h-96 rounded-full bg-indigo-500/20 blur-[100px]" />
      <div className="absolute -bottom-24 -right-20 w-96 h-96 rounded-full bg-cyan-500/20 blur-[100px]" />
      <div className="absolute top-1/2 left-1/3 w-80 h-80 rounded-full bg-fuchsia-500/15 blur-[120px]" />

      {/* SVG Waves */}
      <svg
        className="w-full h-full object-cover"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="wave-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={opacity1} />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity={opacity1} />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={opacity1} />
          </linearGradient>
          <linearGradient id="wave-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity={opacity2} />
            <stop offset="50%" stopColor="#ec4899" stopOpacity={opacity2} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={opacity2} />
          </linearGradient>
          <linearGradient id="wave-grad-3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={opacity3} />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity={opacity3} />
          </linearGradient>
        </defs>

        <path
          className={animated ? 'animate-[wave-slow_14s_ease-in-out_infinite]' : ''}
          fill="url(#wave-grad-3)"
          d="M0,192L48,197.3C96,203,192,213,288,208C384,203,480,181,576,181.3C672,181,768,203,864,213.3C960,224,1056,224,1152,208C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />

        <path
          className={animated ? 'animate-[wave-medium_10s_ease-in-out_infinite]' : ''}
          fill="url(#wave-grad-2)"
          d="M0,96L48,112C96,128,192,160,288,165.3C384,171,480,149,576,133.3C672,117,768,107,864,122.7C960,139,1056,181,1152,186.7C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />

        <path
          className={animated ? 'animate-[wave-fast_7s_ease-in-out_infinite]' : ''}
          fill="url(#wave-grad-1)"
          d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,218.7C672,235,768,245,864,229.3C960,213,1056,171,1152,160C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
      </svg>
    </div>
  );
}
