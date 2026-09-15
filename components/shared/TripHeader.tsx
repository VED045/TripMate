'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, Settings, Share2, Calendar, ChevronDown, User } from 'lucide-react';
import { useActiveTrip } from './ActiveTripContext';
import { Avatar } from '@/components/ui/Avatar';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { CustomSelect } from '@/components/ui/CustomSelect';

interface TripHeaderProps {
  title?: string;
  subtitle?: string;
  showMemberPicker?: boolean;
  className?: string;
}

export function TripHeader({ title, subtitle, showMemberPicker = true, className }: TripHeaderProps) {
  const { trip, members, currentMember, setCurrentMemberId } = useActiveTrip();

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: trip?.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Trip link copied!');
      }
    } catch {
      toast.error('Could not share trip link');
    }
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-30 px-4 md:px-6 py-2.5 transition-all duration-200',
        className
      )}
      style={{
        background: 'var(--surface-overlay)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
      }}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto gap-2 sm:gap-4">
        {/* Left: Logo (mobile) + Title */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Logo — mobile only */}
          <Link
            href="/"
            className="md:hidden flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform active:scale-95"
            style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)' }}
          >
            <Compass className="w-4 h-4 text-white" />
          </Link>

          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-extrabold text-[var(--text-primary)] font-outfit truncate leading-tight">
              {title || trip?.name || 'TripMate'}
            </h1>
            {subtitle ? (
              <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">{subtitle}</p>
            ) : trip?.start_date ? (
              <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 font-mono mt-0.5">
                <Calendar className="w-2.5 h-2.5 flex-shrink-0" />
                <span className="truncate">
                  {new Date(trip.start_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  {trip.end_date && ` — ${new Date(trip.end_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`}
                </span>
              </p>
            ) : null}
          </div>
        </div>

        {/* Right: Member Picker + Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Member Switcher */}
          {showMemberPicker && members.length > 0 && (
            <CustomSelect
              value={currentMember?.id || ''}
              onChange={setCurrentMemberId}
              options={members.map((m) => {
                const isCreator = Boolean(
                  m.is_admin ||
                  (trip?.created_by && m.id === trip.created_by) ||
                  (members.length > 0 && members[0]?.id === m.id)
                );
                return {
                  value: m.id,
                  label: m.name,
                  color: m.color,
                  isCreator,
                };
              })}
              className="max-w-[120px] sm:max-w-[140px]"
            />
          )}

          {/* Share Button */}
          <button
            id="trip-share-button"
            onClick={handleShare}
            aria-label="Share trip link"
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] shadow-[var(--shadow-raised)] active:shadow-[var(--shadow-inset)] active:scale-95 transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {/* Profile Link */}
          {trip && (
            <Link
              id="trip-profile-link"
              href={`/trip/${trip.slug}/profile`}
              title="My Profile & UPI Code"
              aria-label="My Profile & UPI Code"
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] shadow-[var(--shadow-raised)] active:shadow-[var(--shadow-inset)] active:scale-95 transition-all"
            >
              <User className="w-3.5 h-3.5" />
            </Link>
          )}

          {/* Settings Link (Creator only) */}
          {trip && (currentMember?.is_admin || (trip.created_by && currentMember?.id === trip.created_by) || (members.length > 0 && members[0]?.id === currentMember?.id)) && (
            <Link
              id="trip-settings-link"
              href={`/trip/${trip.slug}/settings`}
              title="Trip Settings"
              aria-label="Trip settings"
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] shadow-[var(--shadow-raised)] active:shadow-[var(--shadow-inset)] active:scale-95 transition-all"
            >
              <Settings className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
