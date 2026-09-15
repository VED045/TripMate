'use client';

import React, { useState } from 'react';
import { Sparkles, CheckCircle2, Bot, ArrowRight, Wand2 } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GradientButton } from '@/components/ui/Button';
import { parseNaturalLanguageBill } from '@/lib/ai/itemParser';
import type { Member, ItemFormRow } from '@/types';
import { toast } from 'sonner';

interface BillAiPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onApplyItems: (items: ItemFormRow[]) => void;
}

export function BillAiPromptModal({
  isOpen,
  onClose,
  members,
  onApplyItems,
}: BillAiPromptModalProps) {
  const [promptText, setPromptText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<ItemFormRow[] | null>(null);

  const handleParse = () => {
    if (!promptText.trim()) {
      toast.error('Please enter bill item text');
      return;
    }
    const result = parseNaturalLanguageBill(promptText, members);
    if (result.items.length === 0) {
      toast.error('Could not detect items or members in prompt. Try e.g. "Ved ate a dosa and coffee."');
      return;
    }
    setParsedPreview(result.items);
  };

  const handleAccept = () => {
    if (parsedPreview && parsedPreview.length > 0) {
      onApplyItems(parsedPreview);
      toast.success(`Applied ${parsedPreview.length} AI-suggested items!`);
      onClose();
      setParsedPreview(null);
      setPromptText('');
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="AI Item Assignment"
      subtitle="Type natural language bill item descriptions"
    >
      <div className="p-5 space-y-4">
        {/* Intro */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--accent-subtle)] border border-[var(--border)]">
          <Sparkles className="w-5 h-5 text-[var(--accent)] flex-shrink-0" />
          <p className="text-xs text-[var(--text-primary)]">
            Describe who ate what! Example: <br />
            <em className="text-[var(--text-secondary)] font-medium">
              &quot;Ved ate a dosa for 170 and coffee 40. bro ate a dosa and tea 20.&quot;
            </em>
          </p>
        </div>

        {/* Text Input */}
        <textarea
          rows={4}
          value={promptText}
          onChange={e => setPromptText(e.target.value)}
          placeholder="Enter item description..."
          className="w-full inset-field p-3 text-xs font-medium resize-none"
        />

        <button
          type="button"
          onClick={handleParse}
          className="w-full py-2.5 rounded-xl font-bold text-xs text-white transition-all active:scale-98 flex items-center justify-center gap-2 shadow-md"
          style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)' }}
        >
          <Wand2 className="w-4 h-4" />
          Parse & Extract Items
        </button>

        {/* Parsed Preview */}
        {parsedPreview && (
          <div className="raised-card p-4 space-y-3 bg-[var(--surface-raised)] border border-[var(--border)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-primary)] font-outfit">
                AI Suggestion ({parsedPreview.length} items found)
              </span>
              <span className="text-[10px] font-bold text-[var(--success)] uppercase tracking-wider font-mono">
                Review before applying
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {parsedPreview.map((item, idx) => (
                <div key={idx} className="inset-card p-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[var(--text-primary)]">{item.name}</span>
                    <span className="text-[10px] text-[var(--text-muted)] block font-mono">
                      Qty: {item.quantity} {item.unitPriceRupees > 0 && `· ₹${item.unitPriceRupees}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {item.assignments.map(a => {
                      const member = members.find(m => m.id === a.memberId);
                      return (
                        <span key={a.memberId} className="px-2 py-0.5 rounded-md bg-[var(--accent-subtle)] text-[10px] font-bold text-[var(--accent)]">
                          {member?.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <GradientButton
              gradient="emerald"
              size="md"
              fullWidth
              onClick={handleAccept}
            >
              <CheckCircle2 className="w-4 h-4" />
              Accept AI Items into Expense
            </GradientButton>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
