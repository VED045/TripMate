'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Wallet,
  Upload,
  Receipt,
  Users,
  Check,
  Percent,
  Divide,
  PieChart as PieIcon,
  Layers,
  Utensils,
  Car,
  Hotel,
  Sparkles,
  ShoppingBag,
  Ticket,
  Tag
} from 'lucide-react';
import type { Member, Category } from '@/types';
import { toast } from 'sonner';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', trip_id: null, name: 'Food & Dining', icon: '🍔', color: '#f97316', is_default: true, created_at: '' },
  { id: 'travel', trip_id: null, name: 'Travel & Fuel', icon: '🚗', color: '#06b6d4', is_default: true, created_at: '' },
  { id: 'stay', trip_id: null, name: 'Stay & Hotels', icon: '🏨', color: '#6366f1', is_default: true, created_at: '' },
  { id: 'activities', trip_id: null, name: 'Fun & Activities', icon: '🏖️', color: '#ec4899', is_default: true, created_at: '' },
  { id: 'groceries', trip_id: null, name: 'Groceries & Drinks', icon: '🛒', color: '#10b981', is_default: true, created_at: '' },
  { id: 'tickets', trip_id: null, name: 'Tickets & Passes', icon: '🎟️', color: '#eab308', is_default: true, created_at: '' },
  { id: 'other', trip_id: null, name: 'General / Other', icon: '💸', color: '#8b5cf6', is_default: true, created_at: '' },
];

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  members: Member[];
  categories?: Category[];
  currentMemberId?: string;
  onSuccess: () => void;
}

export function ExpenseFormModal({
  isOpen,
  onClose,
  tripId,
  members,
  categories,
  currentMemberId,
  onSuccess,
}: ExpenseFormModalProps) {
  const activeCategories = (categories && categories.length > 0) ? categories : DEFAULT_CATEGORIES;

  const [title, setTitle] = useState('');
  const [amountRupees, setAmountRupees] = useState('');
  const [paidBy, setPaidBy] = useState(currentMemberId || (members[0]?.id ?? ''));
  const [splitType, setSplitType] = useState<'equal' | 'exact' | 'percentage' | 'shares'>('equal');
  const [selectedMembers, setSelectedMembers] = useState<string[]>(members.map((m) => m.id));
  const [customSplits, setCustomSplits] = useState<{ [memberId: string]: string }>({});
  const [categoryId, setCategoryId] = useState<string>(activeCategories[0]?.id || 'food');
  const [note, setNote] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleMember = (memberId: string) => {
    if (selectedMembers.includes(memberId)) {
      if (selectedMembers.length > 1) {
        setSelectedMembers(selectedMembers.filter((id) => id !== memberId));
      } else {
        toast.error('At least one member must be in the split');
      }
    } else {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };

  const handleCustomSplitChange = (memberId: string, val: string) => {
    setCustomSplits((prev) => ({ ...prev, [memberId]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountRupees);
    if (!title.trim()) {
      toast.error('Please enter an expense title');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (selectedMembers.length === 0) {
      toast.error('Select at least one participant');
      return;
    }
    if (splitType !== 'equal') {
      const values = selectedMembers.map(
        (id) => parseFloat(customSplits[id] || '0') || 0
      );

      if (values.some((value) => value <= 0)) {
        toast.error('Enter a valid split value for every selected member');
        return;
      }

      if (splitType === 'exact') {
        const total = values.reduce((sum, value) => sum + value, 0);

        if (Math.abs(total - amount) > 0.01) {
          toast.error(
            `Exact split must total ₹${amount.toFixed(2)}. Currently ₹${total.toFixed(2)}.`
          );
          return;
        }
      }

      if (splitType === 'percentage') {
        const total = values.reduce((sum, value) => sum + value, 0);

        if (Math.abs(total - 100) > 0.01) {
          toast.error(
            `Percentages must total 100%. Currently ${total.toFixed(1)}%.`
          );
          return;
        }
      }
    }

    try {
      setIsSubmitting(true);

      // Prepare custom splits payload
      let splitsPayload: { member_id: string; value: number }[] | undefined;
      if (splitType !== 'equal') {
        splitsPayload = selectedMembers.map((id) => ({
          member_id: id,
          value: parseFloat(customSplits[id] || '0') || 0,
        }));
      }

      // Handle receipt upload if selected
      let receipt_url: string | undefined;
      let receipt_path: string | undefined;

      if (receiptFile) {
        const formData = new FormData();
        formData.append('file', receiptFile);
        formData.append('trip_id', tripId);
        formData.append('uploader_id', paidBy);

        const uploadRes = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          receipt_url = uploadData.media?.[0]?.url;
          receipt_path = uploadData.media?.[0]?.storage_path;
        }
      }

      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: tripId,
          title: title.trim(),
          amount_rupees: amount,
          paid_by: paidBy,
          split_type: splitType,
          participant_ids: selectedMembers,
          splits: splitsPayload,
          category_id: categoryId || undefined,
          note: note.trim() || undefined,
          expense_date: expenseDate,
          receipt_url,
          receipt_path,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add expense');
      }

      toast.success('Expense added successfully!');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Error adding expense');
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
        className="w-full max-w-lg bg-[#0c1228] border border-white/10 rounded-3xl p-6 shadow-2xl relative my-8"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 shadow-md">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-outfit text-white">Add Trip Expense</h2>
              <p className="text-xs text-slate-400">Record costs & split automatically</p>
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
          {/* Amount & Title */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Amount (₹ INR)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-extrabold text-cyan-400">₹</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amountRupees}
                onChange={(e) => setAmountRupees(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10 focus:border-cyan-400 rounded-2xl pl-10 pr-4 py-3 text-2xl font-extrabold font-outfit text-white placeholder-slate-600 focus:outline-none transition-all"
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Expense Title / Description</label>
            <input
              type="text"
              placeholder="e.g. Seafood Dinner at Beach Shack, Petrol, Villa stay"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/10 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-cyan-400" />
              Category
            </label>

            <div className="relative">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full appearance-none bg-[#0a0f24] border border-white/10 hover:border-white/20 focus:border-cyan-400 rounded-xl px-3.5 py-3 pr-10 text-sm text-white focus:outline-none transition-all cursor-pointer"
                required
              >
                {activeCategories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                    className="bg-[#0a0f24] text-white"
                  >
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>

              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Paid By & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Paid By</label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full bg-[#0a0f24] border border-white/10 focus:border-cyan-400 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none transition-all"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Expense Date</label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full bg-[#0a0f24] border border-white/10 focus:border-cyan-400 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Split Mode Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Split Method</label>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-white/[0.03] border border-white/10 rounded-2xl">
              {[
                { type: 'equal' as const, label: 'Equally', icon: Divide },
                { type: 'exact' as const, label: 'Exact ₹', icon: Wallet },
                { type: 'percentage' as const, label: 'Percent %', icon: Percent },
                { type: 'shares' as const, label: 'Shares', icon: Layers },
              ].map(({ type, label, icon: Icon }) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setSplitType(type)}
                  className={`py-2 px-1 rounded-xl text-xs font-medium flex flex-col items-center gap-1 transition-all ${splitType === type
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Members Involved */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300">Split Among</label>
              <button
                type="button"
                onClick={() => setSelectedMembers(members.map((m) => m.id))}
                className="text-[11px] text-cyan-400 hover:underline font-semibold"
              >
                Select Everyone
              </button>
            </div>

            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {members.map((m) => {
                const isSelected = selectedMembers.includes(m.id);
                return (
                  <div
                    key={m.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${isSelected
                      ? 'bg-white/[0.06] border-cyan-500/40'
                      : 'bg-white/[0.02] border-white/5 opacity-50'
                      }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleMember(m.id)}
                      className="flex items-center gap-2.5 text-left flex-1"
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                        style={{ backgroundColor: m.color || '#6366f1' }}
                      >
                        {m.name[0]?.toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-slate-200">{m.name}</span>
                    </button>

                    {isSelected && splitType !== 'equal' && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step={splitType === 'shares' ? '1' : '0.1'}
                          placeholder={splitType === 'percentage' ? '%' : splitType === 'shares' ? '1' : '₹'}
                          value={customSplits[m.id] || ''}
                          onChange={(e) => handleCustomSplitChange(m.id, e.target.value)}
                          className="w-16 bg-[#0a0f24] border border-white/15 focus:border-cyan-400 rounded-lg px-2 py-1 text-xs text-right text-white focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-400 font-mono">
                          {splitType === 'percentage' ? '%' : splitType === 'shares' ? 'sh' : '₹'}
                        </span>
                      </div>
                    )}

                    {isSelected && splitType === 'equal' && (
                      <span className="text-xs text-cyan-300 font-bold font-mono">
                        ₹{(parseFloat(amountRupees || '0') / (selectedMembers.length || 1)).toFixed(2)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Receipt Attachment & Note */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Receipt / Bill Photo (Optional)</label>
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-dashed border-white/15 cursor-pointer text-xs text-slate-300 transition-colors">
                <Receipt className="w-4 h-4 text-cyan-400" />
                <span className="truncate">{receiptFile ? receiptFile.name : 'Upload bill photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && setReceiptFile(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Optional Note</label>
              <input
                type="text"
                placeholder="e.g. Paid via credit card"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-[#0a0f24] border border-white/10 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-bold text-sm shadow-xl shadow-pink-500/25 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Recording Expense...' : 'Save Expense & Update Balances'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
