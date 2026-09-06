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
  Clock, 
  Settings, 
  Compass, 
  Sparkles,
  ChevronDown,
  Phone
} from 'lucide-react';
import { useActiveTrip } from './ActiveTripContext';

interface SidebarProps {
  slug: string;
}

export function Sidebar({ slug }: SidebarProps) {
  const pathname = usePathname();
  const { trip, members, currentMember, setCurrentMemberId } = useActiveTrip();

  const navItems = [
    {
      label: 'Overview',
      href: `/trip/${slug}`,
      icon: LayoutDashboard,
      active: pathname === `/trip/${slug}`,
    },
    {
      label: 'Money & Split',
      href: `/trip/${slug}/money`,
      icon: WalletCards,
      active: pathname.startsWith(`/trip/${slug}/money`),
    },
    {
      label: 'Memories & Vault',
      href: `/trip/${slug}/memories`,
      icon: Camera,
      active: pathname.startsWith(`/trip/${slug}/memories`),
    },
    {
      label: 'Crew & Balances',
      href: `/trip/${slug}/people`,
      icon: Users,
      active: pathname.startsWith(`/trip/${slug}/people`),
    },
    {
      label: 'Trip Pulse & Stats',
      href: `/trip/${slug}/analytics`,
      icon: BarChart3,
      active: pathname.startsWith(`/trip/${slug}/analytics`),
    },
    {
      label: 'Trip Timeline',
      href: `/trip/${slug}/timeline`,
      icon: Clock,
      active: pathname.startsWith(`/trip/${slug}/timeline`),
    },
    {
      label: 'Directory & SOS',
      href: `/trip/${slug}/directory`,
      icon: Phone,
      active: pathname.startsWith(`/trip/${slug}/directory`),
    },
    {
      label: 'Settings & Export',
      href: `/trip/${slug}/settings`,
      icon: Settings,
      active: pathname.startsWith(`/trip/${slug}/settings`),
    },
  ];

  return (
    <aside 
      aria-label="Desktop Sidebar"
      className="hidden md:flex flex-col w-64 border-r border-white/[0.08] bg-[#070914]/90 backdrop-blur-3xl p-4 sticky top-0 h-screen z-30 select-none"
    >
      {/* Brand */}
      <div className="mb-6 px-2">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-400 via-indigo-600 to-fuchsia-500 p-[1px] shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#070914] rounded-[15px] flex items-center justify-center">
              <Compass className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <span className="font-outfit font-black text-lg tracking-tight text-white">
              Trip<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Mate</span>
            </span>
            <div className="text-[9px] font-mono tracking-widest text-cyan-400/80 uppercase -mt-0.5">
              Trip OS
            </div>
          </div>
        </Link>

        {trip && (
          <div className="mt-4 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
            <div className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider font-semibold mb-0.5">Active Trip</div>
            <div className="font-bold text-slate-100 text-sm truncate">{trip.name}</div>
          </div>
        )}
      </div>

      {/* Member Perspective Switcher */}
      {members.length > 0 && (
        <div className="mb-6 px-2">
          <label className="text-[11px] font-semibold text-slate-400 block mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Viewing perspective as:
          </label>
          <div className="relative">
            <select
              aria-label="Select active crew member perspective"
              value={currentMember?.id || ''}
              onChange={(e) => setCurrentMemberId(e.target.value)}
              className="w-full appearance-none bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-400 transition-colors cursor-pointer pr-8"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                  {m.name} {m.is_admin ? '(Admin)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Nav Links */}
      <div className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              id={`sidebar-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                item.active
                  ? 'bg-gradient-to-r from-cyan-500/15 via-indigo-600/20 to-transparent text-cyan-300 border-l-2 border-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <Icon className={`w-4 h-4 ${item.active ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-white/[0.08] px-2 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5 text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Cloudinary Vault
        </span>
        <span className="font-mono text-[10px] text-slate-600">v1.0</span>
      </div>
    </aside>
  );
}
