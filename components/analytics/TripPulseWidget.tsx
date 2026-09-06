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
    <div className="rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-900/80 to-cyan-950/30 border border-cyan-500/20 p-5 md:p-6 backdrop-blur-xl shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm md:text-base font-bold font-outfit text-white">Trip Pulse</h3>
          <p className="text-[11px] text-slate-400">Live trip dynamics & highlights</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {pulseItems.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors"
          >
            <span className="text-xl flex-shrink-0">{item.icon}</span>
            <div className="flex-1 text-xs text-slate-300">
              {item.text}
              {item.value && (
                <strong className="text-cyan-300 font-semibold ml-1">{item.value}</strong>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
