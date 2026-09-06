
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
  X,
} from 'lucide-react';

interface BottomNavProps {
  slug: string;
}

export function BottomNav({ slug }: BottomNavProps) {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  const navItems = [
    {
      label: 'Home',
      href: `/trip/${slug}`,
      icon: LayoutDashboard,
      active: pathname === `/trip/${slug}`,
    },
    {
      label: 'Money',
      href: `/trip/${slug}/money`,
      icon: WalletCards,
      active: pathname.startsWith(`/trip/${slug}/money`),
    },
    {
      label: 'Memories',
      href: `/trip/${slug}/memories`,
      icon: Camera,
      active: pathname.startsWith(`/trip/${slug}/memories`),
    },
    {
      label: 'People',
      href: `/trip/${slug}/people`,
      icon: Users,
      active:
        pathname.startsWith(`/trip/${slug}/people`) ||
        pathname.startsWith(`/trip/${slug}/directory`),
    },
  ];

  const moreItems = [
    {
      label: 'Timeline',
      href: `/trip/${slug}/timeline`,
      icon: Clock,
    },
    {
      label: 'Directory',
      href: `/trip/${slug}/directory`,
      icon: BookUser,
    },
    {
      label: 'Analytics',
      href: `/trip/${slug}/analytics`,
      icon: BarChart3,
    },
  ];

  const moreActive = moreItems.some((item) =>
    pathname.startsWith(item.href)
  );

  return (
    <>
      {/* More menu backdrop */}
      {showMore && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More menu */}
      {showMore && (
        <div className="fixed bottom-[76px] right-3 z-50 md:hidden w-56 rounded-2xl bg-[#0c1228] border border-white/10 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-sm font-bold text-white">
              Trip Navigation
            </span>

            <button
              onClick={() => setShowMore(false)}
              className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-2">
            {moreItems.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setShowMore(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${active
                    ? 'bg-cyan-500/15 text-cyan-400'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-semibold">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-slate-950/90 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 safe-area-bottom shadow-2xl"
      >
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                id={`nav-item-${item.label.toLowerCase()}`}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 relative ${item.active
                  ? 'text-cyan-400 scale-105'
                  : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                {item.active && (
                  <span className="absolute -top-1 w-6 h-1 bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                )}

                <Icon className="w-5 h-5 mb-0.5" />

                <span className="text-[10px] font-medium tracking-tight">
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* More */}
          <button
            type="button"
            onClick={() => setShowMore((prev) => !prev)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 relative ${moreActive || showMore
              ? 'text-cyan-400 scale-105'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            {(moreActive || showMore) && (
              <span className="absolute -top-1 w-6 h-1 bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            )}

            <MoreHorizontal className="w-5 h-5 mb-0.5" />

            <span className="text-[10px] font-medium tracking-tight">
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}

