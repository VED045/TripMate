'use client';

import React from 'react';
import { Sparkles, Activity } from 'lucide-react';
import type { TripPulseItem } from '@/types';

interface TripPulseWidgetProps {
  pulseItems: TripPulseItem[];
}

export function TripPulseWidget({ pulseItems }: TripPulseWidgetProps) {
  if (pulseItems.length === 0) return null;

  return (
    <div className="raised-card p-4 md:p-5 space-y-3.5 bg-[var(--surface-raised)] border border-[var(--border)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)' }}
          >
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold font-outfit text-[var(--text-primary)]">Trip Pulse</h3>
            <p className="text-[10px] text-[var(--text-muted)] font-medium">Live group dynamics & trip highlights</p>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold font-mono text-[var(--accent)] bg-[var(--accent-subtle)] border border-[var(--border)]">
          <Activity className="w-3 h-3 animate-pulse" />
          <span>LIVE</span>
        </div>
      </div>

      <div className="space-y-2">
        {pulseItems.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-inset)] border border-[var(--border)] shadow-[var(--shadow-inset)] transition-transform hover:scale-[1.01]"
          >
            <span className="text-lg flex-shrink-0">{item.icon}</span>
            <div className="flex-1 text-xs text-[var(--text-primary)] font-medium">
              {item.text}
              {item.value && (
                <strong className="text-[var(--accent)] font-bold ml-1 font-outfit text-sm">{item.value}</strong>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
