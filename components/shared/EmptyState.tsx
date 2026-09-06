'use client';

import React from 'react';
import { LucideIcon, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  emoji,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-3xl bg-white/[0.02] border border-dashed border-white/10 ${className}`}>
      {emoji ? (
        <span className="text-4xl md:text-5xl mb-3 animate-bounce">{emoji}</span>
      ) : Icon ? (
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-lg shadow-indigo-500/10">
          <Icon className="w-7 h-7" />
        </div>
      ) : (
        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
          <Sparkles className="w-7 h-7" />
        </div>
      )}

      <h3 className="text-base md:text-lg font-bold font-outfit text-white mb-1 tracking-tight">
        {title}
      </h3>
      <p className="text-xs md:text-sm text-slate-400 max-w-sm mb-5 leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 hover:from-indigo-600 hover:to-cyan-500 text-white font-medium text-xs md:text-sm shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
