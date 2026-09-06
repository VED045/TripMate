'use client';

import React from 'react';
import { 
  Calendar, 
  Wallet, 
  Camera, 
  FolderPlus, 
  UserPlus, 
  HandCoins, 
  Rocket, 
  Sparkles,
  MapPin
} from 'lucide-react';
import type { TimelineEvent } from '@/types';

interface TimelineFeedProps {
  events: TimelineEvent[];
  onAddMoment?: () => void;
}

export function TimelineFeed({ events, onAddMoment }: TimelineFeedProps) {
  const getEventIcon = (event: TimelineEvent) => {
    switch (event.event_type) {
      case 'trip_started':
        return <Rocket className="w-4 h-4 text-indigo-400" />;
      case 'expense_created':
        return <Wallet className="w-4 h-4 text-pink-400" />;
      case 'media_uploaded':
        return <Camera className="w-4 h-4 text-cyan-400" />;
      case 'album_created':
        return <FolderPlus className="w-4 h-4 text-amber-400" />;
      case 'member_added':
        return <UserPlus className="w-4 h-4 text-emerald-400" />;
      case 'settlement_recorded':
        return <HandCoins className="w-4 h-4 text-teal-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-white/10">
      {events.map((event) => (
        <div key={event.id} className="relative group">
          {/* Timeline Dot / Icon */}
          <div
            className="absolute -left-6 top-1 w-6 h-6 rounded-full bg-slate-900 border border-white/20 flex items-center justify-center text-xs shadow-md transition-transform group-hover:scale-110"
            style={{ borderColor: event.color || undefined }}
          >
            {event.icon ? (
              <span className="text-xs">{event.icon}</span>
            ) : (
              getEventIcon(event)
            )}
          </div>

          {/* Event Content Box */}
          <div className="rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 p-4 transition-all duration-200">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-white tracking-tight">
                {event.title}
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">
                {new Date(event.event_time).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {event.description && (
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {event.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
