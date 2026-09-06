'use client';

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  HandCoins, 
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { formatRupees } from '@/lib/currency';
import type { Member } from '@/types';

interface BalanceCardProps {
  currentMember: Member | null;
  netBalancePaise: number; // positive = gets back, negative = owes
  totalPaidPaise: number;
  totalOwedPaise: number;
  onSettleUp: () => void;
}

export function BalanceCard({
  currentMember,
  netBalancePaise,
  totalPaidPaise,
  totalOwedPaise,
  onSettleUp,
}: BalanceCardProps) {
  const isOwed = netBalancePaise > 0;
  const isDebt = netBalancePaise < 0;
  const isSettled = netBalancePaise === 0;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1228] via-[#080d1e] to-[#050711] border border-white/[0.1] p-5 sm:p-6 shadow-2xl backdrop-blur-2xl">
      {/* Background ambient lighting */}
      <div 
        className={`absolute -top-16 -right-16 w-52 h-52 rounded-full blur-[90px] pointer-events-none opacity-30 ${
          isOwed ? 'bg-emerald-500' : isDebt ? 'bg-rose-500' : 'bg-cyan-500'
        }`}
      />

      <div className="relative z-10">
        {/* Header pill */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-400">Personal Balance</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/[0.06] text-slate-200 font-semibold border border-white/5">
              {currentMember?.name || 'You'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold">
            {isOwed && (
              <span className="text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/25">
                <TrendingUp className="w-3.5 h-3.5" /> Gets Refund
              </span>
            )}
            {isDebt && (
              <span className="text-rose-400 flex items-center gap-1 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/25">
                <TrendingDown className="w-3.5 h-3.5" /> You Owe
              </span>
            )}
            {isSettled && (
              <span className="text-cyan-400 flex items-center gap-1 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/25">
                <CheckCircle2 className="w-3.5 h-3.5" /> All Settled
              </span>
            )}
          </div>
        </div>

        {/* Main Big Rupee Amount */}
        <div className="mt-4">
          <div className={`text-4xl sm:text-5xl font-extrabold font-outfit tracking-tight ${
            isOwed ? 'text-emerald-400' : isDebt ? 'text-rose-400' : 'text-slate-100'
          }`}>
            {isSettled ? '₹0.00' : `${isOwed ? '+' : '-'}${formatRupees(Math.abs(netBalancePaise))}`}
          </div>
          <p className="text-xs text-slate-400 mt-1.5 font-normal">
            {isOwed && 'You paid more than your share. You will receive payments from crew.'}
            {isDebt && 'You have unpaid shares for trip bills. 1-tap settle up via UPI.'}
            {isSettled && 'Zero pending debts or refunds for your account.'}
          </p>
        </div>

        {/* Breakdown bar */}
        <div className="mt-6 grid grid-cols-2 gap-3 pt-5 border-t border-white/[0.08]">
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
            <span className="text-[11px] text-slate-400 font-medium block">Total Paid by You</span>
            <span className="text-sm sm:text-base font-bold font-outfit text-slate-100 mt-0.5 block">
              {formatRupees(totalPaidPaise)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
            <span className="text-[11px] text-slate-400 font-medium block">Your Exact Share</span>
            <span className="text-sm sm:text-base font-bold font-outfit text-slate-100 mt-0.5 block">
              {formatRupees(totalOwedPaise)}
            </span>
          </div>
        </div>

        {/* Action Button */}
        {isDebt && (
          <button
            id="balance-card-settle-button"
            onClick={onSettleUp}
            className="mt-4 w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs shadow-xl shadow-rose-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <HandCoins className="w-4 h-4" />
            <span>Settle Up via UPI Instant</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {isOwed && (
          <button
            id="balance-card-view-settlements-button"
            onClick={onSettleUp}
            className="mt-4 w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>View Who Owes You</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
