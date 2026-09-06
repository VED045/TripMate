'use client';

import React, { useState } from 'react';
import { 
  Receipt, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  ExternalLink,
  Layers,
  Percent,
  Divide,
  Wallet
} from 'lucide-react';
import { formatRupees } from '@/lib/currency';
import type { ExpenseWithDetails } from '@/types';

interface ExpenseCardProps {
  expense: ExpenseWithDetails;
  onDelete?: (id: string) => void;
}

export function ExpenseCard({ expense, onDelete }: ExpenseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-3xl glass-panel glass-panel-hover p-4 sm:p-5 transition-all duration-300">
      <div className="flex items-start justify-between gap-3">
        {/* Category Icon / Left */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <div 
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 shadow-lg"
            style={{ 
              backgroundColor: expense.category?.color ? `${expense.category.color}20` : 'rgba(99, 102, 241, 0.2)',
              border: `1px solid ${expense.category?.color || '#6366f1'}35`
            }}
          >
            {expense.category?.icon || '💸'}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
              {expense.title}
            </h4>

            <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <span 
                  className="w-2 h-2 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: expense.paid_by_member?.color || '#6366f1' }}
                />
                <strong className="text-slate-200">{expense.paid_by_member?.name || 'Someone'}</strong> paid
              </span>

              <span className="text-slate-600">•</span>

              <span className="flex items-center gap-1 text-slate-400 font-mono">
                <Calendar className="w-3 h-3 text-slate-500" />
                {expense.expense_date}
              </span>

              {expense.receipt_url && (
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-semibold flex items-center gap-1">
                  <Receipt className="w-2.5 h-2.5" /> Bill
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Amount */}
        <div className="text-right flex-shrink-0">
          <div className="text-base sm:text-lg font-extrabold font-outfit text-white">
            {formatRupees(expense.amount_paise)}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 ml-auto mt-1 transition-colors"
          >
            <span>{expense.splits?.length || 0} splits</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Split Breakdown */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-white/[0.08] space-y-3">
          {expense.note && (
            <p className="text-xs text-slate-300 italic bg-white/[0.03] p-3 rounded-2xl border border-white/5">
              &quot;{expense.note}&quot;
            </p>
          )}

          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Split Type: <span className="text-cyan-400">{expense.split_type}</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {expense.splits?.map((split) => (
                <div key={split.id} className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="flex items-center gap-2 text-slate-200 font-medium">
                    <span 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: split.member?.color || '#6366f1' }}
                    />
                    {split.member?.name}
                  </span>
                  <span className="font-bold font-outfit text-slate-100">
                    {formatRupees(split.amount_paise)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions & Bill Link */}
          <div className="flex items-center justify-between pt-2">
            {expense.receipt_url ? (
              <a
                href={expense.receipt_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-1.5"
              >
                <Receipt className="w-3.5 h-3.5" /> View Receipt Image <ExternalLink className="w-3 h-3" />
              </a>
            ) : <div />}

            {onDelete && (
              <button
                onClick={() => onDelete(expense.id)}
                className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors px-2.5 py-1 rounded-xl hover:bg-rose-500/10"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Expense
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
