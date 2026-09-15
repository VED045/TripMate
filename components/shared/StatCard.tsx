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

const colorBadgeStyles = {
  indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
  cyan: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20',
  pink: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
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
  const badgeStyle = colorBadgeStyles[color];

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl raised-card bg-[var(--surface-raised)] border border-[var(--border)] p-3.5 sm:p-4 md:p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className="text-[10px] sm:text-[11px] font-bold font-mono text-[var(--text-muted)] tracking-wider uppercase block truncate">
            {title}
          </span>
          <div className="mt-1 text-base sm:text-xl md:text-2xl font-extrabold font-outfit text-[var(--text-primary)] tracking-tight whitespace-nowrap overflow-x-auto scrollbar-none">
            {value}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-[var(--text-muted)] font-medium truncate">{subtitle}</p>
          )}
        </div>

        {Icon && (
          <div className={`p-2 sm:p-2.5 rounded-xl shrink-0 ${badgeStyle} transition-transform group-hover:scale-105`}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-2 text-[10px] sm:text-[11px] font-medium text-[var(--text-muted)] flex items-center gap-1">
          {trend}
        </div>
      )}
    </div>
  );
}
