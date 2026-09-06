'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Compass, 
  Settings, 
  Sparkles,
  Share2,
  Calendar,
  Layers,
  ChevronDown
} from 'lucide-react';
import { useActiveTrip } from './ActiveTripContext';
import { toast } from 'sonner';

interface TripHeaderProps {
  title?: string;
  subtitle?: string;
  showMemberPicker?: boolean;
}

export function TripHeader({ title, subtitle, showMemberPicker = true }: TripHeaderProps) {
  const { trip, members, currentMember, setCurrentMemberId } = useActiveTrip();

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Trip link copied to clipboard!');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#050711]/85 backdrop-blur-2xl border-b border-white/[0.08] px-4 md:px-6 py-3.5">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-3">
          <Link href="/" className="md:hidden flex items-center">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 via-indigo-600 to-fuchsia-500 p-[1px] shadow-md">
              <div className="w-full h-full bg-[#070914] rounded-[11px] flex items-center justify-center">
                <Compass className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
          </Link>

          <div>
            <h1 className="text-base md:text-lg font-bold font-outfit text-white tracking-tight flex items-center gap-2">
              {title || trip?.name || 'TripMate'}
            </h1>
            {subtitle ? (
              <p className="text-[11px] text-slate-400">{subtitle}</p>
            ) : trip?.start_date ? (
              <p className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                <Calendar className="w-3 h-3 text-cyan-400" />
                {new Date(trip.start_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                {trip.end_date && ` — ${new Date(trip.end_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`}
              </p>
            ) : null}
          </div>
        </div>

        {/* Right: Member Switcher + Actions */}
        <div className="flex items-center gap-2.5">
          {showMemberPicker && members.length > 0 && (
            <div className="flex items-center gap-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 rounded-2xl px-2.5 py-1.5 transition-colors">
              <div 
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm flex-shrink-0"
                style={{ backgroundColor: currentMember?.color || '#6366f1' }}
              >
                {currentMember?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex items-center gap-1">
                <select
                  aria-label="Select active crew member"
                  value={currentMember?.id || ''}
                  onChange={(e) => setCurrentMemberId(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer max-w-[100px] truncate"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                      {m.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}

          <button
            id="trip-share-button"
            onClick={handleShare}
            aria-label="Share trip"
            className="p-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {trip && (
            <Link
              id="trip-settings-link"
              href={`/trip/${trip.slug}/settings`}
              aria-label="Trip settings"
              className="p-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white transition-colors"
            >
              <Settings className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
