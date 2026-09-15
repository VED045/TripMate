'use client';

import React, { useEffect, useState } from 'react';
import {
  Wallet,
  Receipt,
  Percent,
  Divide,
  Layers,
  Tag,
  List,
} from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GradientButton } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { ItemizedSplitEditor } from '@/components/money/ItemizedSplitEditor';
import type { Member, Category, ItemFormRow } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// =============================================================================
// Split type config
// =============================================================================
type SplitType = 'equal' | 'exact' | 'percentage' | 'shares' | 'itemized';

const SPLIT_TYPES: { type: SplitType; label: string; short: string; icon: React.ElementType; description: string }[] = [
  { type: 'equal', label: 'Equal', short: '÷', icon: Divide, description: 'Divided equally among participants' },
  { type: 'exact', label: 'Exact ₹', short: '₹', icon: Wallet, description: 'Set exact rupee amounts per person' },
  { type: 'percentage', label: 'Percent', short: '%', icon: Percent, description: 'Percentage of total per person' },
  { type: 'shares', label: 'Shares', short: '×', icon: Layers, description: 'Weighted share ratio splitting' },
  { type: 'itemized', label: 'Itemized', short: '📋', icon: List, description: 'Item-by-item assignment with GST' },
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
  const activeCategories = categories ?? [];

  // Form state
  const [title, setTitle] = useState('');
  const [amountRupees, setAmountRupees] = useState('');
  const [paidBy, setPaidBy] = useState(currentMemberId || members[0]?.id || '');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [selectedMembers, setSelectedMembers] = useState<string[]>(members.map(m => m.id));
  const [customSplits, setCustomSplits] = useState<{ [id: string]: string }>({});
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Itemized state
  const [items, setItems] = useState<ItemFormRow[]>([]);
  const [gstType, setGstType] = useState<'exclusive' | 'inclusive'>('exclusive');

  // Set default category on load
  useEffect(() => {
    if (activeCategories.length > 0 && !activeCategories.some(c => c.id === categoryId)) {
      setCategoryId(activeCategories[0].id);
    }
  }, [activeCategories]);

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setAmountRupees('');
      setSplitType('equal');
      setSelectedMembers(members.map(m => m.id));
      setCustomSplits({});
      setNote('');
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setReceiptFile(null);
      setItems([]);
    }
  }, [isOpen, members]);

  // Itemized total
  const itemizedTotal = items.reduce((s, item) => {
    const subtotal = item.quantity * item.unitPriceRupees;
    const gst = (subtotal * item.gstRatePercent) / 100;
    return s + subtotal + gst;
  }, 0);

  const effectiveAmount = splitType === 'itemized'
    ? itemizedTotal
    : parseFloat(amountRupees || '0');

  const toggleMember = (id: string) => {
    if (selectedMembers.includes(id)) {
      if (selectedMembers.length <= 1) {
        toast.error('At least one member must be in the split');
        return;
      }
      setSelectedMembers(prev => prev.filter(x => x !== id));
    } else {
      setSelectedMembers(prev => [...prev, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!title.trim()) { toast.error('Please enter an expense title'); return; }
    if (splitType !== 'itemized' && (isNaN(effectiveAmount) || effectiveAmount <= 0)) {
      toast.error('Please enter a valid amount'); return;
    }
    if (splitType === 'itemized' && items.length === 0) {
      toast.error('Add at least one item'); return;
    }
    if (selectedMembers.length === 0) { toast.error('Select at least one participant'); return; }

    if (splitType !== 'equal' && splitType !== 'itemized') {
      const vals = selectedMembers.map(id => parseFloat(customSplits[id] || '0') || 0);
      if (vals.some(v => v <= 0)) {
        toast.error('Enter a valid split value for every selected member'); return;
      }
      if (splitType === 'exact') {
        const total = vals.reduce((s, v) => s + v, 0);
        if (Math.abs(total - effectiveAmount) > 0.01) {
          toast.error(`Exact split must total ₹${effectiveAmount.toFixed(2)}. Currently ₹${total.toFixed(2)}.`); return;
        }
      }
      if (splitType === 'percentage') {
        const total = vals.reduce((s, v) => s + v, 0);
        if (Math.abs(total - 100) > 0.01) {
          toast.error(`Percentages must total 100%. Currently ${total.toFixed(1)}%.`); return;
        }
      }
    }

    try {
      setIsSubmitting(true);

      // Receipt upload
      let receipt_url: string | undefined;
      let receipt_path: string | undefined;
      if (receiptFile) {
        const fd = new FormData();
        fd.append('file', receiptFile);
        fd.append('trip_id', tripId);
        fd.append('uploader_id', paidBy);
        const uploadRes = await fetch('/api/media/upload', { method: 'POST', body: fd });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          receipt_url = uploadData.media?.[0]?.url;
          receipt_path = uploadData.media?.[0]?.storage_path;
        }
      }

      // Build payload
      let splitsPayload: { member_id: string; value: number }[] | undefined;
      if (splitType !== 'equal' && splitType !== 'itemized') {
        splitsPayload = selectedMembers.map(id => ({
          member_id: id,
          value: parseFloat(customSplits[id] || '0') || 0,
        }));
      }

      // Itemized items payload
      let itemsPayload: object[] | undefined;
      let gstRatePercent: number | undefined;
      if (splitType === 'itemized' && items.length > 0) {
        itemsPayload = items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unit_price_rupees: item.unitPriceRupees,
          gst_rate_percent: item.gstRatePercent || undefined,
          assignments: item.assignments.map(a => ({
            member_id: a.memberId,
            quantity: a.quantity,
          })),
        }));
        // If all items share the same GST rate, pass it at expense level too
        const uniqueRates = [...new Set(items.map(i => i.gstRatePercent))];
        if (uniqueRates.length === 1) gstRatePercent = uniqueRates[0];
      }

      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: tripId,
          title: title.trim(),
          amount_rupees: splitType === 'itemized' ? itemizedTotal : effectiveAmount,
          paid_by: paidBy,
          split_type: splitType,
          participant_ids: selectedMembers,
          splits: splitsPayload,
          items: itemsPayload,
          gst_rate_percent: gstRatePercent,
          gst_type: splitType === 'itemized' ? gstType : undefined,
          category_id:
            categoryId &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(categoryId)
              ? categoryId : undefined,
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

      toast.success('Expense added!');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error adding expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Add Expense"
      subtitle="Record costs & split automatically"
      maxHeight="95dvh"
    >
      <form onSubmit={handleSubmit} className="p-5 space-y-4 pb-8">
        {/* Amount — only shown for non-itemized */}
        {splitType !== 'itemized' ? (
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] block mb-1.5">
              Amount (₹ INR)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-2xl font-black text-[var(--accent)] pointer-events-none">₹</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amountRupees}
                onChange={e => setAmountRupees(e.target.value)}
                className="w-full inset-field pl-10 pr-4 py-3 text-2xl font-extrabold font-outfit"
                required
                autoFocus
              />
            </div>
          </div>
        ) : (
          <div className="inset-card p-3 flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">Total (from items)</span>
            <span className="text-xl font-extrabold font-outfit text-[var(--text-primary)]">
              ₹{itemizedTotal.toFixed(2)}
            </span>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] block mb-1.5">
            Title
          </label>
          <input
            type="text"
            placeholder="e.g. Seafood Dinner, Petrol, Hotel Stay"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full inset-field px-3.5 py-2.5 text-sm"
            required
          />
        </div>

        {/* Paid By + Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] block mb-1.5">Paid By</label>
            <select
              value={paidBy}
              onChange={e => setPaidBy(e.target.value)}
              className="w-full inset-field px-3 py-2 text-xs"
            >
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] block mb-1.5">Date</label>
            <input
              type="date"
              value={expenseDate}
              onChange={e => setExpenseDate(e.target.value)}
              className="w-full inset-field px-3 py-2 text-xs"
            />
          </div>
        </div>

        {/* Category */}
        {activeCategories.length > 0 && (
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] block mb-1.5">
              Category
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {activeCategories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium border transition-all',
                    categoryId === cat.id
                      ? 'border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)]'
                      : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                  )}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Split Type */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] block mb-1.5">
            Split Method
          </label>
          <div className="grid grid-cols-5 gap-1 p-1 rounded-2xl" style={{ background: 'var(--surface-inset)', boxShadow: 'var(--shadow-inset)' }}>
            {SPLIT_TYPES.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => setSplitType(type)}
                className={cn(
                  'flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-[10px] font-semibold transition-all',
                  splitType === type
                    ? 'bg-[var(--surface-raised)] text-[var(--accent)] shadow-[var(--shadow-card)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                )}
                title={type}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-1">
            {SPLIT_TYPES.find(s => s.type === splitType)?.description}
          </p>
        </div>

        {/* Participants (for non-itemized) */}
        {splitType !== 'itemized' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                Split Among
              </label>
              <button
                type="button"
                onClick={() => setSelectedMembers(members.map(m => m.id))}
                className="text-[10px] font-semibold text-[var(--accent)] hover:underline"
              >
                All
              </button>
            </div>
            <div className="space-y-1.5 max-h-44 overflow-y-auto">
              {members.map(m => {
                const isSelected = selectedMembers.includes(m.id);
                const shareAmt = isSelected && splitType === 'equal' && effectiveAmount > 0
                  ? (effectiveAmount / selectedMembers.length).toFixed(2)
                  : null;
                return (
                  <div
                    key={m.id}
                    className={cn(
                      'flex items-center justify-between p-2.5 rounded-xl border transition-all',
                      isSelected
                        ? 'border-[var(--accent)] bg-[var(--accent-subtle)]'
                        : 'border-[var(--border)] bg-[var(--surface-inset)] opacity-60'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggleMember(m.id)}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      <Avatar name={m.name} color={m.color} size="xs" />
                      <span className={cn('text-xs font-medium', isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]')}>
                        {m.name}
                      </span>
                    </button>

                    {isSelected && splitType !== 'equal' && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step={splitType === 'shares' ? '1' : '0.01'}
                          placeholder={splitType === 'percentage' ? '%' : splitType === 'shares' ? '1' : '₹'}
                          value={customSplits[m.id] || ''}
                          onChange={e => setCustomSplits(prev => ({ ...prev, [m.id]: e.target.value }))}
                          className="w-16 inset-field px-2 py-1 text-xs text-right font-mono"
                          onClick={ev => ev.stopPropagation()}
                        />
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {splitType === 'percentage' ? '%' : splitType === 'shares' ? 'sh' : '₹'}
                        </span>
                      </div>
                    )}

                    {shareAmt && (
                      <span className="text-xs font-bold font-mono" style={{ color: 'var(--accent)' }}>
                        ₹{shareAmt}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Itemized editor */}
        {splitType === 'itemized' && (
          <ItemizedSplitEditor
            members={members}
            participantIds={selectedMembers}
            items={items}
            gstType={gstType}
            onChange={setItems}
            onGstTypeChange={setGstType}
          />
        )}

        {/* Note + Receipt */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] block mb-1.5">Note</label>
            <input
              type="text"
              placeholder="e.g. Paid by credit card"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full inset-field px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] block mb-1.5">
              Receipt (optional)
            </label>
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-[var(--border-strong)] cursor-pointer text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-inset)] transition-colors">
              <Receipt className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span className="truncate">{receiptFile ? receiptFile.name : 'Upload bill photo'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={e => e.target.files?.[0] && setReceiptFile(e.target.files[0])}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Submit */}
        <GradientButton
          type="submit"
          gradient="rose"
          size="lg"
          fullWidth
          loading={isSubmitting}
        >
          {isSubmitting ? 'Recording...' : 'Save Expense & Update Balances'}
        </GradientButton>
      </form>
    </BottomSheet>
  );
}
