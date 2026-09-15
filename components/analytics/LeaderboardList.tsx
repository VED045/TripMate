'use client';

import React from 'react';
import { Crown, Trophy, Medal, Flame, Sparkles } from 'lucide-react';
import { formatRupees } from '@/lib/currency';
import type { TopSpender, Member } from '@/types';

interface LeaderboardListProps {
  topSpenders: TopSpender[];
  mostPhotographed?: { member: Member; count: number } | null;
  topUploader?: { member: Member; count: number } | null;
}

export function LeaderboardList({
  topSpenders,
  mostPhotographed,
  topUploader,
}: LeaderboardListProps) {
  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-4 h-4 text-amber-500" />;
      case 2:
        return <Medal className="w-4 h-4 text-slate-400" />;
      case 3:
        return <Medal className="w-4 h-4 text-amber-700" />;
      default:
        return <span className="text-xs font-mono text-[var(--text-muted)]">#{rank}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Fun Trip Superlatives / Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {topSpenders[0] && (
          <div className="raised-card p-4 flex items-center gap-3.5 bg-[var(--surface-raised)] border border-[var(--border)]">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 text-xl shadow-sm">
              👑
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 font-mono">Chief Banker</span>
              <h4 className="text-sm font-extrabold text-[var(--text-primary)] font-outfit">{topSpenders[0].member.name}</h4>
              <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">{formatRupees(topSpenders[0].totalPaidPaise)} paid</p>
            </div>
          </div>
        )}

        {mostPhotographed && (
          <div className="raised-card p-4 flex items-center gap-3.5 bg-[var(--surface-raised)] border border-[var(--border)]">
            <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/15 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-500 text-xl shadow-sm">
              📸
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-600 dark:text-fuchsia-400 font-mono">Main Character</span>
              <h4 className="text-sm font-extrabold text-[var(--text-primary)] font-outfit">{mostPhotographed.member.name}</h4>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Tagged in {mostPhotographed.count} photos</p>
            </div>
          </div>
        )}
      </div>

      {/* Top Spenders Full Ranking */}
      <div className="raised-card p-5 md:p-6 space-y-4 bg-[var(--surface-raised)] border border-[var(--border)]">
        <h3 className="text-base font-extrabold font-outfit text-[var(--text-primary)] flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" /> Crew Spending Leaderboard
        </h3>

        <div className="space-y-2">
          {topSpenders.map((s) => (
            <div
              key={s.member.id}
              className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                s.rank === 1
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-[var(--surface-inset)] border-[var(--border)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-6 flex items-center justify-center">
                  {getRankBadge(s.rank)}
                </div>

                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
                  style={{ backgroundColor: s.member.color || '#6366f1' }}
                >
                  {s.member.name[0]?.toUpperCase()}
                </div>

                <span className="text-xs md:text-sm font-bold text-[var(--text-primary)]">
                  {s.member.name}
                </span>
              </div>

              <div className="text-right">
                <span className="text-xs md:text-sm font-extrabold font-outfit text-[var(--text-primary)] block">
                  {formatRupees(s.totalPaidPaise)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
