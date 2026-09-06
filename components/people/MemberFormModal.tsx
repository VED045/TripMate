'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, UserPlus, Sparkles, Smartphone, Check } from 'lucide-react';
import { toast } from 'sonner';

interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  onSuccess: () => void;
}

const MEMBER_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f97316', 
  '#10b981', '#06b6d4', '#eab308', '#ef4444', 
  '#84cc16', '#f43f5e', '#14b8a6', '#a855f7'
];

export function MemberFormModal({
  isOpen,
  onClose,
  tripId,
  onSuccess,
}: MemberFormModalProps) {
  const [name, setName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [selectedColor, setSelectedColor] = useState(MEMBER_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a name');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: tripId,
          name: name.trim(),
          upi_id: upiId.trim() || undefined,
          color: selectedColor,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add member');
      }

      toast.success(`${name.trim()} added to the crew!`);
      onSuccess();
      onClose();
      setName('');
      setUpiId('');
    } catch (err: unknown) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Error adding member');
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
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-outfit text-white">Add Crew Member</h2>
              <p className="text-xs text-slate-400">Invite a friend to split & share</p>
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
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Name</label>
            <input
              type="text"
              placeholder="e.g. Alex"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/10 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">UPI ID (Optional for fast settlements)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Smartphone className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="e.g. name@okhdfcbank"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10 focus:border-cyan-400 rounded-xl pl-9 pr-3.5 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-2 block">Avatar Color</label>
            <div className="flex flex-wrap gap-2">
              {MEMBER_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-md"
                  style={{ backgroundColor: c }}
                >
                  {selectedColor === c && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 hover:from-indigo-600 hover:to-cyan-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/20 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Adding...' : 'Add to Trip'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
