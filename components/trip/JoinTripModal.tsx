'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserCheck,
  UserPlus,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Search,
} from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GradientButton } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/lib/auth/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Trip, Member } from '@/types';
import { TripMateMark } from '@/components/shared/TripMateMark';

interface JoinTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSlug?: string;
  onJoined?: (trip: Trip, member: Member) => void;
}

const MEMBER_COLORS = [
  '#2b56ff', '#10b981', '#f59e0b', '#ec4899',
  '#8b5cf6', '#06b6d4', '#f43f5e', '#14b8a6',
];

export function JoinTripModal({
  isOpen,
  onClose,
  initialSlug = '',
  onJoined,
}: JoinTripModalProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [slug, setSlug] = useState(initialSlug);
  const [isSearching, setIsSearching] = useState(false);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<Member[]>([]);

  // Join mode: 'existing' vs 'new'
  const [joinMode, setJoinMode] = useState<'existing' | 'new'>('existing');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');

  // New member form
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(MEMBER_COLORS[0]);
  const [newUpi, setNewUpi] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If initialSlug is given, search right away
  useEffect(() => {
    if (initialSlug && isOpen) {
      queueMicrotask(() => { void fetchTrip(initialSlug); });
    }
  }, [initialSlug, isOpen]);

  // Set default new member name from auth metadata
  useEffect(() => {
    if (user && !newName) {
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || '';
      if (name) queueMicrotask(() => setNewName(name));
    }
  }, [user]);

  async function fetchTrip(codeToSearch: string) {
    const clean = codeToSearch.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!clean) return;

    try {
      setIsSearching(true);
      const res = await fetch(`/api/trips/${clean}`);
      if (!res.ok) {
        toast.error('Trip not found. Please double check the code.');
        setTrip(null);
        setMembers([]);
        return;
      }
      const data = await res.json();
      setTrip(data.trip);
      const mList: Member[] = data.members || [];
      setMembers(mList);

      // Auto-suggest existing member if name matches user's name
      if (user && mList.length > 0) {
        const userEmailName = user.email?.split('@')[0].toLowerCase() || '';
        const userFullName = (user.user_metadata?.full_name || '').toLowerCase();
        const matched = mList.find(m => {
          const mLower = m.name.toLowerCase();
          return (
            (userFullName && (mLower.includes(userFullName) || userFullName.includes(mLower))) ||
            (userEmailName && (mLower.includes(userEmailName) || userEmailName.includes(mLower)))
          );
        });
        if (matched) {
          setSelectedMemberId(matched.id);
        } else {
          setSelectedMemberId(mList[0]?.id || '');
        }
      } else if (mList.length > 0) {
        setSelectedMemberId(mList[0]?.id || '');
      }
    } catch {
      toast.error('Could not connect to server');
    } finally {
      setIsSearching(false);
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTrip(slug);
  };

  const handleJoinExisting = async () => {
    if (!trip || !selectedMemberId) {
      toast.error('Please select which person you are');
      return;
    }

    const member = members.find(m => m.id === selectedMemberId);
    if (!member) return;

    try {
      setIsSubmitting(true);

      // If user is logged in, link trip and member to user account
      if (user) {
        const claimRes = await fetch(`/api/trips/${trip.slug}/claim`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ member_id: member.id }),
        });
        if (!claimRes.ok) {
          const errData = await claimRes.json();
          throw new Error(errData.error || 'Could not link your identity');
        }
      }

      // Save identity locally so trip pages immediately know who you are
      localStorage.setItem('tripmate_last_trip', trip.slug);
      localStorage.setItem(`tripmate_active_member_${trip.slug}`, member.id);
      localStorage.setItem('tripmate_active_member', member.id);

      toast.success(`You joined as ${member.name}!`);
      if (onJoined) onJoined(trip, member);
      onClose();
      router.replace(`/trip/${trip.slug}`);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error connecting to trip');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip) return;
    if (!newName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: trip.id,
          name: newName.trim(),
          color: newColor,
          upi_id: newUpi.trim() || undefined,
          user_id: user?.id,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add member');
      }

      const newMember: Member = await res.json();

      // Save identity locally
      localStorage.setItem('tripmate_last_trip', trip.slug);
      localStorage.setItem(`tripmate_active_member_${trip.slug}`, newMember.id);
      localStorage.setItem('tripmate_active_member', newMember.id);

      toast.success(`Welcome to ${trip.name}, ${newMember.name}!`);
      if (onJoined) onJoined(trip, newMember);
      onClose();
      router.replace(`/trip/${trip.slug}`);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error adding member');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Join a Trip"
      subtitle="Connect as an existing member or join as a new person"
      maxHeight="90dvh"
    >
      <div className="p-5 space-y-4 pb-8">
        {/* Step 1: Find Trip if not loaded yet */}
        {!trip ? (
          <form onSubmit={handleSearchSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono mb-1.5">
                Trip Code or Link Slug
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. diveagar-boiss-v0ak"
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  className="flex-1 inset-field px-3.5 py-2.5 text-xs font-mono font-semibold"
                  autoFocus
                  required
                />
                <button
                  type="submit"
                  disabled={isSearching || !slug.trim()}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                  style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)' }}
                >
                  <Search className="w-3.5 h-3.5" />
                  {isSearching ? 'Finding...' : 'Find Trip'}
                </button>
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Ask your trip coordinator or friend for the trip link or code.
            </p>
          </form>
        ) : (
          /* Step 2: Trip found — Choose Member Identity */
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Trip Preview Banner */}
            <div className="p-3.5 rounded-2xl bg-[var(--surface-inset)] border border-[var(--border)] flex items-center justify-between gap-3 shadow-inner">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)' }}
                >
                  <TripMateMark className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-500 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                      Trip Found
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-[var(--text-primary)] font-outfit truncate mt-0.5">
                    {trip.name}
                  </h3>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono">
                    {members.length} members · {trip.currency}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTrip(null);
                  setMembers([]);
                }}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] border border-[var(--border)] transition-all flex-shrink-0 cursor-pointer shadow-sm active:scale-95"
              >
                Change
              </button>
            </div>

            {/* Mode Toggle: Existing Member vs New Person */}
            <div className="flex gap-1.5 p-1 rounded-2xl bg-[var(--surface-inset)]">
              <button
                type="button"
                onClick={() => setJoinMode('existing')}
                className={cn(
                  'flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5',
                  joinMode === 'existing'
                    ? 'bg-[var(--surface-raised)] text-[var(--accent)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                )}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>I&apos;m Already in this Trip</span>
              </button>

              <button
                type="button"
                onClick={() => setJoinMode('new')}
                className={cn(
                  'flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5',
                  joinMode === 'new'
                    ? 'bg-[var(--surface-raised)] text-[var(--accent)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                )}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Join as New Person</span>
              </button>
            </div>

            {/* Mode A: Select Existing Member */}
            {joinMode === 'existing' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
                    Select Your Name in this Trip
                  </label>
                  {user && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                      Will link to {user.email?.split('@')[0]}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {members.map(m => {
                    const isSelected = selectedMemberId === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setSelectedMemberId(m.id)}
                        className={cn(
                          'p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between',
                          isSelected
                            ? 'bg-[var(--accent-subtle)] border-[var(--accent)] shadow-sm scale-[1.01]'
                            : 'bg-[var(--surface-raised)] border-[var(--border)] hover:bg-[var(--surface-inset)] opacity-80'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar name={m.name} color={m.color} size="md" />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-[var(--text-primary)] block truncate font-outfit">
                              {m.name}
                            </span>
                            {m.upi_id && (
                              <span className="text-[10px] text-[var(--text-muted)] font-mono block truncate">
                                {m.upi_id}
                              </span>
                            )}
                          </div>
                        </div>

                        {isSelected && (
                          <div className="flex items-center gap-1 text-[var(--accent)] flex-shrink-0">
                            <span className="text-[10px] font-bold font-mono">It&apos;s Me</span>
                            <CheckCircle2 className="w-4 h-4 fill-[var(--accent)] text-white" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={!selectedMemberId || isSubmitting}
                  onClick={handleJoinExisting}
                  className="w-full py-3.5 px-5 rounded-2xl font-bold text-sm text-white shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #2b56ff, #163ecf)',
                    boxShadow: '0 6px 20px rgba(43, 86, 255, 0.35)',
                    color: '#ffffff',
                  }}
                >
                  {isSubmitting ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Continue as {members.find(m => m.id === selectedMemberId)?.name || 'Selected Member'}</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Mode B: Join as New Person */}
            {joinMode === 'new' && (
              <form onSubmit={handleJoinNew} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full inset-field px-3.5 py-2.5 text-xs font-semibold"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono mb-1.5">
                    Pick an Avatar Color
                  </label>
                  <div className="flex gap-2">
                    {MEMBER_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewColor(c)}
                        className={`w-7 h-7 rounded-xl transition-all ${
                          newColor === c ? 'scale-110 ring-2 ring-offset-2 ring-[var(--accent)] shadow-md' : 'opacity-70'
                        }`}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono mb-1">
                    UPI ID (for receiving settlements, optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. yourname@okhdfcbank"
                    value={newUpi}
                    onChange={e => setNewUpi(e.target.value)}
                    className="w-full inset-field px-3.5 py-2.5 text-xs font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!newName.trim() || isSubmitting}
                  className="w-full py-3.5 px-5 rounded-2xl font-bold text-sm text-white shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
                    color: '#ffffff',
                  }}
                >
                  {isSubmitting ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 text-white" />
                      <span>Add Me to Trip as {newName || 'New Person'}</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
