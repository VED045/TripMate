'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// AVATAR — member avatar with initials fallback + color ring
// =============================================================================

interface AvatarProps {
  name: string;
  color?: string | null;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showRing?: boolean;
}

const sizeMap = {
  xs: { container: 'w-6 h-6 text-[10px]', img: 'w-6 h-6' },
  sm: { container: 'w-8 h-8 text-xs', img: 'w-8 h-8' },
  md: { container: 'w-10 h-10 text-sm', img: 'w-10 h-10' },
  lg: { container: 'w-12 h-12 text-base', img: 'w-12 h-12' },
  xl: { container: 'w-16 h-16 text-xl', img: 'w-16 h-16' },
};

export function Avatar({ name, color, avatarUrl, size = 'md', className, showRing = false }: AvatarProps) {
  const s = sizeMap[size];
  const initial = name?.charAt(0)?.toUpperCase() || '?';
  const bgColor = color || '#6366f1';

  return (
    <div
      className={cn(
        s.container,
        'rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 overflow-hidden',
        showRing && 'ring-2 ring-offset-1 ring-offset-[var(--background)]',
        className
      )}
      style={{
        backgroundColor: bgColor,
        ...(showRing ? { ringColor: bgColor } : {}),
      }}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={name} className={cn(s.img, 'object-cover')} />
      ) : (
        <span style={{ fontFamily: 'var(--font-display)' }}>{initial}</span>
      )}
    </div>
  );
}

// Avatar group (overlapping)
interface AvatarGroupProps {
  members: Array<{ name: string; color?: string | null; avatarUrl?: string | null }>;
  max?: number;
  size?: 'xs' | 'sm' | 'md';
}
export function AvatarGroup({ members, max = 4, size = 'sm' }: AvatarGroupProps) {
  const visible = members.slice(0, max);
  const remaining = members.length - max;
  const s = sizeMap[size];

  return (
    <div className="flex items-center">
      {visible.map((m, i) => (
        <div
          key={i}
          className={cn(
            s.container,
            'rounded-full border-2 border-[var(--background)] flex items-center justify-center font-bold text-white flex-shrink-0',
            i > 0 && '-ml-2'
          )}
          style={{ backgroundColor: m.color || '#6366f1', zIndex: visible.length - i }}
          title={m.name}
        >
          {m.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.avatarUrl} alt={m.name} className={cn(s.img, 'object-cover rounded-full')} />
          ) : (
            <span className="text-[10px] font-bold">{m.name?.charAt(0)?.toUpperCase()}</span>
          )}
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            s.container,
            'rounded-full border-2 border-[var(--background)] bg-[var(--surface-inset)] flex items-center justify-center text-[var(--text-muted)] font-bold -ml-2'
          )}
        >
          <span className="text-[10px]">+{remaining}</span>
        </div>
      )}
    </div>
  );
}
