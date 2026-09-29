'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Wallet,
  TrendingUp,
  Users,
  Clock,
  MapPin,
  ChevronRight,
  LogOut,
  Search,
  Sparkles,
  Globe,
  User,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { formatCurrencyWithCode } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { JoinTripModal } from '@/components/trip/JoinTripModal';
import { TripMateMark } from '@/components/shared/TripMateMark';

interface TripSummary {
  id: string;
  name: string;
  slug: string;
  currency: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  cover_image_url: string | null;
  created_at: string;
  member_count?: number;
  total_paise?: number;
  my_spent_paise?: number;
  user_role?: string;
}

type FilterTab = 'all' | 'active' | 'completed' | 'archived';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [totalStats, setTotalStats] = useState({
    totalTrips: 0,
    mySpent: 0,
    totalTripSpend: 0,
    currency: 'INR',
    activeTripCount: 0,
  });
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);

      const res = await fetch('/api/user/trips');
      if (res.ok) {
        const data = await res.json();
        setTrips(data.trips || []);
        if (data.stats) {
          setTotalStats(data.stats);
        }
      } else {
        setTrips([]);
      }
    } catch (err) {
      console.error('Failed to load user trips:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
      return;
    }
    if (user) queueMicrotask(() => { void fetchDashboardData(); });
  }, [user, authLoading, router, fetchDashboardData]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
    toast.success('Signed out successfully');
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Traveler';
  const primaryTrip = trips.find(trip => trip.status === 'active') ?? trips[0] ?? null;

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || trip.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)' }}>
            <TripMateMark className="w-7 h-7 text-white animate-pulse" />
          </div>
          <p className="text-sm text-[var(--text-muted)] font-medium">Loading your trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)]"
        style={{ background: 'color-mix(in srgb, var(--surface) 92%, transparent)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)' }}>
              <TripMateMark className="w-5 h-5 text-white" />
            </div>
            <span className="font-outfit font-black text-lg tracking-tight text-[var(--text-primary)]">
              Trip<span style={{ color: 'var(--accent)' }}>Mate</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/dashboard/account"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-[var(--surface-inset)] transition-all">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)' }}>
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-[var(--text-primary)] hidden sm:block truncate max-w-24">
                {displayName}
              </span>
            </Link>
            <button onClick={handleSignOut}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-light)] transition-all"
              title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-20">
        {/* Welcome + Stats */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">
                Welcome back 👋
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-outfit text-[var(--text-primary)] tracking-tight">
                {displayName}
              </h1>
            </div>
            <Link href="/create"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm text-white shadow-md transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)', boxShadow: '0 4px 14px rgba(43,86,255,0.35)' }}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Trip</span>
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Trips', value: totalStats.totalTrips, icon: '✈️', color: 'var(--accent)' },
              { label: 'Active Trips', value: totalStats.activeTripCount, icon: '🔥', color: 'var(--success)' },
              { label: 'My Spend', value: formatCurrencyWithCode(totalStats.mySpent, totalStats.currency), icon: '💰', color: '#f97316', isString: true },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="raised-card p-4 text-center"
              >
                <div className="text-xl mb-1">{stat.icon}</div>
                <div className="text-base sm:text-xl font-extrabold font-outfit" style={{ color: stat.color }}>
                  {stat.value}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] font-medium mt-0.5">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {primaryTrip && (
          <section className="raised-card p-4 sm:p-5 overflow-hidden relative" aria-label="Continue your trip">
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-[var(--accent)] opacity-[0.07]" />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-widest font-bold text-[var(--accent)] mb-1">Continue your journey</p>
                <h2 className="text-lg font-extrabold font-outfit text-[var(--text-primary)] truncate">{primaryTrip.name}</h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1 flex flex-wrap gap-x-3 gap-y-1">
                  <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {primaryTrip.member_count ?? 0} crew</span>
                  <span className="inline-flex items-center gap-1"><Wallet className="w-3.5 h-3.5" /> You paid {formatCurrencyWithCode(primaryTrip.my_spent_paise ?? 0, primaryTrip.currency)}</span>
                  <span className="inline-flex items-center gap-1 text-[var(--text-muted)]">Trip total {formatCurrencyWithCode(primaryTrip.total_paise ?? 0, primaryTrip.currency)}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link prefetch href={`/trip/${primaryTrip.slug}/money`} className="px-3 py-2 rounded-xl text-xs font-bold border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-inset)]">Money</Link>
                <Link prefetch href={`/trip/${primaryTrip.slug}`} className="px-4 py-2 rounded-xl text-xs font-bold text-white inline-flex items-center gap-1.5" style={{ background: 'var(--accent)' }}><TrendingUp className="w-3.5 h-3.5" /> Open trip</Link>
              </div>
            </div>
          </section>
        )}

        {/* My Trips Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold font-outfit text-[var(--text-primary)] flex items-center gap-2">
              <MapPin className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              My Trips
            </h2>
          </div>

          {/* Search + Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                id="trip-search"
                type="text"
                placeholder="Search trips..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="inset-field w-full pl-10 pr-4 py-2.5 text-sm"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {(['all', 'active', 'completed', 'archived'] as FilterTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={cn(
                    'flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all',
                    activeFilter === tab
                      ? 'text-white shadow-sm'
                      : 'text-[var(--text-muted)] bg-[var(--surface-inset)] hover:text-[var(--text-secondary)]'
                  )}
                  style={activeFilter === tab ? { background: 'linear-gradient(135deg, #2b56ff, #163ecf)' } : {}}
                >
                  {tab === 'all' ? '🌍 All' : tab === 'active' ? '🔥 Active' : tab === 'completed' ? '✅ Done' : '📦 Archived'}
                </button>
              ))}
            </div>
          </div>

          {/* Trip cards */}
          <AnimatePresence mode="popLayout">
            {filteredTrips.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="raised-card p-8 text-center space-y-3"
              >
                <div className="text-4xl">✈️</div>
                <p className="text-sm font-bold text-[var(--text-primary)] font-outfit">
                  {trips.length === 0 ? "No trips yet!" : "No trips found"}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {trips.length === 0
                    ? "Start by creating a new trip or join an existing one."
                    : "Try adjusting your search or filters."}
                </p>
                {trips.length === 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsJoinModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs border border-[var(--border)] bg-[var(--surface-raised)] hover:bg-[var(--surface-inset)] text-[var(--text-primary)] transition-all shadow-sm active:scale-95"
                    >
                      <Globe className="w-3.5 h-3.5 text-emerald-500" />
                      Join Existing Trip
                    </button>
                    <Link
                      href="/create"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow transition-all active:scale-95"
                      style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)' }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create New Trip
                    </Link>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="space-y-3">
                {filteredTrips.map((trip, i) => (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Link href={`/trip/${trip.slug}`}
                      className="raised-card p-4 flex items-center gap-4 hover:shadow-[var(--shadow-card-hover)] transition-all active:scale-[0.99] group block">
                      {/* Cover or icon */}
                      <div className="w-12 h-12 rounded-2xl flex-shrink-0 overflow-hidden"
                        style={{
                          background: trip.cover_image_url ? undefined : 'linear-gradient(135deg, #2b56ff22, #2b56ff44)',
                          border: '1px solid var(--border)',
                        }}>
                        {trip.cover_image_url ? (
                          <img src={trip.cover_image_url} alt={trip.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <MapPin className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-bold text-sm text-[var(--text-primary)] font-outfit truncate">
                            {trip.name}
                          </h3>
                          <StatusBadge status={trip.status} />
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {trip.member_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Wallet className="w-3 h-3" />
                            You paid {formatCurrencyWithCode(trip.my_spent_paise || 0, trip.currency)}
                          </span>
                          {trip.start_date && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(trip.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors flex-shrink-0" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick actions */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold font-outfit text-[var(--text-primary)] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/create"
              className="raised-card p-4 flex flex-col gap-2 hover:shadow-[var(--shadow-card-hover)] transition-all active:scale-[0.98]">
              <div className="w-8 h-8 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center">
                <Plus className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)] font-outfit">New Trip</p>
                <p className="text-[10px] text-[var(--text-muted)]">Plan a new adventure</p>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setIsJoinModalOpen(true)}
              className="raised-card p-4 flex flex-col gap-2 hover:shadow-[var(--shadow-card-hover)] transition-all active:scale-[0.98] text-left">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)] font-outfit">Join Trip</p>
                <p className="text-[10px] text-[var(--text-muted)]">Connect to existing trip</p>
              </div>
            </button>

            <Link href="/dashboard/account"
              className="raised-card p-4 flex flex-col gap-2 hover:shadow-[var(--shadow-card-hover)] transition-all active:scale-[0.98]">
              <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center">
                <User className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)] font-outfit">My Account</p>
                <p className="text-[10px] text-[var(--text-muted)]">Profile & settings</p>
              </div>
            </Link>

            <button
              onClick={handleSignOut}
              className="raised-card p-4 flex flex-col gap-2 hover:shadow-[var(--shadow-card-hover)] transition-all active:scale-[0.98] text-left">
              <div className="w-8 h-8 rounded-xl bg-rose-500/15 flex items-center justify-center">
                <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)] font-outfit">Sign Out</p>
                <p className="text-[10px] text-[var(--text-muted)]">Log out of account</p>
              </div>
            </button>
          </div>
        </div>
      </main>

      <JoinTripModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onJoined={() => fetchDashboardData()}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    active: { label: 'Active', color: 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30' },
    planning: { label: 'Planning', color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30' },
    completed: { label: 'Done', color: 'text-[var(--text-muted)] bg-[var(--surface-inset)]' },
    archived: { label: 'Archived', color: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30' },
  };
  const s = map[status] || map.active;
  return (
    <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${s.color}`}>
      {s.label}
    </span>
  );
}
