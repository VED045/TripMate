'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Sparkles,
  Wallet,
  Camera,
  ArrowRight,
  Plus,
  LayoutDashboard,
  Globe,
  Plane,
  MapPin,
  Check,
  QrCode,
  Heart,
  Zap,
  Download,
  Users,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth/AuthContext';
import { JoinTripModal } from '@/components/trip/JoinTripModal';
import { TripMateMark } from '@/components/shared/TripMateMark';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const [tripSlug, setTripSlug] = useState('');
  const [recentTrip, setRecentTrip] = useState<string | null>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinModalSlug, setJoinModalSlug] = useState('');
  const [heroMode, setHeroMode] = useState<'plan' | 'split' | 'remember'>('split');

  // Interactive Demo State for "Plan" tab
  const [packingItems, setPackingItems] = useState([
    { id: 1, text: 'Sunscreen & beach towels', done: true, tag: 'Beach' },
    { id: 2, text: 'Car rental agreement & driving licence', done: true, tag: 'Transit' },
    { id: 3, text: 'First-aid kit & electrolytes', done: false, tag: 'Health' },
    { id: 4, text: 'GoPro & waterproof housing', done: false, tag: 'Gear' },
  ]);

  // Interactive Demo State for "Split" tab
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [showSimulatedQr, setShowSimulatedQr] = useState(false);
  const [isSettled, setIsSettled] = useState(false);

  // Interactive Demo State for "Remember" tab
  const [likedPhotos, setLikedPhotos] = useState<Record<string, { liked: boolean; count: number }>>({
    cliff: { liked: true, count: 14 },
    waterfall: { liked: false, count: 9 },
    cafe: { liked: true, count: 21 },
  });

  useEffect(() => {
    try {
      const lastTrip = localStorage.getItem('tripmate_last_trip');
      if (lastTrip) {
        queueMicrotask(() => setRecentTrip(lastTrip));
      }
    } catch {
      // ignore localStorage errors
    }
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      router.refresh();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error signing out');
    }
  };

  const handleJoinTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripSlug.trim()) {
      toast.error('Please enter a trip code or slug');
      return;
    }
    const cleanSlug = tripSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    setJoinModalSlug(cleanSlug);
    setIsJoinModalOpen(true);
  };

  const togglePackingItem = (id: number) => {
    setPackingItems(prev =>
      prev.map(item => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const togglePhotoLike = (key: string) => {
    setLikedPhotos(prev => {
      const current = prev[key];
      const newLiked = !current.liked;
      return {
        ...prev,
        [key]: {
          liked: newLiked,
          count: newLiked ? current.count + 1 : current.count - 1,
        },
      };
    });
  };

  const completedPackingCount = packingItems.filter(i => i.done).length;

  return (
    <div className="tripmate-landing min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'var(--background)' }}>
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl border-b border-[var(--border)]" style={{ background: 'var(--surface-overlay)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)' }}
            >
              <TripMateMark className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <span className="font-outfit font-black text-lg sm:text-xl tracking-tight text-[var(--text-primary)]">
                Trip<span style={{ color: 'var(--accent)' }}>Mate</span>
              </span>
              <div className="text-[8.5px] font-mono tracking-widest text-[var(--text-muted)] uppercase -mt-0.5">
                Trip Operating System
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {authLoading ? (
              <div className="w-8 h-8 rounded-full bg-[var(--surface-inset)] animate-pulse" />
            ) : user ? (
              <>
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--surface-inset)] border border-[var(--border)] text-xs text-[var(--text-secondary)] font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="truncate max-w-[120px]">{user.email}</span>
                </div>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-inset)] transition-all"
                >
                  <LayoutDashboard className="w-4 h-4 text-[var(--accent)]" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/create"
                  className="px-3.5 py-2 rounded-xl text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)' }}
                >
                  <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">New Trip</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  title="Sign out of your account"
                  className="px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-all border border-rose-500/20 active:scale-95 cursor-pointer"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-inset)] transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[var(--accent)] hover:bg-[var(--surface-inset)] transition-all"
                >
                  Sign Up
                </Link>
                <Link
                  href="/create"
                  className="px-3.5 py-2 rounded-xl text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)' }}
                >
                  <Plus className="w-3.5 h-3.5" /> Start Trip
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-20 flex-1 flex flex-col items-center px-4 sm:px-6 py-8 sm:py-14 max-w-6xl mx-auto w-full text-center">
        {/* Top Feature Pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-raised)] shadow-sm mb-5"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#2b56ff]" />
          <span className="text-[11px] sm:text-xs font-bold text-[var(--text-secondary)] font-outfit">
            Next-Gen Group Travel &amp; Financial Operating System
          </span>
          <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </motion.div>

        {/* Hero Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-black font-outfit tracking-tight leading-[1.08] text-[var(--text-primary)] max-w-4xl"
        >
          Travel together. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-[#2b56ff] via-[#4669fa] to-[#10b981] bg-clip-text text-transparent">
            Split seamlessly.
          </span>{' '}
          Vault memories.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-sm sm:text-base md:text-lg text-[var(--text-secondary)] max-w-2xl mt-4 sm:mt-5 leading-relaxed font-normal"
        >
          Algorithmic debt minimization with 1-tap custom UPI QR settlements, synchronized itineraries, packing checklists, and a zero-compression photo vault.
        </motion.p>

        {/* Quick Action Bar / Hub */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full max-w-xl mt-7 sm:mt-8 p-2 rounded-2xl sm:rounded-3xl raised-card"
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Link
              href="/create"
              className="flex-1 py-3 px-5 rounded-xl sm:rounded-2xl text-white font-bold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 group transition-all active:scale-[0.98] cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #2b56ff, #163ecf)',
                boxShadow: '0 8px 24px rgba(43,86,255,0.3)',
              }}
            >
              <Plus className="w-4 h-4" />
              <span>Start a New Trip</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <form onSubmit={handleJoinTrip} className="flex-1 flex gap-1.5">
              <input
                type="text"
                placeholder="Enter trip code (e.g. goa-2026)"
                value={tripSlug}
                onChange={(e) => setTripSlug(e.target.value)}
                className="flex-1 min-w-0 inset-field px-3 py-2.5 text-xs font-mono font-bold text-[var(--text-primary)] rounded-xl"
              />
              <button
                type="submit"
                className="px-3.5 py-2.5 rounded-xl bg-[var(--surface-inset)] hover:bg-[var(--surface-raised)] border border-[var(--border)] text-xs font-bold text-[var(--accent)] transition-all active:scale-95 cursor-pointer shrink-0"
              >
                Join →
              </button>
            </form>
          </div>

          {recentTrip && (
            <div className="mt-2 pt-2 border-t border-[var(--border)] flex items-center justify-between text-xs px-2">
              <span className="text-[var(--text-muted)] text-[11px] truncate">
                Recent trip: <strong className="text-[var(--text-primary)] font-mono">{recentTrip}</strong>
              </span>
              <Link
                href={`/trip/${recentTrip}`}
                className="text-[var(--accent)] text-[11px] font-bold hover:underline flex items-center gap-0.5 ml-2 shrink-0"
              >
                Resume Trip →
              </Link>
            </div>
          )}
        </motion.div>

        {/* Animated Flight Route Bridge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="tripmate-flight-map mt-8 mb-4"
          aria-label="Animated travel route"
        >
          <span className="tripmate-map-pin tripmate-map-pin-start">
            <MapPin />
          </span>
          <span className="tripmate-map-route" />
          <span className="tripmate-map-plane">
            <Plane />
          </span>
          <span className="tripmate-map-pin tripmate-map-pin-end">
            <MapPin />
          </span>
          <span className="tripmate-map-label tripmate-map-label-start">01 Plan</span>
          <span className="tripmate-map-label tripmate-map-label-end">02 Settle</span>
        </motion.div>

        {/* Interactive Live Demo Workspace Showcase */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="w-full max-w-4xl mt-4 rounded-3xl raised-card border border-[var(--border)] overflow-hidden shadow-2xl text-left"
        >
          {/* Showcase Control Bar */}
          <div className="p-3 sm:p-4 bg-[var(--surface-raised)] border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface-inset)] border border-[var(--border)]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Live Simulator
                </span>
              </div>
              <span className="text-xs font-bold text-[var(--text-primary)] font-outfit hidden sm:inline">
                Goa Monsoon Expedition 2026
              </span>
            </div>

            {/* Interactive Workflow Tabs */}
            <div className="flex items-center gap-1 bg-[var(--surface-inset)] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setHeroMode('plan')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  heroMode === 'plan'
                    ? 'bg-[#2b56ff] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>01 Plan</span>
              </button>
              <button
                type="button"
                onClick={() => setHeroMode('split')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  heroMode === 'split'
                    ? 'bg-[#10b981] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>02 Split &amp; UPI</span>
              </button>
              <button
                type="button"
                onClick={() => setHeroMode('remember')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  heroMode === 'remember'
                    ? 'bg-[#8b5cf6] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>03 Vault</span>
              </button>
            </div>
          </div>

          {/* Interactive Screen Container */}
          <div className="p-4 sm:p-6 bg-[var(--surface-inset)] min-h-[380px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {/* TAB 1: PLAN WORKFLOW */}
              {heroMode === 'plan' && (
                <motion.div
                  key="plan"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left: Crew & Live Itinerary */}
                    <div className="p-4 rounded-2xl bg-[var(--surface-raised)] border border-[var(--border)] space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#2b56ff]" />
                          <h4 className="text-xs font-bold text-[var(--text-primary)] font-outfit uppercase tracking-wider">
                            Crew Members (3)
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          Live Sync
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--surface-inset)] border border-[var(--border)] text-xs font-bold text-[var(--text-primary)]">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                          <span>Ved (You)</span>
                          <span className="text-[10px] text-amber-500 font-mono">👑</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--surface-inset)] border border-[var(--border)] text-xs font-bold text-[var(--text-primary)]">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <span>Kabir</span>
                          <span className="text-[9px] text-[var(--text-muted)] font-mono">Banker</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--surface-inset)] border border-[var(--border)] text-xs font-bold text-[var(--text-primary)]">
                          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                          <span>Ananya</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[var(--border)] space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                          <MapPin className="w-3.5 h-3.5 text-[#2b56ff]" />
                          <span>Current Waypoint: Vagator Sunset Deck</span>
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] pl-5.5">
                          Scheduled for 5:30 PM · 3 members checked in
                        </p>
                      </div>
                    </div>

                    {/* Right: Interactive Packing Checklist */}
                    <div className="p-4 rounded-2xl bg-[var(--surface-raised)] border border-[var(--border)] space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <h4 className="text-xs font-bold text-[var(--text-primary)] font-outfit uppercase tracking-wider">
                            Interactive Packing List
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-[var(--text-secondary)]">
                          {completedPackingCount}/{packingItems.length} packed
                        </span>
                      </div>

                      <p className="text-[11px] text-[var(--text-muted)]">
                        Tap an item below to check it off in real-time:
                      </p>

                      <div className="space-y-1.5">
                        {packingItems.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => togglePackingItem(item.id)}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                              item.done
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-[var(--surface-inset)] text-[var(--text-primary)] hover:bg-[var(--surface-overlay)] border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {item.done ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                              )}
                              <span className={`truncate ${item.done ? 'line-through opacity-80' : ''}`}>
                                {item.text}
                              </span>
                            </div>
                            <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--text-muted)] px-1.5 py-0.5 rounded bg-[var(--surface-raised)] shrink-0">
                              {item.tag}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: SPLIT & UPI WORKFLOW */}
              {heroMode === 'split' && (
                <motion.div
                  key="split"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left: Expense Breakdown */}
                    <div className="p-4 rounded-2xl bg-[var(--surface-raised)] border border-[var(--border)] space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                            Recent Group Expense
                          </span>
                          <h4 className="text-sm font-bold text-[var(--text-primary)] font-outfit mt-0.5">
                            Seaside Cliff Villa &amp; Seafood
                          </h4>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-black font-outfit text-[var(--text-primary)]">
                            ₹12,600
                          </span>
                          <p className="text-[9px] font-mono text-[var(--text-muted)]">Paid by Ved</p>
                        </div>
                      </div>

                      {/* Interactive Split Selector */}
                      <div className="p-1 rounded-xl bg-[var(--surface-inset)] flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSplitType('equal')}
                          className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                            splitType === 'equal'
                              ? 'bg-[var(--surface-raised)] text-[#2b56ff] shadow-sm'
                              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          Equal Split (₹4,200/ea)
                        </button>
                        <button
                          type="button"
                          onClick={() => setSplitType('custom')}
                          className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                            splitType === 'custom'
                              ? 'bg-[var(--surface-raised)] text-[#2b56ff] shadow-sm'
                              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          Custom Itemized
                        </button>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between items-center p-2 rounded-xl bg-[var(--surface-inset)]">
                          <span className="font-semibold text-[var(--text-secondary)]">Ved (Payer)</span>
                          <span className="font-mono font-bold text-emerald-500">
                            {splitType === 'equal' ? '+₹8,400 net' : '+₹8,100 net'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded-xl bg-[var(--surface-inset)]">
                          <span className="font-semibold text-[var(--text-secondary)]">Kabir</span>
                          <span className="font-mono font-bold text-rose-500">
                            {splitType === 'equal' ? '-₹4,200 owe' : '-₹4,500 owe'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded-xl bg-[var(--surface-inset)]">
                          <span className="font-semibold text-[var(--text-secondary)]">Ananya</span>
                          <span className="font-mono font-bold text-rose-500">
                            {splitType === 'equal' ? '-₹4,200 owe' : '-₹3,900 owe'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Instant UPI Settle Simulator */}
                    <div className="p-4 rounded-2xl bg-[var(--surface-raised)] border border-[var(--border)] flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Zap className="w-4 h-4 text-emerald-500" />
                            <h4 className="text-xs font-bold text-[var(--text-primary)] font-outfit uppercase tracking-wider">
                              1-Tap UPI Settlement
                            </h4>
                          </div>
                          <span className="text-[9px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                            0% Fee
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] mt-1">
                          Calculated via pairwise algorithmic debt simplification:
                        </p>
                      </div>

                      <div className="p-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-inset)] space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[var(--text-primary)]">Kabir owes Ved</span>
                          <span className="font-mono font-black text-sm text-[var(--text-primary)]">
                            {splitType === 'equal' ? '₹4,200' : '₹4,500'}
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-[var(--text-muted)]">
                          UPI ID: ved@okhdfcbank
                        </p>

                        {showSimulatedQr ? (
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-[var(--border)] flex flex-col items-center gap-1.5 text-center shadow-md"
                          >
                            {/* Realistic Simulated UPI QR code */}
                            <div className="w-24 h-24 p-1.5 bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                              <QrCode className="w-full h-full text-slate-900" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">
                              Scan with GPay · PhonePe · Paytm
                            </span>
                          </motion.div>
                        ) : null}
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowSimulatedQr(!showSimulatedQr)}
                          className="flex-1 py-2 px-3 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-inset)] text-xs font-bold text-[var(--text-primary)] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5 text-[#2b56ff]" />
                          <span>{showSimulatedQr ? 'Hide QR' : 'Simulate UPI QR'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsSettled(!isSettled);
                            toast.success(
                              isSettled
                                ? 'Settlement marked as pending'
                                : 'Payment simulated! ₹4,200 settled via UPI.'
                            );
                          }}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            isSettled
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isSettled ? 'Settled ✓' : 'Mark Paid'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 3: VAULT WORKFLOW */}
              {heroMode === 'remember' && (
                <motion.div
                  key="remember"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text-primary)] font-outfit uppercase tracking-wider">
                        Shared Photo Vault
                      </h4>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        Original lossless resolution · EXIF tagged · Downloadable in 1 click
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        toast.success('Simulated ZIP archive download started! 3 full-res photos included.')
                      }
                      className="px-3 py-1.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--surface-inset)] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5 text-[#8b5cf6]" />
                      <span>Download Archive</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Photo 1 */}
                    <div className="rounded-2xl bg-[var(--surface-raised)] border border-[var(--border)] overflow-hidden shadow-sm flex flex-col">
                      <div className="h-32 bg-gradient-to-tr from-amber-500/20 via-orange-500/20 to-rose-500/30 flex items-center justify-center relative">
                        <span className="text-3xl">🌅</span>
                        <button
                          type="button"
                          onClick={() => togglePhotoLike('cliff')}
                          className="absolute bottom-2 right-2 px-2 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        >
                          <Heart
                            className={`w-3 h-3 ${
                              likedPhotos.cliff.liked ? 'text-rose-500 fill-rose-500' : 'text-white'
                            }`}
                          />
                          <span>{likedPhotos.cliff.count}</span>
                        </button>
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-bold text-[var(--text-primary)]">Anjuna Sunset Rock</p>
                        <p className="text-[10px] text-[var(--text-muted)] font-mono">By Kabir · RAW 24MB</p>
                      </div>
                    </div>

                    {/* Photo 2 */}
                    <div className="rounded-2xl bg-[var(--surface-raised)] border border-[var(--border)] overflow-hidden shadow-sm flex flex-col">
                      <div className="h-32 bg-gradient-to-tr from-emerald-500/20 via-teal-500/20 to-cyan-500/30 flex items-center justify-center relative">
                        <span className="text-3xl">🌿</span>
                        <button
                          type="button"
                          onClick={() => togglePhotoLike('waterfall')}
                          className="absolute bottom-2 right-2 px-2 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        >
                          <Heart
                            className={`w-3 h-3 ${
                              likedPhotos.waterfall.liked ? 'text-rose-500 fill-rose-500' : 'text-white'
                            }`}
                          />
                          <span>{likedPhotos.waterfall.count}</span>
                        </button>
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-bold text-[var(--text-primary)]">Dudhsagar Trek</p>
                        <p className="text-[10px] text-[var(--text-muted)] font-mono">By Ved · 4K HDR</p>
                      </div>
                    </div>

                    {/* Photo 3 */}
                    <div className="rounded-2xl bg-[var(--surface-raised)] border border-[var(--border)] overflow-hidden shadow-sm flex flex-col">
                      <div className="h-32 bg-gradient-to-tr from-purple-500/20 via-indigo-500/20 to-blue-500/30 flex items-center justify-center relative">
                        <span className="text-3xl">☕</span>
                        <button
                          type="button"
                          onClick={() => togglePhotoLike('cafe')}
                          className="absolute bottom-2 right-2 px-2 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        >
                          <Heart
                            className={`w-3 h-3 ${
                              likedPhotos.cafe.liked ? 'text-rose-500 fill-rose-500' : 'text-white'
                            }`}
                          />
                          <span>{likedPhotos.cafe.count}</span>
                        </button>
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-bold text-[var(--text-primary)]">Fontainhas Latin Quarter</p>
                        <p className="text-[10px] text-[var(--text-muted)] font-mono">By Ananya · RAW 18MB</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>

        {/* 3 Step Feature Cards — Clicking any card switches the simulator above */}
        <section className="max-w-4xl w-full mt-10 text-left">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 mb-4 px-1">
            <div>
              <p className="text-[10px] font-bold tracking-[.16em] uppercase text-[var(--accent)] font-mono">
                Complete Travel Lifecycle
              </p>
              <h2 className="font-outfit font-extrabold text-xl text-[var(--text-primary)]">
                From first plan to final reimbursement.
              </h2>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">Tap any card to switch simulator mode</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 1 */}
            <motion.button
              type="button"
              onClick={() => setHeroMode('plan')}
              whileHover={{ y: -4 }}
              className={`p-5 rounded-2xl raised-card text-left transition-all cursor-pointer ${
                heroMode === 'plan' ? 'border-[#2b56ff] shadow-lg ring-1 ring-[#2b56ff]' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold text-[var(--text-muted)]">01 · ORGANIZE</span>
                <span className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </span>
              </div>
              <h3 className="text-sm font-extrabold font-outfit text-[var(--text-primary)]">
                Synchronized Plan &amp; Crew
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                Shared packing checklists, itineraries, and crew identity without mandatory signups.
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2b56ff] mt-3">
                {heroMode === 'plan' ? 'Active in demo' : 'Explore plan →'}
              </span>
            </motion.button>

            {/* Card 2 */}
            <motion.button
              type="button"
              onClick={() => setHeroMode('split')}
              whileHover={{ y: -4 }}
              className={`p-5 rounded-2xl raised-card text-left transition-all cursor-pointer ${
                heroMode === 'split' ? 'border-[#10b981] shadow-lg ring-1 ring-[#10b981]' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold text-[var(--text-muted)]">02 · SPLIT</span>
                <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </span>
              </div>
              <h3 className="text-sm font-extrabold font-outfit text-[var(--text-primary)]">
                Algorithmic UPI Splits
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                Itemized GST attribution, pairwise debt reduction, and custom QR codes for direct payouts.
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#10b981] mt-3">
                {heroMode === 'split' ? 'Active in demo' : 'Explore split →'}
              </span>
            </motion.button>

            {/* Card 3 */}
            <motion.button
              type="button"
              onClick={() => setHeroMode('remember')}
              whileHover={{ y: -4 }}
              className={`p-5 rounded-2xl raised-card text-left transition-all cursor-pointer ${
                heroMode === 'remember' ? 'border-[#8b5cf6] shadow-lg ring-1 ring-[#8b5cf6]' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold text-[var(--text-muted)]">03 · RELIVE</span>
                <span className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </span>
              </div>
              <h3 className="text-sm font-extrabold font-outfit text-[var(--text-primary)]">
                Lossless Photo Vault
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                Store uncompressed group photos, map locations to expenses, and download complete archives.
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8b5cf6] mt-3">
                {heroMode === 'remember' ? 'Active in demo' : 'Explore vault →'}
              </span>
            </motion.button>
          </div>
        </section>

        {/* Trust & Architecture Markers */}
        <section className="max-w-4xl w-full mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
          <div className="p-3.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)]">
            <span className="text-lg font-black font-outfit text-[#2b56ff] block">0%</span>
            <p className="text-xs font-bold text-[var(--text-primary)] mt-0.5">Platform Fees</p>
            <p className="text-[10px] text-[var(--text-muted)]">Direct peer-to-peer UPI</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)]">
            <span className="text-lg font-black font-outfit text-emerald-500 block">Exact</span>
            <p className="text-xs font-bold text-[var(--text-primary)] mt-0.5">Paise Math</p>
            <p className="text-[10px] text-[var(--text-muted)]">Zero rounding drift</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)]">
            <span className="text-lg font-black font-outfit text-[#8b5cf6] block">Lossless</span>
            <p className="text-xs font-bold text-[var(--text-primary)] mt-0.5">Original Media</p>
            <p className="text-[10px] text-[var(--text-muted)]">Never downscaled</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)]">
            <span className="text-lg font-black font-outfit text-amber-500 block">Offline</span>
            <p className="text-xs font-bold text-[var(--text-primary)] mt-0.5">Installable PWA</p>
            <p className="text-[10px] text-[var(--text-muted)]">Works in no-signal zones</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-6 text-center text-xs text-[var(--text-muted)] border-t border-[var(--border)] mt-auto bg-[var(--surface-raised)]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TripMateMark className="w-4 h-4 text-[var(--accent)]" />
            <span className="font-outfit font-bold text-[var(--text-primary)]">TripMate</span>
            <span>· Group Travel &amp; Financial OS</span>
          </div>
          <p className="font-mono text-[11px]">© 2026 TripMate · Fast, Private, Algorithmic</p>
        </div>
      </footer>

      {/* Join Trip Identity Modal */}
      <JoinTripModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        initialSlug={joinModalSlug}
      />
    </div>
  );
}
