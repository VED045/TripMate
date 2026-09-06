import React from 'react';
import { ActiveTripProvider } from '@/components/shared/ActiveTripContext';
import { Sidebar } from '@/components/shared/Sidebar';
import { BottomNav } from '@/components/shared/BottomNav';
import { PwaInstallPrompt } from '@/components/pwa/PwaInstallPrompt';
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
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <Sidebar slug={trip.slug} />

        <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
          {children}
        </div>

        <BottomNav slug={trip.slug} />
        <PwaInstallPrompt />
      </div>
    </ActiveTripProvider>
  );
}
