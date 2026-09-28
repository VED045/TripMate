'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass,
  Settings,
  Share2,
  Calendar,
  User,
  LogOut,
  LayoutDashboard,
  UserCheck,
  ChevronDown,
} from 'lucide-react';
import { useActiveTrip } from './ActiveTripContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { JoinTripModal } from '@/components/trip/JoinTripModal';

interface TripHeaderProps {
  title?: string;
  subtitle?: string;
  showMemberPicker?: boolean;
  className?: string;
}

export function TripHeader({
  title,
  subtitle,
  showMemberPicker = true,
  className,
}: TripHeaderProps) {
  const router = useRouter();
  const { trip, members, currentMember, setCurrentMemberId } = useActiveTrip();
  const { user, signOut } = useAuth();
  const [showAuthMenu, setShowAuthMenu] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const authMenuRef = useRef<HTMLDivElement>(null);

  const userClaim = user?.user_metadata?.claimed_trips?.find(
    (t: any) => t.trip_id === trip?.id || t.slug === trip?.slug || t.trip_slug === trip?.slug
  );
  const isLinkedUser = Boolean(
    user && (userClaim || members.some((m: any) => m.auth_user_id === user.id))
  );
  const isCreator = Boolean(
    currentMember?.is_admin ||
    (trip?.created_by && currentMember?.id === trip.created_by) ||
    (members.length > 0 && members[0]?.id === currentMember?.id)
  );

  // Close auth menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | PointerEvent | TouchEvent) => {
      if (authMenuRef.current && !authMenuRef.current.contains(e.target as Node)) {
        setShowAuthMenu(false);
      }
    };
    if (showAuthMenu) {
      document.addEventListener('pointerdown', handleClickOutside);
    }
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [showAuthMenu]);

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: trip?.name ? `${trip.name} · TripMate` : 'TripMate',
          text: `Join ${trip?.name || 'our trip'} on TripMate!`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Trip link copied to clipboard!');
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Trip link copied to clipboard!');
      } catch {
        toast.error('Could not copy trip link');
      }
    }
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-30 px-3 sm:px-6 py-2 sm:py-2.5 transition-all duration-200',
        className
      )}
      style={{
        background: 'var(--surface-overlay)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        boxShadow: '0 2px 14px rgba(0, 0, 0, 0.04)',
      }}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto gap-2 sm:gap-4">
        {/* Left Side: Brand Logo + Trip Identity */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
          {/* Brand/Home Button */}
          <Link
            href={user ? '/dashboard' : '/'}
            title="TripMate Home"
            className="flex-shrink-0 w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-white shadow-sm transition-all active:scale-95 hover:shadow-md"
            style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)' }}
          >
            <Compass className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
          </Link>

          {/* Trip Info Header */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-xs sm:text-base font-extrabold text-[var(--text-primary)] font-outfit truncate leading-tight tracking-tight">
                {title || trip?.name || 'TripMate'}
              </h1>
              {trip?.status === 'active' && (
                <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              )}
            </div>

            {subtitle ? (
              <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5 leading-none">{subtitle}</p>
            ) : trip?.start_date ? (
              <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 font-mono mt-0.5 leading-none">
                <Calendar className="w-2.5 h-2.5 text-[var(--accent)] flex-shrink-0" />
                <span className="truncate">
                  {new Date(trip.start_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  {trip.end_date && ` — ${new Date(trip.end_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`}
                </span>
                <span className="text-[var(--border-strong)]">·</span>
                <span className="text-[var(--text-muted)] shrink-0">{members.length} {members.length === 1 ? 'member' : 'crew'}</span>
              </p>
            ) : null}
          </div>
        </div>

        {/* Right Side: Neatly Organized Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Member Picker */}
          {showMemberPicker && members.length > 0 && (
            <CustomSelect
              value={currentMember?.id || ''}
              onChange={setCurrentMemberId}
              options={members.map((m) => {
                const isMemberCreator = Boolean(
                  m.is_admin ||
                  (trip?.created_by && m.id === trip.created_by) ||
                  (members.length > 0 && members[0]?.id === m.id)
                );
                return {
                  value: m.id,
                  label: m.name,
                  color: m.color,
                  isCreator: isMemberCreator,
                };
              })}
              className="w-[100px] sm:w-[140px]"
              buttonClassName="h-8.5 sm:h-9 py-0 px-2 sm:px-3 bg-[var(--surface-raised)] hover:bg-[var(--surface-inset)] border-[var(--border)] shadow-sm text-xs"
            />
          )}

          {/* Desktop-only Claim Profile button (only if user logged in but not linked yet) */}
          {user && !isLinkedUser && trip && (
            <button
              onClick={() => setIsJoinModalOpen(true)}
              title="Link your account to your profile (e.g. Ved) in this trip"
              className="hidden md:flex h-9 px-3 rounded-xl text-xs font-bold text-white shadow-sm items-center gap-1.5 active:scale-95 transition-all flex-shrink-0 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              }}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Claim Profile</span>
            </button>
          )}

          {/* Quick Action: Share */}
          <button
            id="trip-share-button"
            onClick={handleShare}
            title="Share trip link"
            aria-label="Share trip link"
            className="w-8.5 h-8.5 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-inset)] shadow-sm active:scale-95 transition-all cursor-pointer flex-shrink-0"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {/* Quick Action: Profile & UPI (Desktop) */}
          {trip && (
            <Link
              id="trip-profile-link"
              href={`/trip/${trip.slug}/profile`}
              title="My Profile & UPI Code"
              aria-label="My Profile & UPI Code"
              className="hidden sm:flex w-9 h-9 items-center justify-center rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-inset)] shadow-sm active:scale-95 transition-all flex-shrink-0"
            >
              <User className="w-3.5 h-3.5" />
            </Link>
          )}

          {/* Quick Action: Settings (Desktop, creator only) */}
          {trip && isCreator && (
            <Link
              id="trip-settings-link"
              href={`/trip/${trip.slug}/settings`}
              title="Trip Settings"
              aria-label="Trip settings"
              className="hidden sm:flex w-9 h-9 items-center justify-center rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-inset)] shadow-sm active:scale-95 transition-all flex-shrink-0"
            >
              <Settings className="w-3.5 h-3.5" />
            </Link>
          )}

          {/* Vertical subtle divider (Desktop) */}
          <div className="h-5 w-[1px] bg-[var(--border)] my-auto hidden sm:block mx-0.5" />

          {/* User Account Avatar & Dropdown Menu */}
          <div className="relative" ref={authMenuRef}>
            {user ? (
              <>
                <button
                  onClick={() => setShowAuthMenu(!showAuthMenu)}
                  title={`Signed in as ${user.email}`}
                  className="relative w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface-inset)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--accent)] flex items-center justify-center shadow-sm active:scale-95 transition-all cursor-pointer flex-shrink-0"
                >
                  <span className="text-xs font-extrabold font-mono">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                  {/* Subtle pip if unlinked */}
                  {!isLinkedUser && trip && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[var(--surface-raised)]" />
                  )}
                </button>

                {showAuthMenu && (
                  <div
                    className="absolute right-0 mt-2 w-64 rounded-2xl p-2 z-50 border border-[var(--border)] shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-150 space-y-1"
                    style={{
                      background: 'var(--surface-overlay)',
                      boxShadow: '0 12px 36px rgba(0, 0, 0, 0.18)',
                    }}
                  >
                    {/* Signed In Banner */}
                    <div className="px-3 py-2 rounded-xl bg-[var(--surface-inset)] border border-[var(--border)]">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] font-mono">
                        Signed In As
                      </p>
                      <p className="text-xs font-semibold text-[var(--text-primary)] truncate font-mono mt-0.5">
                        {user.email}
                      </p>
                    </div>

                    {/* Trip Quick Links */}
                    {trip && (
                      <div className="space-y-0.5 pt-1">
                        <p className="px-2.5 pt-1 text-[9px] uppercase font-bold tracking-wider text-[var(--text-muted)] font-mono">
                          Trip Quick Actions
                        </p>

                        <button
                          type="button"
                          onClick={() => {
                            setShowAuthMenu(false);
                            setIsJoinModalOpen(true);
                          }}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-inset)] transition-all w-full text-left cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Switch or Link Identity</span>
                        </button>

                        <Link
                          href={`/trip/${trip.slug}/profile`}
                          onClick={() => setShowAuthMenu(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-inset)] transition-all sm:hidden"
                        >
                          <User className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                          <span>My Profile &amp; UPI Code</span>
                        </Link>

                        {isCreator && (
                          <Link
                            href={`/trip/${trip.slug}/settings`}
                            onClick={() => setShowAuthMenu(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-inset)] transition-all sm:hidden"
                          >
                            <Settings className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                            <span>Trip Settings</span>
                          </Link>
                        )}
                      </div>
                    )}

                    <div className="border-t border-[var(--border)] my-1" />

                    {/* General Account Links */}
                    <div className="space-y-0.5">
                      <Link
                        href="/dashboard"
                        onClick={() => setShowAuthMenu(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-inset)] transition-all"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-[var(--accent)]" />
                        <span>My Trips Dashboard</span>
                      </Link>

                      <Link
                        href="/dashboard/account"
                        onClick={() => setShowAuthMenu(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-inset)] transition-all"
                      >
                        <User className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                        <span>Account Settings</span>
                      </Link>
                    </div>

                    <div className="border-t border-[var(--border)] my-1" />

                    {/* Sign Out */}
                    <button
                      onClick={async () => {
                        setShowAuthMenu(false);
                        try {
                          await signOut();
                          toast.success('Signed out successfully');
                          router.push('/');
                        } catch (err: any) {
                          toast.error(err.message || 'Failed to sign out');
                        }
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-all w-full text-left cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link
                href="/login"
                title="Sign In"
                className="h-8.5 sm:h-9 px-2.5 sm:px-3 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface-inset)] border border-[var(--border)] text-xs font-bold text-[var(--text-primary)] shadow-sm active:scale-95 transition-all flex items-center gap-1.5 flex-shrink-0"
              >
                <User className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Join / Claim Trip Modal */}
      {trip && (
        <JoinTripModal
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
          initialSlug={trip.slug}
        />
      )}
    </header>
  );
}
