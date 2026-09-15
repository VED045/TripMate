'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  WalletCards,
  Camera,
  Users,
  MoreHorizontal,
  Clock,
  BookUser,
  BarChart3,
  Settings,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  slug: string;
}

export function BottomNav({ slug }: BottomNavProps) {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  const base = `/trip/${slug}`;

  const navItems = [
    {
      label: 'Home',
      href: base,
      icon: LayoutDashboard,
      active: pathname === base,
    },
    {
      label: 'Money',
      href: `${base}/money`,
      icon: WalletCards,
      active: pathname.startsWith(`${base}/money`),
    },
    {
      label: 'Memories',
      href: `${base}/memories`,
      icon: Camera,
      active: pathname.startsWith(`${base}/memories`),
    },
    {
      label: 'People',
      href: `${base}/people`,
      icon: Users,
      active: pathname.startsWith(`${base}/people`),
    },
  ];

  const moreItems = [
    { label: 'Timeline', href: `${base}/timeline`, icon: Clock },
    { label: 'Analytics', href: `${base}/analytics`, icon: BarChart3 },
    { label: 'Directory', href: `${base}/directory`, icon: BookUser },
    { label: 'Settings', href: `${base}/settings`, icon: Settings },
  ];

  const moreActive = moreItems.some((item) => pathname.startsWith(item.href));

  return (
    <>
      {/* More Menu Backdrop */}
      {showMore && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setShowMore(false)}
          aria-hidden="true"
        />
      )}

      {/* More Menu Panel */}
      {showMore && (
        <div className="fixed bottom-[72px] left-2 right-2 z-50 md:hidden animate-slide-up">
          <div
            className="rounded-2xl overflow-hidden shadow-[var(--shadow-modal)]"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <span className="text-sm font-bold text-[var(--text-primary)] font-outfit">
                More
              </span>
              <button
                type="button"
                onClick={() => setShowMore(false)}
                aria-label="Close"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-inset)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2 grid grid-cols-2 gap-1">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium',
                      active
                        ? 'bg-[var(--accent-subtle)] text-[var(--accent)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-inset)] hover:text-[var(--text-primary)]'
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav
        aria-label="Main navigation"
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden safe-area-bottom"
        style={{
          background: 'color-mix(in srgb, var(--surface) 95%, transparent)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--border)',
          boxShadow: 'var(--shadow-nav)',
        }}
      >
        <div className="flex items-center justify-around px-2 pt-1 pb-1 max-w-lg mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                id={`nav-${item.label.toLowerCase()}`}
                className={cn(
                  'flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 min-w-[56px] touch-target relative group',
                  item.active
                    ? 'text-[var(--accent)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                )}
              >
                {/* Active pill background */}
                {item.active && (
                  <span
                    className="absolute inset-0 rounded-2xl opacity-10"
                    style={{ background: 'var(--accent)' }}
                  />
                )}

                {/* Icon */}
                <Icon
                  className={cn(
                    'w-5 h-5 transition-transform duration-200 relative',
                    item.active && 'scale-110'
                  )}
                />

                {/* Label */}
                <span
                  className={cn(
                    'text-[10px] mt-0.5 font-medium tracking-tight relative',
                    item.active && 'font-bold'
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            type="button"
            onClick={() => setShowMore((prev) => !prev)}
            aria-expanded={showMore}
            aria-label="More navigation options"
            className={cn(
              'flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 min-w-[56px] touch-target relative',
              moreActive || showMore
                ? 'text-[var(--accent)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            )}
          >
            {(moreActive || showMore) && (
              <span
                className="absolute inset-0 rounded-2xl opacity-10"
                style={{ background: 'var(--accent)' }}
              />
            )}
            <MoreHorizontal className={cn('w-5 h-5 relative', (moreActive || showMore) && 'scale-110')} />
            <span className={cn('text-[10px] mt-0.5 font-medium tracking-tight relative', (moreActive || showMore) && 'font-bold')}>
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}