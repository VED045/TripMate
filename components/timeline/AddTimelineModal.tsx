'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface AddTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  onSuccess: () => void;
}

const EMOJI_OPTIONS = ['✨', '🏖️', '⛰️', '🍕', '🍻', '🚗', '✈️', '🎉', '🌅', '📸', '🔥', '🛵'];

export function AddTimelineModal({
  isOpen,
  onClose,
  tripId,
  onSuccess,
}: AddTimelineModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('✨');
  const [eventTime, setEventTime] = useState(new Date().toISOString().slice(0, 16));
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a moment title');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: tripId,
          title: title.trim(),
          description: description.trim() || undefined,
          icon,
          event_time: new Date(eventTime).toISOString(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add timeline moment');
      }

      toast.success('Moment added to trip timeline!');
      onSuccess();
      onClose();
      setTitle('');
      setDescription('');
    } catch (err: unknown) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Error adding moment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl relative my-8"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-outfit text-white">Add Trip Moment</h2>
              <p className="text-xs text-slate-400">Pin a memory to the chronological timeline</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Moment Title</label>
            <input
              type="text"
              placeholder="e.g. Watched sunset at Chapora Fort"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/10 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Story / Note (Optional)</label>
            <textarea
              rows={3}
              placeholder="Describe what happened..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/10 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Emoji selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-2 block">Choose Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  type="button"
                  key={e}
                  onClick={() => setIcon(e)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-transform hover:scale-110 ${
                    icon === e ? 'bg-amber-500/30 border border-amber-500' : 'bg-white/[0.04] border border-white/5'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Time & Date</label>
            <input
              type="datetime-local"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              className="w-full bg-slate-800 border border-white/10 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-bold text-sm shadow-xl shadow-amber-500/20 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Pin to Timeline'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
