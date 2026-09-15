'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  WalletCards,
  Camera,
  Users,
  Clock,
  BookUser,
  BarChart3,
  Settings,
  Compass,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActiveTrip } from '@/components/shared/ActiveTripContext';
import { Avatar } from '@/components/ui/Avatar';

interface SidebarProps {
  slug: string;
}

export function Sidebar({ slug }: SidebarProps) {
  const pathname = usePathname();
  const { trip, currentMember } = useActiveTrip();
  const [collapsed, setCollapsed] = useState(false);

  const base = `/trip/${slug}`;

  const navItems = [
    { label: 'Dashboard', href: base, icon: LayoutDashboard, exact: true },
    { label: 'Money', href: `${base}/money`, icon: WalletCards },
    { label: 'Memories', href: `${base}/memories`, icon: Camera },
    { label: 'People', href: `${base}/people`, icon: Users },
    { label: 'Timeline', href: `${base}/timeline`, icon: Clock },
    { label: 'Analytics', href: `${base}/analytics`, icon: BarChart3 },
    { label: 'Directory', href: `${base}/directory`, icon: BookUser },
    { label: 'Settings', href: `${base}/settings`, icon: Settings },
  ];

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col transition-all duration-300 ease-in-out flex-shrink-0',
        'border-r border-[var(--border)] relative',
        collapsed ? 'w-[68px]' : 'w-56'
      )}
      style={{ background: 'var(--surface)' }}
    >
      {/* Logo / Trip Name */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-[var(--border)]',
        collapsed && 'px-3 justify-center'
      )}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--accent)' }}>
          <Compass className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <span className="font-outfit font-black text-sm tracking-tight text-[var(--text-primary)] truncate block">
              Trip<span style={{ color: 'var(--accent)' }}>Mate</span>
            </span>
            {trip && (
              <span className="text-[10px] text-[var(--text-muted)] truncate block">
                {trip.name}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-2 overflow-y-auto space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.label}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl transition-all duration-150 group relative',
                collapsed ? 'px-2.5 py-2.5 justify-center' : 'px-3 py-2.5',
                active
                  ? 'bg-[var(--accent-subtle)] text-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-inset)] hover:text-[var(--text-primary)]'
              )}
            >
              {/* Active bar */}
              {active && !collapsed && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                  style={{ background: 'var(--accent)' }}
                />
              )}
              <Icon className={cn('flex-shrink-0 transition-none', collapsed ? 'w-5 h-5' : 'w-4 h-4')} />
              {!collapsed && (
                <span className={cn('text-sm truncate', active ? 'font-semibold' : 'font-medium')}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Current Member */}
      {currentMember && (
        <div className={cn(
          'border-t border-[var(--border)] p-3',
          collapsed ? 'flex justify-center' : 'flex items-center gap-2.5'
        )}>
          <Avatar
            name={currentMember.name}
            color={currentMember.color}
            size="sm"
          />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                {currentMember.name}
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">Active member</p>
            </div>
          )}
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className={cn(
          'absolute -right-3 top-7 w-6 h-6 rounded-full flex items-center justify-center',
          'border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors z-10',
          'shadow-[var(--shadow-card)]'
        )}
        style={{ background: 'var(--surface)' }}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>
    </aside>
  );
}
