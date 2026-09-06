'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Compass, 
  MapPin, 
  Calendar, 
  Users, 
  UserPlus, 
  Smartphone, 
  ArrowLeft, 
  ArrowRight, 
  Sparkles,
  Trash2,
  CheckCircle2,
  Check
} from 'lucide-react';
import { toast } from 'sonner';

const MEMBER_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f97316', 
  '#10b981', '#06b6d4', '#eab308', '#ef4444', 
  '#84cc16', '#f43f5e', '#14b8a6', '#a855f7'
];

export default function CreateTripPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  const [tripData, setTripData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
  });

  const [members, setMembers] = useState([
    { name: '', upi_id: '', color: MEMBER_COLORS[0] },
    { name: '', upi_id: '', color: MEMBER_COLORS[1] },
    { name: '', upi_id: '', color: MEMBER_COLORS[2] },
  ]);

  const addMember = () => {
    const nextColor = MEMBER_COLORS[members.length % MEMBER_COLORS.length];
    setMembers((m) => [...m, { name: '', upi_id: '', color: nextColor }]);
  };

  const removeMember = (index: number) => {
    if (members.length <= 1) {
      toast.error('You need at least one crew member');
      return;
    }
    setMembers((m) => m.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, key: string, value: string) => {
    setMembers((m) =>
      m.map((mem, i) => (i === index ? { ...mem, [key]: value } : mem))
    );
  };

  const handleNextStep = () => {
    if (!tripData.name.trim()) {
      toast.error('Please enter your trip name');
      return;
    }
    setStep(2);
  };

  const handleCreate = async () => {
    const validMembers = members.filter((m) => m.name.trim());
    if (validMembers.length === 0) {
      toast.error('Please add at least one member name');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trip: tripData, members: validMembers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create trip');

      localStorage.setItem('tripmate_last_trip', data.slug);
      toast.success('Trip created successfully! Welcome to TripMate 🎉');
      router.push(`/trip/${data.slug}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050711] text-slate-100 flex flex-col relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] left-[20%] w-[45vw] h-[45vw] rounded-full bg-indigo-600/15 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] w-[45vw] h-[45vw] rounded-full bg-cyan-500/15 blur-[130px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-30 max-w-4xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-semibold">Back to Home</span>
        </Link>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
            step === 1 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-white/5 text-slate-400'
          }`}>
            1. Trip Info
          </div>
          <span className="text-slate-600">•</span>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
            step === 2 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-white/5 text-slate-400'
          }`}>
            2. Crew & UPI
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-20 flex-1 max-w-xl mx-auto w-full px-4 sm:px-6 py-4 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-6 sm:p-8 rounded-3xl glass-panel space-y-6"
            >
              <div>
                <span className="text-xs font-bold font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Step 1 of 2
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-outfit text-white tracking-tight">
                  Where are you heading?
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Name your adventure and set your dates.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                    Trip Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Diveagar Weekend Getaway"
                      value={tripData.name}
                      onChange={(e) => setTripData({ ...tripData, name: e.target.value })}
                      className="w-full rounded-2xl glass-input pl-10 pr-4 py-3 text-sm font-medium"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                    Description / Vibe (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Beach, seafood shacks, bikes & bonfire night!"
                    value={tripData.description}
                    onChange={(e) => setTripData({ ...tripData, description: e.target.value })}
                    className="w-full rounded-2xl glass-input px-4 py-2.5 text-xs text-slate-200 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1.5 block flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Start Date
                    </label>
                    <input
                      type="date"
                      value={tripData.start_date}
                      onChange={(e) => setTripData({ ...tripData, start_date: e.target.value })}
                      className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1.5 block flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" /> End Date
                    </label>
                    <input
                      type="date"
                      value={tripData.end_date}
                      onChange={(e) => setTripData({ ...tripData, end_date: e.target.value })}
                      className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                <span>Continue to Crew Setup</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 sm:p-8 rounded-3xl glass-panel space-y-6"
            >
              <div>
                <span className="text-xs font-bold font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-1.5 mb-1.5">
                  <Users className="w-3.5 h-3.5" /> Step 2 of 2
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-outfit text-white tracking-tight">
                  Assemble the Crew
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Add everyone on the trip with their names and UPI handles.
                </p>
              </div>

              {/* Members input list */}
              <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                {members.map((member, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 relative group"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar initial with color */}
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-md flex-shrink-0"
                        style={{ backgroundColor: member.color || MEMBER_COLORS[idx % MEMBER_COLORS.length] }}
                      >
                        {member.name ? member.name[0]?.toUpperCase() : (idx + 1)}
                      </div>

                      <input
                        type="text"
                        placeholder={`Friend ${idx + 1} Name`}
                        value={member.name}
                        onChange={(e) => updateMember(idx, 'name', e.target.value)}
                        className="flex-1 rounded-xl bg-transparent border-none text-sm font-semibold text-white placeholder-slate-500 focus:outline-none"
                      />

                      {members.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMember(idx)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                      <Smartphone className="w-3.5 h-3.5 text-slate-400 ml-1 flex-shrink-0" />
                      <input
                        type="text"
                        placeholder="UPI ID (optional, e.g. alex@okaxis)"
                        value={member.upi_id}
                        onChange={(e) => updateMember(idx, 'upi_id', e.target.value)}
                        className="flex-1 bg-transparent text-xs font-mono text-cyan-300 placeholder-slate-600 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addMember}
                className="w-full py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-dashed border-white/15 text-xs font-semibold text-cyan-400 flex items-center justify-center gap-2 transition-colors"
              >
                <UserPlus className="w-4 h-4" /> Add Another Member
              </button>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-3 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={loading}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? 'Creating Trip OS...' : '🚀 Launch Trip OS'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
