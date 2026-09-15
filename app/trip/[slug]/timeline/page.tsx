'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Plus,
  Sparkles,
  Calendar
} from 'lucide-react';
import { useActiveTrip } from '@/components/shared/ActiveTripContext';
import { TripHeader } from '@/components/shared/TripHeader';
import { TimelineFeed } from '@/components/timeline/TimelineFeed';
import { AddTimelineModal } from '@/components/timeline/AddTimelineModal';
import { EmptyState } from '@/components/shared/EmptyState';
import { ListSkeleton } from '@/components/shared/SkeletonLoader';
import { FloatingActionButton } from '@/components/shared/FloatingActionButton';
import type { TimelineEvent } from '@/types';

export default function TimelinePage() {
  const { trip, refreshTrip } = useActiveTrip();

  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTimeline = async () => {
    if (!trip) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/timeline?trip_id=${trip.id}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [trip?.id]);

  if (!trip) {
    return <div className="p-6"><ListSkeleton /></div>;
  }

  return (
    <div className="flex-1 flex flex-col">
      <TripHeader title="Trip Timeline & Moments" subtitle="Chronological journey of milestones, stories & expenses" />

      <main className="max-w-4xl mx-auto w-full px-4 md:px-6 py-6 space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl raised-card bg-gradient-to-r from-amber-500/10 via-[var(--surface-raised)] to-[var(--surface-raised)] border border-amber-500/30">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold font-outfit text-[var(--text-primary)] flex items-center gap-2">
                Trip Story Stream
              </h2>
              <p className="text-xs font-medium text-[var(--text-secondary)] mt-1 leading-relaxed">
                Every expense, upload, settlement and memory recorded in real-time
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-[#2b56ff] hover:bg-[#163ecf] text-white font-bold text-xs shadow-lg shadow-[#2b56ff]/25 flex items-center gap-2 transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Moment
          </button>
        </div>

        {/* Timeline Events Feed */}
        {events.length > 0 ? (
          <TimelineFeed
            events={events}
            onAddMoment={() => setIsAddModalOpen(true)}
          />
        ) : (
          <EmptyState
            emoji="✨"
            title="No timeline events yet"
            description="Your trip events, expenses, photo milestones and custom moments will appear here chronologically."
            actionLabel="Add First Moment"
            onAction={() => setIsAddModalOpen(true)}
          />
        )}
      </main>

      <FloatingActionButton
        onAddExpense={() => { }}
        onUploadMedia={() => { }}
        onSettleUp={() => { }}
        onAddTimeline={() => setIsAddModalOpen(true)}
      />

      <AddTimelineModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        tripId={trip.id}
        onSuccess={() => {
          fetchTimeline();
          refreshTrip();
        }}
      />
    </div>
  );
}
