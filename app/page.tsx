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
  ShieldCheck, 
  ArrowRight, 
  Users, 
  QrCode,
  Flame,
  Zap,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { WaveBackground } from '@/components/shared/WaveBackground';
import { MountainBackground } from '@/components/shared/MountainBackground';
import { createClient } from '@/lib/supabase/client';
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
        toast.error('Trip not found. Double check your trip code or URL.');
      }
    } catch (err) {
      toast.error('Could not connect to server');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050711] text-slate-100 flex flex-col relative overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/15 blur-[140px] pointer-events-none animate-pulse-glow" />
      <div className="absolute top-[20%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-cyan-500/15 blur-[130px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-[-10%] left-[20%] w-[60vw] h-[40vw] rounded-full bg-fuchsia-600/10 blur-[150px] pointer-events-none" />

      {/* Top Navigation */}
      <header className="relative z-30 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 via-indigo-600 to-fuchsia-500 p-[1px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#070914] rounded-[15px] flex items-center justify-center">
              <Compass className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <span className="font-outfit font-black text-xl tracking-tight text-white">
              Trip<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Mate</span>
            </span>
            <div className="text-[9px] font-mono tracking-widest text-cyan-400/80 uppercase -mt-1">
              Trip Operating System
            </div>
          </div>
        </div>

        <Link
          href="/create"
          className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-slate-200 hover:text-white transition-all backdrop-blur-md"
        >
          New Trip +
        </Link>
      </header>

      {/* Hero Section */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 md:px-6 py-12 max-w-5xl mx-auto w-full text-center">
        {/* Top Feature Pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 backdrop-blur-xl mb-6 shadow-inner"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-semibold text-cyan-300">Shared OS for Group Trips & Friends</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold font-outfit tracking-tight leading-[1.08] max-w-4xl"
        >
          Travel together. <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-fuchsia-400">
            Split seamlessly.
          </span>{' '}
          Vault memories.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-sm md:text-lg text-slate-400 max-w-2xl mt-4 leading-relaxed font-normal"
        >
          Precision expense splitting with 1-tap UPI settlements, high-res original quality photo vault, real-time debt simplification, and dynamic Trip Pulse insights.
        </motion.p>

        {/* Action Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full max-w-md mt-8 p-3 sm:p-4 rounded-3xl glass-panel relative"
        >
          <Link
            href="/create"
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2 group transition-all active:scale-[0.99]"
          >
            <span>Start a New Trip</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <div className="relative flex items-center justify-center my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <span className="relative px-3 bg-[#0c1021] text-[11px] font-semibold text-slate-400 uppercase tracking-widest rounded-full">
              or join existing trip
            </span>
          </div>

          <form onSubmit={handleJoinTrip} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. diveagar-boiss-v0ak"
              value={tripSlug}
              onChange={(e) => setTripSlug(e.target.value)}
              className="flex-1 rounded-xl glass-input px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono"
            />
            <button
              type="submit"
              disabled={isJoining}
              className="px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-xs font-semibold text-white transition-colors"
            >
              {isJoining ? 'Joining...' : 'Enter →'}
            </button>
          </form>
        </motion.div>

        {/* 3 Key Pillars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl w-full mt-14 text-left"
        >
          <div className="p-5 rounded-2xl glass-panel glass-panel-hover">
            <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/25 flex items-center justify-center text-pink-400 mb-3.5">
              <Wallet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Smart Split & UPI Settle</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Equal, exact, percentage & shares splits. Greedy algorithm simplifies debts for 1-tap UPI payouts.
            </p>
          </div>

          <div className="p-5 rounded-2xl glass-panel glass-panel-hover">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center text-cyan-400 mb-3.5">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Original Quality Vault</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Zero compression high-res photo/video storage with member tagging, themed albums & batch ZIP downloads.
            </p>
          </div>

          <div className="p-5 rounded-2xl glass-panel glass-panel-hover">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400 mb-3.5">
              <Flame className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Live Trip Pulse AI</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Real-time group stats, spend leaderboard, spending velocity graphs, and fun trip superlatives.
            </p>
          </div>
        </motion.div>
      </main>

      {/* Horizon Art at bottom */}
      <div className="relative w-full h-36 mt-auto pointer-events-none opacity-40">
        <WaveBackground className="absolute inset-0" />
        <MountainBackground className="absolute bottom-0 left-0 right-0 h-28" />
      </div>
    </div>
  );
}
