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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl">
          <div>
            <h2 className="text-xl font-bold font-outfit text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" /> Trip Story Stream
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Every expense, upload, settlement and memory recorded in real-time
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all active:scale-95"
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
