'use client';

import React, { useState } from 'react';
import {
  Receipt,
  Calendar,
  ChevronDown,
  ChevronUp,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { formatRupees } from '@/lib/currency';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import type { ExpenseWithDetails } from '@/types';

import { HandCoins } from 'lucide-react';
import { shareExpenseToWhatsApp } from '@/lib/whatsapp';
import { useActiveTrip } from '@/components/shared/ActiveTripContext';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';

interface ExpenseCardProps {
  expense: ExpenseWithDetails;
  onDelete?: (id: string) => void;
  onSettleExpense?: (expense: ExpenseWithDetails) => void;
}

const SPLIT_TYPE_LABELS: Record<string, string> = {
  equal: 'Equal',
  exact: 'Exact',
  percentage: 'Percent',
  shares: 'Shares',
  itemized: 'Itemized',
  custom: 'Custom',
};

export function ExpenseCard({ expense, onDelete, onSettleExpense }: ExpenseCardProps) {
  const { trip } = useActiveTrip();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleShareWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    shareExpenseToWhatsApp(expense, trip?.name || 'TripMate', trip?.whatsapp_link);
  };

  return (
    <div className="raised-card p-4 transition-all duration-200">
      {/* Main row */}
      <div className="flex items-start justify-between gap-3">
        {/* Left: Category icon + info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Category pill */}
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
            style={{
              backgroundColor: expense.category?.color ? `${expense.category.color}18` : 'var(--accent-subtle)',
              border: `1px solid ${expense.category?.color || 'var(--accent)'}30`,
            }}
          >
            {expense.category?.icon || '💸'}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-[var(--text-primary)] truncate">
              {expense.title}
            </h4>

            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {/* Payer */}
              <div className="flex items-center gap-1">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: expense.paid_by_member?.color || 'var(--accent)' }}
                />
                <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                  {expense.paid_by_member?.name || 'Someone'}
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">paid</span>
              </div>

              <span className="text-[var(--border-strong)] text-[10px]">·</span>

              {/* Date */}
              <span className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-0.5">
                <Calendar className="w-2.5 h-2.5" />
                {expense.expense_date}
              </span>

              {/* Receipt badge */}
              {expense.receipt_url && (
                <Badge variant="info" size="xs">
                  <Receipt className="w-2.5 h-2.5" />
                  Bill
                </Badge>
              )}

              {/* GST badge */}
              {expense.gst_amount_paise != null && expense.gst_amount_paise > 0 && (
                <Badge variant="warning" size="xs">GST</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Right: Amount + splits toggle */}
        <div className="text-right flex-shrink-0">
          <div className="text-base font-extrabold font-outfit text-[var(--text-primary)]">
            {formatRupees(expense.amount_paise)}
          </div>
          <div className="flex items-center gap-1.5 justify-end mt-1">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              title="Share formatted expense to WhatsApp"
              className="p-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors"
            >
              <WhatsAppIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[11px] font-semibold flex items-center gap-0.5 transition-colors"
              style={{ color: 'var(--accent)' }}
            >
              <span>{expense.splits?.length || 0} splits</span>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded split breakdown */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-3 animate-fade-in">
          {/* Note */}
          {expense.note && (
            <p className="text-xs text-[var(--text-secondary)] italic px-3 py-2 rounded-xl" style={{ background: 'var(--surface-inset)' }}>
              &ldquo;{expense.note}&rdquo;
            </p>
          )}

          {/* Split type + GST info */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">
                Split:
              </span>
              <Badge variant="info" size="xs">
                {SPLIT_TYPE_LABELS[expense.split_type] || expense.split_type}
              </Badge>
              {expense.gst_amount_paise != null && expense.gst_amount_paise > 0 && (
                <span className="text-[10px] text-[var(--text-muted)] font-mono">
                  + {formatRupees(expense.gst_amount_paise)} GST ({expense.gst_rate_percent}%)
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center gap-1 transition-colors"
            >
              <WhatsAppIcon className="w-3 h-3" /> WhatsApp
            </button>
          </div>

          {/* Per-person breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {expense.splits?.map((split) => (
              <div
                key={split.id}
                className="flex items-center justify-between px-3 py-2 rounded-xl"
                style={{ background: 'var(--surface-inset)' }}
              >
                <div className="flex items-center gap-2">
                  <Avatar name={split.member?.name || '?'} color={split.member?.color} size="xs" />
                  <span className="text-xs font-medium text-[var(--text-primary)]">
                    {split.member?.name}
                  </span>
                </div>
                <span className="text-xs font-bold font-mono text-[var(--text-primary)]">
                  {formatRupees(split.amount_paise)}
                </span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            {expense.receipt_url ? (
              <a
                href={expense.receipt_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold flex items-center gap-1 transition-colors"
                style={{ color: 'var(--accent)' }}
              >
                <Receipt className="w-3 h-3" />
                View Receipt
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            ) : <div />}

            <div className="flex items-center gap-2">
              {onSettleExpense && (
                <button
                  type="button"
                  onClick={() => onSettleExpense(expense)}
                  className="text-xs font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
                >
                  <HandCoins className="w-3.5 h-3.5" /> Settle Expense
                </button>
              )}

              {onDelete && (
                <button
                  onClick={() => onDelete(expense.id)}
                  className="text-xs font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors"
                  style={{ color: 'var(--danger)' }}
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
