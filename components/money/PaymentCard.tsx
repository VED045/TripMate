'use client';

import React from 'react';
import { ArrowRight, Smartphone } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { formatRupees } from '@/lib/currency';
import { cn } from '@/lib/utils';
import type { Member, SimplifiedDebt } from '@/types';

interface PaymentCardProps {
  debt: SimplifiedDebt;
  members: Member[];
  currentMemberId?: string;
  onPay: (debt: SimplifiedDebt) => void;
  className?: string;
}

export function PaymentCard({
  debt,
  members,
  currentMemberId,
  onPay,
  className,
}: PaymentCardProps) {
  const fromId = debt.from_member_id || debt.fromMemberId || '';
  const toId = debt.to_member_id || debt.toMemberId || '';
  const amountPaise = debt.amount_paise ?? debt.amountPaise ?? 0;

  const fromMember = members.find(m => m.id === fromId);
  const toMember = members.find(m => m.id === toId);

  const isMyDebt = fromId === currentMemberId;
  const isOwedToMe = toId === currentMemberId;

  if (!fromMember || !toMember) return null;

  return (
    <div
      className={cn(
        'raised-card p-4 transition-all hover:scale-[1.01] bg-[var(--surface-raised)] border border-[var(--border)]',
        isMyDebt && 'border-l-4 border-l-rose-500',
        isOwedToMe && 'border-l-4 border-l-emerald-500',
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* From & To Member Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center -space-x-2 shrink-0">
            <Avatar name={fromMember.name} color={fromMember.color} size="sm" className="ring-2 ring-[var(--surface)] shadow-sm" />
            <div className="w-5 h-5 rounded-full bg-[var(--surface-inset)] flex items-center justify-center border border-[var(--border)] z-10 text-[var(--text-muted)] shadow-inner">
              <ArrowRight className="w-3 h-3" />
            </div>
            <Avatar name={toMember.name} color={toMember.color} size="sm" className="ring-2 ring-[var(--surface)] shadow-sm" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={cn('text-xs font-extrabold truncate', isMyDebt ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--text-primary)]')}>
                {isMyDebt ? 'You' : fromMember.name}
              </span>
              <span className="text-xs font-bold text-[var(--text-muted)]">owes</span>
              <span className={cn('text-xs font-extrabold truncate', isOwedToMe ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-primary)]')}>
                {isOwedToMe ? 'You' : toMember.name}
              </span>
            </div>

            <p className="text-[10px] text-[var(--text-muted)] mt-0.5 font-mono truncate">
              {toMember.upi_id ? `UPI: ${toMember.upi_id}` : 'No UPI handle registered'}
            </p>
          </div>
        </div>

        {/* Amount & Settle CTA */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border)] shrink-0">
          <div className="text-left sm:text-right">
            <span
              className={cn(
                'text-lg sm:text-xl font-extrabold font-outfit tracking-tight block',
                isMyDebt ? 'text-rose-600 dark:text-rose-400' : isOwedToMe ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-primary)]'
              )}
            >
              {formatRupees(amountPaise)}
            </span>
            <span className="text-[9px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider block">
              {isMyDebt ? 'Payable Dues' : isOwedToMe ? 'Receivable' : 'Debt Pair'}
            </span>
          </div>

          <button
            id={`pay-debt-${fromId}-${toId}`}
            onClick={() => onPay(debt)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold text-white transition-all active:scale-95 shadow-md shrink-0"
            style={{
              background: isMyDebt
                ? 'linear-gradient(135deg, #2b56ff, #163ecf)'
                : 'linear-gradient(135deg, #10b981, #059669)',
              boxShadow: isMyDebt
                ? '0 4px 12px rgba(43,86,255,0.3)'
                : '0 4px 12px rgba(16,185,129,0.3)',
            }}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Settle Up</span>
          </button>
        </div>
      </div>
    </div>
  );
}
