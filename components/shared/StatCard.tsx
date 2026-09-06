'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: string;
  color?: 'indigo' | 'cyan' | 'pink' | 'emerald' | 'amber';
  onClick?: () => void;
}

const colorStyles = {
  indigo: {
    bg: 'from-indigo-500/10 to-indigo-500/5',
    border: 'border-indigo-500/20',
    iconBg: 'bg-indigo-500/20 text-indigo-400',
    glow: 'group-hover:shadow-indigo-500/10',
  },
  cyan: {
    bg: 'from-cyan-500/10 to-cyan-500/5',
    border: 'border-cyan-500/20',
    iconBg: 'bg-cyan-500/20 text-cyan-400',
    glow: 'group-hover:shadow-cyan-500/10',
  },
  pink: {
    bg: 'from-pink-500/10 to-pink-500/5',
    border: 'border-pink-500/20',
    iconBg: 'bg-pink-500/20 text-pink-400',
    glow: 'group-hover:shadow-pink-500/10',
  },
  emerald: {
    bg: 'from-emerald-500/10 to-emerald-500/5',
    border: 'border-emerald-500/20',
    iconBg: 'bg-emerald-500/20 text-emerald-400',
    glow: 'group-hover:shadow-emerald-500/10',
  },
  amber: {
    bg: 'from-amber-500/10 to-amber-500/5',
    border: 'border-amber-500/20',
    iconBg: 'bg-amber-500/20 text-amber-400',
    glow: 'group-hover:shadow-amber-500/10',
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'indigo',
  onClick,
}: StatCardProps) {
  const styles = colorStyles[color];

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${styles.bg} border ${styles.border} p-4 md:p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${styles.glow} ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">{title}</span>
          <div className="mt-1 text-2xl md:text-3xl font-bold font-outfit text-white tracking-tight">
            {value}
          </div>
          {subtitle && <p className="mt-1 text-xs text-slate-400 font-medium">{subtitle}</p>}
        </div>

        {Icon && (
          <div className={`p-2.5 rounded-xl ${styles.iconBg} transition-transform group-hover:scale-110`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3 text-[11px] font-medium text-slate-400 flex items-center gap-1">
          {trend}
        </div>
      )}
    </div>
  );
}
