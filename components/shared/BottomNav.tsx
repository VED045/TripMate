'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  WalletCards, 
  Camera, 
  Users, 
  BarChart3,
  Clock
} from 'lucide-react';

interface BottomNavProps {
  slug: string;
}

export function BottomNav({ slug }: BottomNavProps) {
  const pathname = usePathname();

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
      active: pathname.startsWith(`/trip/${slug}/people`),
    },
    {
      label: 'Stats',
      href: `/trip/${slug}/analytics`,
      icon: BarChart3,
      active: pathname.startsWith(`/trip/${slug}/analytics`),
    },
  ];

  return (
    <nav 
      aria-label="Mobile Navigation" 
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-slate-950/85 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 safe-area-bottom shadow-2xl"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              id={`nav-item-${item.label.toLowerCase()}`}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 relative ${
                item.active 
                  ? 'text-cyan-400 scale-105' 
                  : 'text-slate-400 hover:text-slate-200 hover:scale-100'
              }`}
            >
              {item.active && (
                <span className="absolute -top-1 w-6 h-1 bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              )}
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
