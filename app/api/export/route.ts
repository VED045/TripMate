import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { paiseToRupees } from '@/lib/currency';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get('trip_id');
    const format = searchParams.get('format') || 'json'; // 'json' | 'csv'

    if (!tripId) {
      return NextResponse.json({ error: 'trip_id required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Fetch all trip data
    const [tripRes, membersRes, categoriesRes, expensesRes, settlementsRes, mediaRes, timelineRes] = await Promise.all([
      supabase.from('trips').select('*').eq('id', tripId).single(),
      supabase.from('members').select('*').eq('trip_id', tripId),
      supabase.from('categories').select('*').or(`trip_id.eq.${tripId},trip_id.is.null`),
      supabase.from('expenses').select('*, expense_splits(*), paid_by_member:paid_by(name), category:category_id(name)').eq('trip_id', tripId),
      supabase.from('settlements').select('*, from_member:from_member_id(name), to_member:to_member_id(name)').eq('trip_id', tripId),
      supabase.from('media').select('*, uploader:uploader_id(name)').eq('trip_id', tripId),
      supabase.from('timeline_events').select('*').eq('trip_id', tripId).order('event_time', { ascending: true }),
    ]);

    const data = {
      trip: tripRes.data,
      members: membersRes.data || [],
      categories: categoriesRes.data || [],
      expenses: expensesRes.data || [],
      settlements: settlementsRes.data || [],
      media: mediaRes.data || [],
      timeline: timelineRes.data || [],
      exported_at: new Date().toISOString(),
    };

    if (format === 'csv') {
      // Export Expenses as CSV
      const rows = [
        ['Date', 'Title', 'Category', 'Paid By', 'Amount (INR)', 'Split Type', 'Note'],
        ...(data.expenses || []).map((e: any) => [
          e.expense_date,
          `"${(e.title || '').replace(/"/g, '""')}"`,
          e.category?.name || 'General',
          e.paid_by_member?.name || 'Unknown',
          paiseToRupees(e.amount_paise).toFixed(2),
          e.split_type,
          `"${(e.note || '').replace(/"/g, '""')}"`,
        ]),
      ];

      const csvContent = rows.map((r) => r.join(',')).join('\n');
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${data.trip?.slug || 'trip'}-expenses.csv"`,
        },
      });
    }

    // Default JSON export
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${data.trip?.slug || 'trip'}-export.json"`,
      },
    });
  } catch (err: unknown) {
    console.error('[GET /api/export]', err);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
