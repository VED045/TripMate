import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const tripMap = new Map<string, any>();

    // 1. Fetch from trip_access table
    try {
      const { data: accessRows } = await supabase
        .from('trip_access')
        .select(`
          trip_id,
          member_id,
          trips (
            id, name, slug, currency, start_date, end_date, cover_image_url, created_at, created_by
          )
        `)
        .eq('user_agent', `auth:${userId}`);

      if (accessRows) {
        for (const ar of accessRows as any[]) {
          if (ar.trips && ar.trips.id) {
            tripMap.set(ar.trips.id, {
              ...ar.trips,
              claimed_member_id: ar.member_id,
              user_role: 'member',
            });
          }
        }
      }
    } catch (err) {
      console.warn('trip_access error:', err);
    }

    // 2. Fetch from auth user_metadata
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      const metaClaimed = userData?.user?.user_metadata?.claimed_trips || [];
      for (const item of metaClaimed) {
        if (item.trip_id && !tripMap.has(item.trip_id)) {
          const { data: tripData } = await supabase
            .from('trips')
            .select('id, name, slug, currency, start_date, end_date, cover_image_url, created_at, created_by')
            .eq('id', item.trip_id)
            .maybeSingle();

          if (tripData) {
            tripMap.set(tripData.id, {
              ...tripData,
              claimed_member_id: item.member_id,
              user_role: 'member',
            });
          }
        }
      }
    } catch (err) {
      console.warn('user_metadata error:', err);
    }

    const tripList = Array.from(tripMap.values());

    // Enrich trips with member counts and total expenses
    const enriched = await Promise.all(
      tripList.map(async (trip) => {
        const [membersRes, expensesRes] = await Promise.all([
          supabase.from('members').select('id', { count: 'exact', head: true }).eq('trip_id', trip.id),
          supabase.from('expenses').select('amount_paise').eq('trip_id', trip.id),
        ]);

        const total = (expensesRes.data || []).reduce((s: number, e: any) => s + (e.amount_paise || 0), 0);
        const isEnded = trip.end_date && new Date(trip.end_date) < new Date();

        return {
          ...trip,
          status: isEnded ? 'completed' : 'active',
          member_count: membersRes.count || 0,
          total_paise: total,
        };
      })
    );

    const grandTotal = enriched.reduce((s, t) => s + (t.total_paise || 0), 0);
    const stats = {
      totalTrips: enriched.length,
      totalSpent: grandTotal,
      currency: enriched[0]?.currency || 'INR',
      activeTripCount: enriched.filter((t) => t.status === 'active').length,
    };

    return NextResponse.json({ trips: enriched, stats });
  } catch (err: unknown) {
    console.error('[GET /api/user/trips]', err);
    return NextResponse.json({ error: 'Failed to fetch user trips' }, { status: 500 });
  }
}
