import { NextResponse } from 'next/server';
import { createServiceClient, createSSRClient } from '@/lib/supabase/server';

export async function GET() {
  const sessionClient = await createSSRClient();
  const { data: { user }, error: authError } = await sessionClient.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  try {
    const supabase = createServiceClient();
    const tripMap = new Map<string, Record<string, unknown>>();
    const { data: links, error: linksError } = await supabase
      .from('user_trips')
      .select('member_id, role, trips(id, name, slug, currency, start_date, end_date, cover_image_url, created_at)')
      .eq('user_id', user.id);
    if (linksError && linksError.code !== 'PGRST205') throw linksError;

    for (const link of links || []) {
      const trip = Array.isArray(link.trips) ? link.trips[0] : link.trips;
      if (trip?.id) tripMap.set(trip.id, { ...trip, claimed_member_id: link.member_id, user_role: link.role });
    }

    // Supports accounts linked before user_trips existed without trusting a
    // client-supplied user ID or reading another person's auth metadata.
    const { data: memberLinks } = await supabase
      .from('members')
      .select('id, trip_id, trips(id, name, slug, currency, start_date, end_date, cover_image_url, created_at)')
      .eq('auth_user_id', user.id);
    for (const link of memberLinks || []) {
      const trip = Array.isArray(link.trips) ? link.trips[0] : link.trips;
      if (trip?.id && !tripMap.has(trip.id)) tripMap.set(trip.id, { ...trip, claimed_member_id: link.id, user_role: 'member' });
    }

    const enriched = await Promise.all([...tripMap.values()].map(async trip => {
      const [membersRes, expensesRes] = await Promise.all([
        supabase.from('members').select('id', { count: 'exact', head: true }).eq('trip_id', trip.id),
        supabase.from('expenses').select('amount_paise, paid_by').eq('trip_id', trip.id),
      ]);
      const expenses = (expensesRes.data || []) as Array<{ amount_paise: number; paid_by: string }>;
      const total_paise = expenses.reduce((sum, expense) => sum + expense.amount_paise, 0);
      const my_spent_paise = expenses
        .filter(expense => expense.paid_by === trip.claimed_member_id)
        .reduce((sum, expense) => sum + expense.amount_paise, 0);
      const endDate = typeof trip.end_date === 'string' ? trip.end_date : null;
      return { ...trip, total_paise, my_spent_paise, member_count: membersRes.count || 0, status: endDate && new Date(endDate) < new Date() ? 'completed' : 'active' };
    })) as Array<Record<string, unknown> & { total_paise: number; my_spent_paise: number; member_count: number; status: string }>;

    return NextResponse.json({
      trips: enriched,
      stats: {
        totalTrips: enriched.length,
        mySpent: enriched.reduce((sum, trip) => sum + trip.my_spent_paise, 0),
        totalTripSpend: enriched.reduce((sum, trip) => sum + trip.total_paise, 0),
        currency: (enriched[0]?.currency as string) || 'INR',
        activeTripCount: enriched.filter(trip => trip.status === 'active').length,
      },
    });
  } catch (error) {
    console.error('[GET /api/user/trips]', error);
    return NextResponse.json({ error: 'Failed to fetch user trips' }, { status: 500 });
  }
}
