'use client';

import React from 'react';
import { Sparkles, HandCoins, CheckCircle2, ShieldCheck } from 'lucide-react';
import { PaymentCard } from './PaymentCard';
import { EmptyState } from '@/components/shared/EmptyState';
import type { Member, SimplifiedDebt } from '@/types';

interface SmartSettlePanelProps {
  simplifiedDebts: SimplifiedDebt[];
  members: Member[];
  currentMemberId?: string;
  onPayIndividual: (debt: SimplifiedDebt) => void;
  onSettleAll: () => void;
}

export function SmartSettlePanel({
  simplifiedDebts,
  members,
  currentMemberId,
  onPayIndividual,
  onSettleAll,
}: SmartSettlePanelProps) {
  if (simplifiedDebts.length === 0) {
    return (
      <EmptyState
        emoji="🎉"
        title="All Debts Settled!"
        description="There are no active pending balances between group members."
      />
    );
  }

  const myDebts = simplifiedDebts.filter(
    d => (d.from_member_id || d.fromMemberId) === currentMemberId
  );
  const owedToMeDebts = simplifiedDebts.filter(
    d => (d.to_member_id || d.toMemberId) === currentMemberId
  );

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="raised-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--surface-raised)] border border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)' }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold font-outfit text-[var(--text-primary)]">
              Smart Debt Simplification
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Minimizes total group transfers down to {simplifiedDebts.length} simple payment{simplifiedDebts.length === 1 ? '' : 's'}.
            </p>
          </div>
        </div>

        <button
          onClick={onSettleAll}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-95 shadow-md flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
        >
          <HandCoins className="w-4 h-4" />
          Settle All Debts
        </button>
      </div>

      {/* Individual Debt Cards List */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] font-mono">
          Individual Debts ({simplifiedDebts.length})
        </p>

        {simplifiedDebts.map((debt, index) => (
          <PaymentCard
            key={index}
            debt={debt}
            members={members}
            currentMemberId={currentMemberId}
            onPay={onPayIndividual}
          />
        ))}
      </div>
    </div>
  );
}
