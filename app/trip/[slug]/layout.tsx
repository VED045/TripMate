import React from 'react';
import { ActiveTripProvider } from '@/components/shared/ActiveTripContext';
import { Sidebar } from '@/components/shared/Sidebar';
import { BottomNav } from '@/components/shared/BottomNav';
import { createServiceClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createServiceClient();

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  const query = supabase.from('trips').select('*');
  const { data: trip, error } = isUUID
    ? await query.eq('id', slug).single()
    : await query.eq('slug', slug).single();

  if (error || !trip) {
    notFound();
  }

  const { data: members } = await supabase
    .from('members')
    .select('*')
    .eq('trip_id', trip.id)
    .order('created_at', { ascending: true });

  return (
    <ActiveTripProvider
      slug={trip.slug}
      initialTrip={trip}
      initialMembers={members || []}
    >
      {/* Root shell — uses CSS tokens for background/text, supports light+dark */}
      <div
        className="min-h-screen flex flex-col md:flex-row antialiased"
        style={{
          background: 'var(--background)',
          color: 'var(--text-primary)',
        }}
      >
        {/* Desktop sidebar */}
        <Sidebar slug={trip.slug} />

        {/* Main content area */}
        <main className="flex-1 flex flex-col min-w-0 pb-nav overflow-x-hidden">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <BottomNav slug={trip.slug} />
      </div>
    </ActiveTripProvider>
  );
}
