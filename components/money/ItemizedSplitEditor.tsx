'use client';

import React, { useState, useCallback } from 'react';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Receipt,
  Users,
  CheckCircle2,
} from 'lucide-react';
import type { Member, ItemFormRow } from '@/types';
import { formatRupees } from '@/lib/currency';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

// =============================================================================
// GST RATES
// =============================================================================
const GST_RATES = [0, 5, 12, 18, 28];

// =============================================================================
// ITEM ROW — single line item
// =============================================================================
interface ItemRowProps {
  item: ItemFormRow;
  members: Member[];
  participantIds: string[];
  onChange: (updated: ItemFormRow) => void;
  onRemove: () => void;
  index: number;
}

function ItemRow({ item, members, participantIds, onChange, onRemove, index }: ItemRowProps) {
  const [expanded, setExpanded] = useState(true);

  const participants = members.filter(m => participantIds.includes(m.id));
  const totalAssigned = item.assignments.reduce((s, a) => s + a.quantity, 0);
  const totalItem = item.quantity * item.unitPriceRupees;
  const gstAmt = (totalItem * item.gstRatePercent) / 100;

  const toggleMember = (memberId: string) => {
    const existing = item.assignments.find(a => a.memberId === memberId);
    if (existing) {
      onChange({
        ...item,
        assignments: item.assignments.filter(a => a.memberId !== memberId),
      });
    } else {
      onChange({
        ...item,
        assignments: [...item.assignments, { memberId, quantity: 1 }],
      });
    }
  };

  const splitEqually = () => {
    if (participants.length === 0) return;
    const qtyEach = parseFloat((item.quantity / participants.length).toFixed(3));
    onChange({
      ...item,
      assignments: participants.map(m => ({ memberId: m.id, quantity: qtyEach })),
    });
  };

  return (
    <div className="raised-card p-3 space-y-3">
      {/* Row header */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-[var(--text-muted)] w-5 text-center">{index + 1}</span>
        <input
          type="text"
          value={item.name}
          onChange={e => onChange({ ...item, name: e.target.value })}
          placeholder="Item name (e.g. Dosa, Chai)"
          className="flex-1 inset-field px-2.5 py-1.5 text-xs font-medium"
        />
        <button
          type="button"
          onClick={onRemove}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-light)] transition-colors flex-shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-inset)] transition-colors flex-shrink-0"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Price + qty row */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Qty</label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onChange({ ...item, quantity: Math.max(0.1, parseFloat((item.quantity - 1).toFixed(2))) })}
              className="w-6 h-7 flex items-center justify-center rounded-lg bg-[var(--surface-inset)] border border-[var(--border)] text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--surface-raised)]"
            >
              -
            </button>
            <input
              type="number"
              value={item.quantity === 0 ? '' : item.quantity}
              min={0.01}
              step={0.5}
              onChange={e => {
                const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                onChange({ ...item, quantity: isNaN(val) ? 0 : val });
              }}
              onBlur={e => {
                if (!item.quantity || item.quantity <= 0) onChange({ ...item, quantity: 1 });
              }}
              className="w-full inset-field px-1 py-1.5 text-xs text-center font-mono font-bold"
            />
            <button
              type="button"
              onClick={() => onChange({ ...item, quantity: parseFloat((item.quantity + 1).toFixed(2)) })}
              className="w-6 h-7 flex items-center justify-center rounded-lg bg-[var(--surface-inset)] border border-[var(--border)] text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--surface-raised)]"
            >
              +
            </button>
          </div>
        </div>
        <div>
          <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Unit ₹</label>
          <input
            type="number"
            value={item.unitPriceRupees === 0 ? '' : item.unitPriceRupees}
            min={0}
            step={0.5}
            placeholder="0"
            onChange={e => {
              const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
              onChange({ ...item, unitPriceRupees: isNaN(val) ? 0 : val });
            }}
            className="w-full inset-field px-2 py-1.5 text-xs text-center font-mono font-bold"
          />
        </div>
        <div>
          <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">GST %</label>
          <select
            value={item.gstRatePercent}
            onChange={e => onChange({ ...item, gstRatePercent: parseFloat(e.target.value) })}
            className="w-full inset-field px-1 py-1.5 text-xs text-center font-mono font-bold"
          >
            {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
            <option value={item.gstRatePercent}>
              {!GST_RATES.includes(item.gstRatePercent) ? `${item.gstRatePercent}%` : ''}
            </option>
          </select>
        </div>
      </div>

      {/* Total line */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] text-[var(--text-muted)]">
          {item.quantity}× ₹{item.unitPriceRupees.toFixed(2)}
          {item.gstRatePercent > 0 && ` + ₹${gstAmt.toFixed(2)} GST`}
        </span>
        <span className="text-xs font-bold font-outfit text-[var(--text-primary)]">
          = ₹{(totalItem + gstAmt).toFixed(2)}
        </span>
      </div>

      {/* Who gets this item — expanded */}
      {expanded && (
        <div className="space-y-2 pt-2 border-t border-[var(--border)]">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Who gets this?
            </p>
            <button
              type="button"
              onClick={splitEqually}
              className="text-[10px] font-semibold text-[var(--accent)] hover:underline"
            >
              Split equally
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {participants.map(m => {
              const assignment = item.assignments.find(a => a.memberId === m.id);
              const selected = !!assignment;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMember(m.id)}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all',
                    selected
                      ? 'border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)] border'
                      : 'border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                  )}
                >
                  <Avatar name={m.name} color={m.color} size="xs" />
                  <span>{m.name}</span>
                  {selected && <CheckCircle2 className="w-3 h-3" />}
                </button>
              );
            })}
          </div>

          {totalAssigned > 0 && Math.abs(totalAssigned - item.quantity) > 0.01 && (
            <p className="text-[10px] text-[var(--warning)]">
              ⚠️ Assigned {totalAssigned.toFixed(2)} of {item.quantity} units
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// ITEMIZED SPLIT EDITOR — main component
// =============================================================================
interface ItemizedSplitEditorProps {
  members: Member[];
  participantIds: string[];
  items: ItemFormRow[];
  gstType: 'exclusive' | 'inclusive';
  onChange: (items: ItemFormRow[]) => void;
  onGstTypeChange: (type: 'exclusive' | 'inclusive') => void;
}

import { Wand2, Camera } from 'lucide-react';
import { BillAiPromptModal } from '@/components/money/BillAiPromptModal';
import { BillOcrModal } from '@/components/money/BillOcrModal';

export function ItemizedSplitEditor({
  members,
  participantIds,
  items,
  gstType,
  onChange,
  onGstTypeChange,
}: ItemizedSplitEditorProps) {
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);

  const addItem = () => {
    const newItem: ItemFormRow = {
      id: crypto.randomUUID(),
      name: '',
      quantity: 1,
      unitPriceRupees: 0,
      gstRatePercent: 0,
      assignments: members
        .filter(m => participantIds.includes(m.id))
        .map(m => ({ memberId: m.id, quantity: 1 })),
    };
    onChange([...items, newItem]);
  };

  const updateItem = (index: number, updated: ItemFormRow) => {
    const next = [...items];
    next[index] = updated;
    onChange(next);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  // Calculate totals
  const subtotal = items.reduce((s, item) => {
    return s + item.quantity * item.unitPriceRupees;
  }, 0);
  const totalGst = items.reduce((s, item) => {
    return s + (item.quantity * item.unitPriceRupees * item.gstRatePercent) / 100;
  }, 0);
  const grandTotal = subtotal + totalGst;

  return (
    <div className="space-y-4">
      {/* GST Type toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-[var(--text-secondary)]">GST:</p>
          <div className="flex rounded-xl overflow-hidden border border-[var(--border)]">
            {(['exclusive', 'inclusive'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => onGstTypeChange(type)}
                className={cn(
                  'px-2.5 py-1 text-xs font-semibold capitalize transition-colors',
                  gstType === type
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--surface-inset)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* AI Assistant buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsOcrModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold text-white transition-all active:scale-95 shadow-sm"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
          >
            <Camera className="w-3.5 h-3.5 text-white" />
            <span>Scan Receipt</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold text-white transition-all active:scale-95 shadow-sm"
            style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)' }}
          >
            <Wand2 className="w-3.5 h-3.5 text-white" />
            <span>AI Text</span>
          </button>
        </div>
      </div>

      {/* Items list */}
      <div className="space-y-2.5">
        {items.map((item, i) => (
          <ItemRow
            key={item.id}
            item={item}
            members={members}
            participantIds={participantIds}
            onChange={updated => updateItem(i, updated)}
            onRemove={() => removeItem(i)}
            index={i}
          />
        ))}
      </div>

      {/* Add item button */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={addItem}
          className="py-2.5 rounded-xl border border-dashed border-[var(--border-strong)] text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Item
        </button>
        <button
          type="button"
          onClick={() => setIsOcrModalOpen(true)}
          className="py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-inset)] transition-colors flex items-center justify-center gap-1.5 shadow-[var(--shadow-raised)]"
        >
          <Camera className="w-3.5 h-3.5 text-[var(--success)]" />
          Scan Receipt
        </button>
        <button
          type="button"
          onClick={() => setIsAiModalOpen(true)}
          className="py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-inset)] transition-colors flex items-center justify-center gap-1.5 shadow-[var(--shadow-raised)]"
        >
          <Wand2 className="w-3.5 h-3.5 text-[var(--accent)]" />
          Type Text
        </button>
      </div>

      <BillAiPromptModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        members={members}
        onApplyItems={aiItems => onChange([...items, ...aiItems])}
      />
      <BillOcrModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        members={members}
        onApplyOcr={result => onChange([...items, ...result.items])}
      />

      {/* Summary */}
      {items.length > 0 && (
        <div className="inset-card p-3 space-y-1.5">
          <div className="flex justify-between text-xs text-[var(--text-secondary)]">
            <span>Subtotal ({items.length} items)</span>
            <span className="font-mono font-semibold">₹{subtotal.toFixed(2)}</span>
          </div>
          {totalGst > 0 && (
            <div className="flex justify-between text-xs text-[var(--text-muted)]">
              <span>GST</span>
              <span className="font-mono">₹{totalGst.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold text-[var(--text-primary)] pt-1 border-t border-[var(--border)]">
            <span>Total</span>
            <span className="font-outfit">₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
