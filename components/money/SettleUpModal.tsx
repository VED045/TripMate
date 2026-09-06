'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  HandCoins, 
  QrCode, 
  Copy, 
  CheckCircle2, 
  ArrowRight,
  ExternalLink,
  Smartphone
} from 'lucide-react';
import type { Member, SimplifiedDebt } from '@/types';
import { generateUpiDeepLink, generateUpiQrUrl, generatePaytmLink, generateGPayLink } from '@/lib/upi';
import { formatRupees, paiseToRupees } from '@/lib/currency';
import { toast } from 'sonner';

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  tripName: string;
  members: Member[];
  simplifiedDebts: SimplifiedDebt[];
  currentMemberId?: string;
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
  onSuccess,
}: SettleUpModalProps) {
  const [selectedDebt, setSelectedDebt] = useState<SimplifiedDebt | null>(
    simplifiedDebts.find((d) => d.fromMemberId === currentMemberId) || simplifiedDebts[0] || null
  );
  const [customFrom, setCustomFrom] = useState(currentMemberId || members[0]?.id || '');
  const [customTo, setCustomTo] = useState(members[1]?.id || members[0]?.id || '');
  const [customAmountRupees, setCustomAmountRupees] = useState('');
  const [upiRef, setUpiRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);

  if (!isOpen) return null;

  const toMember = members.find((m) => m.id === (selectedDebt?.toMemberId || customTo));
  const fromMember = members.find((m) => m.id === (selectedDebt?.fromMemberId || customFrom));
  const amountRupees = selectedDebt 
    ? paiseToRupees(selectedDebt.amountPaise) 
    : parseFloat(customAmountRupees || '0');

  const upiId = toMember?.upi_id || '';
  const payeeName = toMember?.name || 'Friend';
  const upiLink = upiId ? generateUpiDeepLink({ payeeUpiId: upiId, payeeName, amountRupees, note: `Settlement for ${tripName}` }) : '';
  const qrUrl = upiId ? generateUpiQrUrl({ payeeUpiId: upiId, payeeName, amountRupees, note: `Settlement for ${tripName}` }) : '';

  const handleCopyUpi = () => {
    if (upiId) {
      navigator.clipboard.writeText(upiId);
      toast.success('UPI ID copied to clipboard!');
    }
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
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to record settlement');
      }

      toast.success('Settlement recorded successfully!');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Error recording settlement');
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
        className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl relative my-8"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <HandCoins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-outfit text-white">Settle Up Debts</h2>
              <p className="text-xs text-slate-400">Instant UPI payments & zero friction</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Suggested Simplified Debts */}
        {!showManualForm && simplifiedDebts.length > 0 && (
          <div className="mt-4 space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">Suggested Settlements (Algorithm Simplified)</label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {simplifiedDebts.map((d, idx) => {
                const isSelected = selectedDebt === d;
                const from = members.find((m) => m.id === d.fromMemberId);
                const to = members.find((m) => m.id === d.toMemberId);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDebt(d)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm'
                        : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-rose-300">{from?.name}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-semibold text-emerald-300">{to?.name}</span>
                    </div>
                    <span className="font-bold font-outfit text-white">
                      {formatRupees(d.amountPaise)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Payment Details */}
        <div className="mt-5 p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Paying To</span>
            <span className="text-sm font-semibold text-white flex items-center gap-1.5">
              <span 
                className="w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: toMember?.color || '#10b981' }} 
              />
              {toMember?.name}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Amount</span>
            <span className="text-xl font-bold font-outfit text-emerald-400">
              ₹{amountRupees.toFixed(2)}
            </span>
          </div>

          {/* UPI ID display */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">UPI ID</span>
              <span className="text-xs font-mono text-cyan-300">
                {upiId || 'No UPI ID registered'}
              </span>
            </div>

            {upiId && (
              <button
                type="button"
                onClick={handleCopyUpi}
                className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white transition-colors"
                title="Copy UPI ID"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* QR Code */}
          {upiId && qrUrl && (
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/10 text-center">
              <div className="p-2 bg-white rounded-xl shadow-lg mb-2">
                <img src={qrUrl} alt="UPI QR Code" className="w-36 h-36 object-contain" />
              </div>
              <span className="text-[11px] text-slate-400">Scan with GPay, PhonePe, or Paytm</span>
            </div>
          )}

          {/* Instant UPI Launch Button (Mobile) */}
          {upiLink && (
            <a
              href={upiLink}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <Smartphone className="w-4 h-4" />
              Open in UPI App (GPay / PhonePe / Paytm)
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Record Transaction Button */}
        <div className="mt-5 space-y-3">
          <input
            type="text"
            placeholder="Optional UPI Ref / UTR number"
            value={upiRef}
            onChange={(e) => setUpiRef(e.target.value)}
            className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />

          <button
            type="button"
            onClick={handleRecordSettlement}
            disabled={isSubmitting}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 hover:from-indigo-600 hover:to-cyan-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/20 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSubmitting ? 'Recording...' : 'Mark as Settled in TripMate'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
