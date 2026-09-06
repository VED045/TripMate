'use client';

import React from 'react';
import { 
  Camera, 
  Wallet, 
  Smartphone, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2,
  Crown,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { formatRupees } from '@/lib/currency';
import type { Member } from '@/types';

interface PersonCardProps {
  member: Member;
  totalPaidPaise?: number;
  totalOwedPaise?: number;
  netBalancePaise?: number;
  photoCount?: number;
  onClick?: () => void;
}

export function PersonCard({
  member,
  totalPaidPaise = 0,
  totalOwedPaise = 0,
  netBalancePaise = 0,
  photoCount = 0,
  onClick,
}: PersonCardProps) {
  const isOwed = netBalancePaise > 0;
  const isDebt = netBalancePaise < 0;

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-3xl glass-panel glass-panel-hover p-5 transition-all duration-300 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Avatar & Name */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-base font-extrabold text-white shadow-xl relative flex-shrink-0"
            style={{ 
              backgroundColor: member.color || '#6366f1',
              boxShadow: `0 8px 24px -6px ${member.color || '#6366f1'}60`
            }}
          >
            {member.name[0]?.toUpperCase()}
            {member.is_admin && (
              <span className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-amber-400 text-slate-950 shadow-md border-2 border-[#0c1228]" title="Admin">
                <Crown className="w-3 h-3" />
              </span>
            )}
          </div>

          <div className="min-w-0">
            <h4 className="font-bold text-base text-white tracking-tight flex items-center gap-1.5 truncate">
              {member.name}
            </h4>
            {member.upi_id ? (
              <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1 mt-0.5 truncate">
                <Smartphone className="w-3 h-3 flex-shrink-0" /> {member.upi_id}
              </span>
            ) : (
              <span className="text-[11px] text-slate-500 block mt-0.5">No UPI registered</span>
            )}
          </div>
        </div>

        {/* Net balance badge */}
        <div className="flex-shrink-0">
          <div className={`text-xs font-bold font-outfit px-3 py-1.5 rounded-2xl border ${
            isOwed 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
              : isDebt 
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/25' 
              : 'bg-white/[0.05] text-slate-300 border-white/10'
          }`}>
            {netBalancePaise === 0 
              ? 'All Settled' 
              : `${isOwed ? '+' : '-'}${formatRupees(Math.abs(netBalancePaise))}`}
          </div>
        </div>
      </div>

      {/* Stats footer */}
      <div className="mt-5 pt-3.5 border-t border-white/[0.06] grid grid-cols-2 gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Wallet className="w-3.5 h-3.5 text-indigo-400" />
          <span>Paid: <strong className="text-slate-100 font-semibold">{formatRupees(totalPaidPaise)}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 justify-end">
          <Camera className="w-3.5 h-3.5 text-cyan-400" />
          <span><strong className="text-slate-100 font-semibold">{photoCount}</strong> photos</span>
        </div>
      </div>
    </div>
  );
}
