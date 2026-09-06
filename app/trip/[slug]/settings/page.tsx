'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Download,
  Trash2,
  Cloud,
  Database,
  ShieldAlert,
  Save,
  Share2,
  Users,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { useActiveTrip } from '@/components/shared/ActiveTripContext';
import { TripHeader } from '@/components/shared/TripHeader';
import { MemberFormModal } from '@/components/people/MemberFormModal';
import { toast } from 'sonner';

export default function SettingsPage() {
  const router = useRouter();
  const { trip, members, refreshTrip } = useActiveTrip();

  const [name, setName] = useState(trip?.name || '');
  const [description, setDescription] = useState(trip?.description || '');
  const [startDate, setStartDate] = useState(trip?.start_date || '');
  const [endDate, setEndDate] = useState(trip?.end_date || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  if (!trip) return null;

  const handleSaveTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const res = await fetch(`/api/trips/${trip.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          start_date: startDate || null,
          end_date: endDate || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to update trip');
      toast.success('Trip settings updated!');
      refreshTrip();
    } catch (err: unknown) {
      toast.error('Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTrip = async () => {
    const confirmation = prompt(`To delete this trip permanently, type "${trip.name}" below:`);
    if (confirmation !== trip.name) {
      toast.error('Trip name did not match. Deletion cancelled.');
      return;
    }

    try {
      const res = await fetch(`/api/trips/${trip.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete trip');
      toast.success('Trip deleted successfully');
      router.push('/');
    } catch (err) {
      toast.error('Failed to delete trip');
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <TripHeader title="Settings & Data Export" subtitle="Manage trip configuration, vault storage and backups" />

      <main className="max-w-4xl mx-auto w-full px-4 md:px-6 py-6 space-y-6">
        {/* General Settings Form */}
        <form onSubmit={handleSaveTrip} className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl space-y-4">
          <h3 className="text-base font-bold font-outfit text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-cyan-400" /> Trip Details
          </h3>

          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Trip Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 hover:from-indigo-600 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {/* Cloud & Storage Status
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl space-y-4">
          <h3 className="text-base font-bold font-outfit text-white flex items-center gap-2">
            <Cloud className="w-4 h-4 text-cyan-400" /> Storage Architecture & Cloud Backups
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold">
                <Cloud className="w-4 h-4" /> Cloudinary Media Vault
              </div>
              <p className="text-slate-400">Cloud Name: <strong className="text-slate-200">dgxdwpppt</strong></p>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> High-res photo & video storage active
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                <Database className="w-4 h-4" /> Supabase Database & Auth
              </div>
              <p className="text-slate-400">Host: <strong className="text-slate-200">mvpamkktglxmbvraowvh</strong></p>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> PostgreSQL + Row Level Security active
              </span>
            </div>
          </div>
        </div> */}

        {/* Data Export Card */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl space-y-3">
          <h3 className="text-base font-bold font-outfit text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-400" /> Export Trip Data & Backups
          </h3>
          <p className="text-xs text-slate-400">
            Export all expense sheets, crew settlements, timeline events, and media metadata in standard formats.
          </p>

          <div className="flex flex-wrap gap-2.5 pt-2">
            <a
              href={`/api/export?trip_id=${trip.id}&format=csv`}
              className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-400" /> Export Expenses (CSV)
            </a>

            <a
              href={`/api/export?trip_id=${trip.id}&format=json`}
              className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4 text-cyan-400" /> Export Full Trip Data (JSON)
            </a>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="p-6 rounded-3xl bg-rose-950/20 border border-rose-500/20 backdrop-blur-xl space-y-3">
          <h3 className="text-base font-bold font-outfit text-rose-400 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> Danger Zone
          </h3>
          <p className="text-xs text-slate-400">
            Permanently delete this trip along with all expenses, settlement records, and timeline milestones.
          </p>

          <button
            type="button"
            onClick={handleDeleteTrip}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg shadow-rose-600/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <Trash2 className="w-4 h-4" /> Delete Trip Permanently
          </button>
        </div>
      </main>

      <MemberFormModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        tripId={trip.id}
        onSuccess={refreshTrip}
      />
    </div>
  );
}
