'use client';

import React, { useState, useEffect } from 'react';
import {
  HandCoins,
  QrCode,
  Copy,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Smartphone,
  Share2,
} from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Avatar } from '@/components/ui/Avatar';
import { GradientButton } from '@/components/ui/Button';
import type { Member, SimplifiedDebt } from '@/types';
import { generateUpiDeepLink, generateUpiQrUrl } from '@/lib/upi';
import { formatRupees, paiseToRupees } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  tripName: string;
  members: Member[];
  simplifiedDebts: SimplifiedDebt[];
  currentMemberId?: string;
  initialDebt?: SimplifiedDebt | null;
  onSuccess: () => void;
}

export function SettleUpModal({
  isOpen,
  onClose,
  tripId,
  tripName,
  members,
  simplifiedDebts,
  currentMemberId,
  initialDebt,
  onSuccess,
}: SettleUpModalProps) {
  // Normalize debts — support both snake_case (API) and camelCase (engine)
  const normalizedDebts = simplifiedDebts.map(d => ({
    from_member_id: d.from_member_id || d.fromMemberId || '',
    to_member_id: d.to_member_id || d.toMemberId || '',
    amount_paise: d.amount_paise ?? d.amountPaise ?? 0,
  }));

  const myDebt = normalizedDebts.find(d => d.from_member_id === currentMemberId);
  const [selectedDebt, setSelectedDebt] = useState<{
    from_member_id: string;
    to_member_id: string;
    amount_paise: number;
  } | null>(myDebt || normalizedDebts[0] || null);
  const [customFrom, setCustomFrom] = useState(currentMemberId || members[0]?.id || '');
  const [customTo, setCustomTo] = useState(members[1]?.id || members[0]?.id || '');
  const [customAmountRupees, setCustomAmountRupees] = useState('');
  const [upiRef, setUpiRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManualForm, setShowManualForm] = useState(normalizedDebts.length === 0);

  useEffect(() => {
    if (isOpen) {
      const norm = simplifiedDebts.map(d => ({
        from_member_id: d.from_member_id || d.fromMemberId || '',
        to_member_id: d.to_member_id || d.toMemberId || '',
        amount_paise: d.amount_paise ?? d.amountPaise ?? 0,
      }));

      if (initialDebt) {
        const matching = norm.find(
          d =>
            d.from_member_id === (initialDebt.from_member_id || initialDebt.fromMemberId) &&
            d.to_member_id === (initialDebt.to_member_id || initialDebt.toMemberId)
        );
        if (matching) {
          setSelectedDebt(matching);
          setShowManualForm(false);
          return;
        } else {
          // Custom debt passed in
          setCustomFrom(initialDebt.from_member_id || initialDebt.fromMemberId || '');
          setCustomTo(initialDebt.to_member_id || initialDebt.toMemberId || '');
          setCustomAmountRupees(paiseToRupees(initialDebt.amount_paise ?? initialDebt.amountPaise ?? 0).toString());
          setSelectedDebt(null);
          setShowManualForm(true);
          return;
        }
      }

      const my = norm.find(d => d.from_member_id === currentMemberId);
      setSelectedDebt(my || norm[0] || null);
      setShowManualForm(norm.length === 0);
    }
  }, [isOpen, simplifiedDebts, currentMemberId, initialDebt]);

  const toMember = members.find(m => m.id === (selectedDebt?.to_member_id || customTo));
  const fromMember = members.find(m => m.id === (selectedDebt?.from_member_id || customFrom));
  const amountRupees = selectedDebt
    ? paiseToRupees(selectedDebt.amount_paise)
    : parseFloat(customAmountRupees || '0');

  const upiId = toMember?.upi_id || '';
  const payeeName = toMember?.name || 'Friend';
  const upiLink = upiId
    ? generateUpiDeepLink({ payeeUpiId: upiId, payeeName, amountRupees, note: `Settlement for ${tripName}` })
    : '';
  const autoQrUrl = upiId
    ? generateUpiQrUrl({ payeeUpiId: upiId, payeeName, amountRupees, note: `Settlement for ${tripName}` })
    : '';
  const activeQrUrl = toMember?.qr_code_url || autoQrUrl;

  const handleCopyUpi = () => {
    if (upiId) {
      navigator.clipboard.writeText(upiId);
      toast.success('UPI ID copied!');
    }
  };

  const handleShare = async () => {
    const msg = `${fromMember?.name} needs to pay ${toMember?.name} ₹${amountRupees.toFixed(2)}\n\nUPI: ${upiId}\n\nFor: ${tripName}`;
    try {
      if (navigator.share) {
        await navigator.share({ text: msg });
      } else {
        await navigator.clipboard.writeText(msg);
        toast.success('Payment details copied!');
      }
    } catch {}
  };

  const handleRecordSettlement = async () => {
    if (!fromMember || !toMember || amountRupees <= 0) {
      toast.error('Invalid settlement details');
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: tripId,
          from_member_id: fromMember.id,
          to_member_id: toMember.id,
          amount_rupees: amountRupees,
          upi_ref: upiRef.trim() || undefined,
          recorded_by: currentMemberId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to record settlement');
      }

      toast.success('Settlement recorded!');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error recording settlement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Settle Up"
      subtitle="UPI payments & debt settlements"
    >
      <div className="p-5 space-y-5">
        {/* Mode Toggle Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl inset-card">
          <button
            type="button"
            onClick={() => {
              setShowManualForm(false);
              if (normalizedDebts[0]) setSelectedDebt(normalizedDebts[0]);
            }}
            className={cn(
              'flex-1 py-2 text-xs font-bold rounded-xl transition-all',
              !showManualForm
                ? 'bg-[#2b56ff] text-white shadow-md'
                : 'text-[var(--text-primary)] hover:bg-[var(--surface-raised)]'
            )}
          >
            🎯 Suggested Debts ({normalizedDebts.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setShowManualForm(true);
              setSelectedDebt(null);
            }}
            className={cn(
              'flex-1 py-2 text-xs font-bold rounded-xl transition-all',
              showManualForm
                ? 'bg-[#2b56ff] text-white shadow-md'
                : 'text-[var(--text-primary)] hover:bg-[var(--surface-raised)]'
            )}
          >
            ✍️ Custom / Partial Amount
          </button>
        </div>

        {/* Suggested Debts list */}
        {!showManualForm && normalizedDebts.length > 0 && (
          <div className="space-y-2">
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-none">
              {normalizedDebts.map((d, idx) => {
                const isSelected = selectedDebt?.from_member_id === d.from_member_id &&
                  selectedDebt?.to_member_id === d.to_member_id;
                const from = members.find(m => m.id === d.from_member_id);
                const to = members.find(m => m.id === d.to_member_id);
                const isMyDebt = d.from_member_id === currentMemberId;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDebt(d)}
                    className={cn(
                      'w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all',
                      isSelected
                        ? 'border-[var(--success)] bg-[var(--settled-bg)] shadow-sm'
                        : 'border-[var(--border)] bg-[var(--surface-inset)] hover:border-[var(--border-strong)]'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar name={from?.name || '?'} color={from?.color} size="xs" />
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className={cn('font-extrabold', isMyDebt ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--text-primary)]')}>
                          {from?.name}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <span className="font-extrabold text-[var(--text-primary)]">{to?.name}</span>
                      </div>
                    </div>
                    <span className="font-extrabold text-sm font-outfit text-[var(--text-primary)]">
                      {formatRupees(d.amount_paise)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Manual Custom/Partial Form */}
        {showManualForm && (
          <div className="space-y-3.5 p-4 rounded-2xl inset-card bg-[var(--surface-inset)] border border-[var(--border)]">
            <p className="text-xs font-extrabold text-[var(--text-primary)]">Record Custom or Partial Settlement</p>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Payer (From)</label>
                {currentMemberId ? (
                  <div className="w-full inset-field bg-[var(--surface-inset)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--text-primary)] flex items-center justify-between">
                    <span>{fromMember?.name || 'You'}</span>
                    <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase">
                      You (Payer)
                    </span>
                  </div>
                ) : (
                  <select
                    value={customFrom}
                    onChange={e => setCustomFrom(e.target.value)}
                    className="w-full inset-field bg-[var(--surface-inset)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--text-primary)]"
                  >
                    {members.map(m => <option key={m.id} value={m.id} className="bg-[var(--surface-raised)] text-[var(--text-primary)]">{m.name}</option>)}
                  </select>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Recipient (To)</label>
                <select
                  value={customTo}
                  onChange={e => setCustomTo(e.target.value)}
                  className="w-full inset-field bg-[var(--surface-inset)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--text-primary)]"
                >
                  {members.filter(m => m.id !== customFrom).map(m => (
                    <option key={m.id} value={m.id} className="bg-[var(--surface-raised)] text-[var(--text-primary)]">{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Amount to Settle (₹)</label>
              <input
                type="number"
                step="1"
                placeholder="e.g. 500"
                value={customAmountRupees}
                onChange={e => setCustomAmountRupees(e.target.value)}
                className="w-full inset-field px-3.5 py-2.5 text-sm font-extrabold font-outfit"
              />
            </div>
          </div>
        )}

        {/* Payment Details Panel */}
        {(selectedDebt || (showManualForm && customFrom && customTo && parseFloat(customAmountRupees) > 0)) && (
          <div className="raised-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar name={fromMember?.name || '?'} color={fromMember?.color} size="xs" />
                <ArrowRight className="w-4 h-4 text-[var(--text-muted)]" />
                <Avatar name={toMember?.name || '?'} color={toMember?.color} size="xs" />
                <span className="text-sm font-bold text-[var(--text-primary)] ml-1">{toMember?.name}</span>
              </div>
              <span className="text-xl font-extrabold font-outfit" style={{ color: 'var(--success)' }}>
                ₹{amountRupees.toFixed(2)}
              </span>
            </div>

            {/* UPI ID row */}
            <div className="flex items-center justify-between p-2.5 rounded-xl" style={{ background: 'var(--surface-inset)' }}>
              <div>
                <p className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-wider">UPI ID</p>
                <p className="text-xs font-mono font-bold text-[var(--text-primary)] mt-0.5">
                  {upiId || 'No UPI registered'}
                </p>
              </div>
              {upiId && (
                <div className="flex items-center gap-1.5">
                  <button onClick={handleCopyUpi} className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] transition-colors">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={handleShare} className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] transition-colors">
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* QR Code */}
            {activeQrUrl && (
              <div className="flex flex-col items-center p-3 rounded-xl" style={{ background: 'var(--surface-inset)' }}>
                <div className="p-2 bg-white rounded-xl shadow-md mb-2 relative">
                  {/* eslint-disable-next-html-element-suppress */}
                  <img src={activeQrUrl} alt="UPI QR Code" className="w-36 h-36 object-contain rounded-lg" />
                  {toMember?.qr_code_url && (
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[8px] font-bold shadow">
                      Personal QR
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-[var(--text-muted)] font-medium">Scan with GPay, PhonePe, or Paytm</p>
              </div>
            )}

            {/* Open in UPI app */}
            {upiLink && (
              <a
                href={upiLink}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
              >
                <Smartphone className="w-4 h-4" />
                Open in UPI App
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}

        {/* Record settlement */}
        <div className="space-y-3">
          <input
            type="text"
            placeholder="UPI Ref / UTR number (optional)"
            value={upiRef}
            onChange={e => setUpiRef(e.target.value)}
            className="w-full inset-field px-3.5 py-2.5 text-xs font-mono"
          />
          <GradientButton
            gradient="indigo"
            size="lg"
            fullWidth
            loading={isSubmitting}
            onClick={handleRecordSettlement}
            disabled={!fromMember || !toMember || amountRupees <= 0}
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSubmitting ? 'Recording...' : 'Mark as Settled in TripMate'}
          </GradientButton>
        </div>
      </div>
    </BottomSheet>
  );
}
