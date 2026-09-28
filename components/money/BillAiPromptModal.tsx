'use client';

import React, { useState } from 'react';
import { Sparkles, CheckCircle2, Wand2, Percent, Check, HelpCircle } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GradientButton } from '@/components/ui/Button';
import { parseNaturalLanguageBill } from '@/lib/ai/itemParser';
import { formatCurrency } from '@/lib/currency';
import type { Member, ItemFormRow } from '@/types';
import { toast } from 'sonner';

interface BillAiPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  currency?: string;
  onApplyItems: (items: ItemFormRow[]) => void;
}

const GST_PRESETS = [0, 5, 12, 18, 28];

export function BillAiPromptModal({
  isOpen,
  onClose,
  members,
  currency = 'INR',
  onApplyItems,
}: BillAiPromptModalProps) {
  const [promptText, setPromptText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<ItemFormRow[] | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [gstRate, setGstRate] = useState<number>(5);
  const [isCustomGst, setIsCustomGst] = useState(false);
  const [customGstVal, setCustomGstVal] = useState('5');

  const handleParse = () => {
    if (!promptText.trim()) {
      toast.error('Please enter bill item text or description');
      return;
    }
    const rate = isCustomGst ? (parseFloat(customGstVal) || 0) : gstRate;
    const result = parseNaturalLanguageBill(promptText, members, rate);
    if (result.items.length === 0) {
      toast.error('Could not detect items. Try e.g. "2 dosa 170\\ncoffee 40\\ntea 20"');
      return;
    }
    setParsedPreview(result.items);
    // Select all by default
    setSelectedItemIds(new Set(result.items.map(i => i.id)));
  };

  const toggleItemSelection = (id: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleGstChange = (rate: number) => {
    setGstRate(rate);
    setIsCustomGst(false);
    if (parsedPreview) {
      setParsedPreview(prev =>
        prev ? prev.map(item => ({ ...item, gstRatePercent: rate })) : null
      );
    }
  };

  const handleCustomGstChange = (val: string) => {
    setCustomGstVal(val);
    const num = parseFloat(val) || 0;
    if (parsedPreview) {
      setParsedPreview(prev =>
        prev ? prev.map(item => ({ ...item, gstRatePercent: num })) : null
      );
    }
  };

  const selectedItems = (parsedPreview || []).filter(item => selectedItemIds.has(item.id));

  // Deterministic calculations
  const subtotal = selectedItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceRupees,
    0
  );
  const totalGst = selectedItems.reduce((sum, item) => {
    const itemSub = item.quantity * item.unitPriceRupees;
    return sum + (itemSub * (item.gstRatePercent || 0)) / 100;
  }, 0);
  const finalTotal = subtotal + totalGst;

  const handleAccept = () => {
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item');
      return;
    }
    onApplyItems(selectedItems);
    toast.success(`Applied ${selectedItems.length} items to expense!`);
    onClose();
    setParsedPreview(null);
    setPromptText('');
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="AI Item Price & GST Assistant"
      subtitle="Paste items list or describe who had what"
    >
      <div className="p-5 space-y-4">
        {/* Helper Example Badge */}
        <div className="p-3 rounded-2xl bg-[var(--accent-subtle)] border border-[var(--border)] text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-[var(--accent)] font-outfit">
            <Sparkles className="w-4 h-4" />
            <span>Supported Formats</span>
          </div>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            • <strong>Item List:</strong> &quot;2 dosa 170, coffee 40, tea 20&quot;<br />
            • <strong>Member Assignment:</strong> &quot;Ved ate one dosa and coffee. Mugdha ate one dosa and tea.&quot;
          </p>
        </div>

        {/* GST Configuration */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono flex items-center justify-between">
            <span>Configure GST</span>
            <span className="text-[var(--text-secondary)] font-normal capitalize">
              {isCustomGst ? `${customGstVal}% custom` : gstRate === 0 ? 'No GST' : `${gstRate}%`}
            </span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {GST_PRESETS.map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => handleGstChange(preset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  !isCustomGst && gstRate === preset
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'bg-[var(--surface-inset)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {preset === 0 ? 'No GST' : `${preset}%`}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setIsCustomGst(true);
                handleCustomGstChange(customGstVal);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isCustomGst
                  ? 'bg-[var(--accent)] text-white shadow-sm'
                  : 'bg-[var(--surface-inset)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Custom %
            </button>
          </div>
          {isCustomGst && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={customGstVal}
                onChange={e => handleCustomGstChange(e.target.value)}
                placeholder="Custom GST %"
                className="w-28 inset-field px-3 py-1.5 text-xs font-mono font-bold"
              />
              <span className="text-xs text-[var(--text-muted)] font-mono">% GST applied</span>
            </div>
          )}
        </div>

        {/* Text Input */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
            Items or Description
          </label>
          <textarea
            rows={4}
            value={promptText}
            onChange={e => setPromptText(e.target.value)}
            placeholder="e.g.&#10;2 dosa 170&#10;coffee 40&#10;tea 20"
            className="w-full inset-field p-3 text-xs font-mono font-medium resize-none text-[var(--text-primary)]"
          />
        </div>

        <button
          type="button"
          onClick={handleParse}
          className="w-full py-2.5 rounded-xl font-bold text-xs text-white transition-all active:scale-98 flex items-center justify-center gap-2 shadow-md"
          style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)' }}
        >
          <Wand2 className="w-4 h-4" />
          Parse &amp; Calculate Items
        </button>

        {/* Parsed Preview Table with Selectable Checkboxes */}
        {parsedPreview && parsedPreview.length > 0 && (
          <div className="raised-card p-4 space-y-3 bg-[var(--surface-raised)] border border-[var(--border)] animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[var(--text-primary)] font-outfit">
                  Select Items for Split ({selectedItems.length}/{parsedPreview.length})
                </span>
                <span className="text-[10px] text-[var(--text-muted)] block">
                  Check or uncheck items to include or exclude
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (selectedItemIds.size === parsedPreview.length) {
                    setSelectedItemIds(new Set());
                  } else {
                    setSelectedItemIds(new Set(parsedPreview.map(i => i.id)));
                  }
                }}
                className="text-[10px] font-bold text-[var(--accent)] hover:underline font-mono"
              >
                {selectedItemIds.size === parsedPreview.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {parsedPreview.map(item => {
                const isSelected = selectedItemIds.has(item.id);
                const itemSub = item.quantity * item.unitPriceRupees;
                const itemGst = (itemSub * (item.gstRatePercent || 0)) / 100;
                const itemTotal = itemSub + itemGst;

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleItemSelection(item.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                      isSelected
                        ? 'bg-[var(--accent-subtle)] border-[var(--accent)] shadow-sm'
                        : 'bg-[var(--surface-inset)] border-[var(--border)] opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center transition-colors flex-shrink-0 ${
                          isSelected
                            ? 'bg-[var(--accent)] text-white'
                            : 'border border-[var(--border)] bg-[var(--surface-raised)]'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-[var(--text-primary)] block truncate">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                          {item.quantity} × {formatCurrency(item.unitPriceRupees * 100, currency)} = {formatCurrency(itemSub * 100, currency)}
                          {item.gstRatePercent > 0 && ` (+ ${item.gstRatePercent}% GST)`}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 ml-2">
                      <span className="font-bold text-[var(--text-primary)] font-mono block">
                        {formatCurrency(Math.round(itemTotal * 100), currency)}
                      </span>
                      {item.assignments.length > 0 && (
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          {item.assignments.map(a => {
                            const member = members.find(m => m.id === a.memberId);
                            return (
                              <span
                                key={a.memberId}
                                className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[var(--surface-raised)] text-[var(--text-secondary)] border border-[var(--border)]"
                              >
                                {member?.name}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Calculations Breakdown */}
            <div className="p-3 rounded-xl bg-[var(--surface-inset)] border border-[var(--border)] space-y-1 font-mono text-xs">
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Subtotal ({selectedItems.length} items):</span>
                <span>{formatCurrency(Math.round(subtotal * 100), currency)}</span>
              </div>
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>GST:</span>
                <span>+{formatCurrency(Math.round(totalGst * 100), currency)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-[var(--text-primary)] pt-1 border-t border-[var(--border)]">
                <span>Total:</span>
                <span className="text-[var(--accent)]">
                  {formatCurrency(Math.round(finalTotal * 100), currency)}
                </span>
              </div>
            </div>

            <GradientButton
              gradient="emerald"
              size="md"
              fullWidth
              onClick={handleAccept}
              disabled={selectedItems.length === 0}
            >
              <CheckCircle2 className="w-4 h-4" />
              Apply {selectedItems.length} Items to Expense
            </GradientButton>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
