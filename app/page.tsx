'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Compass, 
  Sparkles, 
  Wallet, 
  Camera, 
  ArrowRight, 
  Flame,
  Plus,
  ShieldCheck,
  QrCode
} from 'lucide-react';
import { toast } from 'sonner';

export default function HomePage() {
  const router = useRouter();
  const [tripSlug, setTripSlug] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const lastTrip = localStorage.getItem('tripmate_last_trip');
    if (lastTrip) {
      router.replace(`/trip/${lastTrip}`);
    }
  }, [router]);

  const handleJoinTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripSlug.trim()) {
      toast.error('Please enter a trip code or name');
      return;
    }
    const cleanSlug = tripSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

    try {
      setIsJoining(true);
      const res = await fetch(`/api/trips/${cleanSlug}`);
      if (res.ok) {
        localStorage.setItem('tripmate_last_trip', cleanSlug);
        toast.success('Joining trip...');
        router.push(`/trip/${cleanSlug}`);
      } else {
        toast.error('Trip not found. Double check your trip code.');
      }
    } catch {
      toast.error('Could not connect to server');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'var(--background)' }}>
      {/* Top Header */}
      <header className="relative z-30 max-w-7xl mx-auto w-full px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md"
            style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)' }}
          >
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-outfit font-black text-xl tracking-tight text-[var(--text-primary)]">
              Trip<span style={{ color: 'var(--accent)' }}>Mate</span>
            </span>
            <div className="text-[9px] font-mono tracking-widest text-[var(--text-muted)] uppercase -mt-0.5">
              Trip Operating System
            </div>
          </div>
        </div>

        <Link
          href="/create"
          className="px-4 py-2 rounded-xl text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
          style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)' }}
        >
          <Plus className="w-4 h-4" /> Start New Trip
        </Link>
      </header>

      {/* Hero Content */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 md:px-6 py-10 max-w-5xl mx-auto w-full text-center">
        {/* Top Feature Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-inset)] shadow-[var(--shadow-inset)] mb-6"
        >
          <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
          <span className="text-xs font-bold text-[var(--text-secondary)] font-outfit">
            Next-Gen Group Travel & Financial Operating System
          </span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold font-outfit tracking-tight leading-[1.1] text-[var(--text-primary)] max-w-4xl"
        >
          Travel together. <br className="hidden sm:inline" />
          <span style={{ color: 'var(--accent)' }}>Split seamlessly.</span> Vault memories.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-sm sm:text-base md:text-lg text-[var(--text-secondary)] max-w-2xl mt-4 leading-relaxed font-normal"
        >
          Precision expense splitting with 1-tap custom UPI QR settlements, zero-compression photo vault, simplified pairwise debts, and dynamic Analytics.
        </motion.p>

        {/* Action Panel Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full max-w-md mt-8 p-5 sm:p-6 rounded-3xl raised-card text-left space-y-4"
        >
          <Link
            href="/create"
            className="w-full py-3.5 px-6 rounded-2xl text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 group transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)', boxShadow: '0 8px 25px rgba(43,86,255,0.35)' }}
          >
            <span>Start a New Trip</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <div className="relative flex items-center justify-center my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <span className="relative px-3 bg-[var(--surface-raised)] text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest font-mono">
              or join an existing trip
            </span>
          </div>

          <form onSubmit={handleJoinTrip} className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
              Enter Trip Code / Slug
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. diveagar-boiss-v0ak"
                value={tripSlug}
                onChange={(e) => setTripSlug(e.target.value)}
                className="flex-1 inset-field px-3.5 py-2.5 text-xs font-mono font-semibold text-[var(--text-primary)]"
              />
              <button
                type="submit"
                disabled={isJoining}
                className="px-4 py-2.5 rounded-xl bg-[var(--surface-inset)] hover:bg-[var(--surface-raised)] border border-[var(--border)] text-xs font-bold text-[var(--text-primary)] transition-all active:scale-95 disabled:opacity-50"
              >
                {isJoining ? 'Joining...' : 'Enter →'}
              </button>
            </div>
          </form>
        </motion.div>

        {/* 3 Key Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl w-full mt-12 text-left"
        >
          <div className="raised-card p-5 space-y-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm text-[var(--text-primary)] font-outfit">Smart Split & Custom UPI</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Itemized, percentage & custom splits with instant 1-tap QR code settlements for any custom amount.
            </p>
          </div>

          <div className="raised-card p-5 space-y-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm text-[var(--text-primary)] font-outfit">Original Quality Memories</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              High-res media vault with member filter, auto-scroll previews, and 1-click batch downloads.
            </p>
          </div>

          <div className="raised-card p-5 space-y-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm text-[var(--text-primary)] font-outfit">Trip Analytics & Pulse</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Spending velocity graphs, member spending stats, category breakdown, and full timeline log.
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-6 text-center text-xs text-[var(--text-muted)] border-t border-[var(--border)] mt-auto">
        <p className="font-mono">TripMate © 2026 · Group Travel & Financial OS</p>
      </footer>
    </div>
  );
}
