import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { calculateNetBalances, simplifyDebts } from '@/lib/settlement/engine';
import { rupeesToPaise } from '@/lib/currency';

// GET /api/settlements?trip_id=xxx — get simplified debts + existing settlements
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get('trip_id');
    if (!tripId) return NextResponse.json({ error: 'trip_id required' }, { status: 400 });

    const supabase = createServiceClient();

    // Get all expenses with splits
    const { data: expenses, error: expError } = await supabase
      .from('expenses')
      .select('id, paid_by, amount_paise, splits:expense_splits(member_id, amount_paise)')
      .eq('trip_id', tripId);
    if (expError) throw expError;

    // Get all settlements
    const { data: settlements, error: setError } = await supabase
      .from('settlements')
      .select('*, from_member:members!settlements_from_member_id_fkey(id,name,color), to_member:members!settlements_to_member_id_fkey(id,name,color)')
      .eq('trip_id', tripId)
      .order('settled_at', { ascending: false });
    if (setError) throw setError;

    // Calculate simplified debts
    const expenseData = (expenses || []).map(e => ({
      paidByMemberId: e.paid_by,
      amountPaise: e.amount_paise,
      splits: (e.splits as Array<{ member_id: string; amount_paise: number }>).map(s => ({
        memberId: s.member_id,
        amountPaise: s.amount_paise,
      })),
    }));

    const settlementData = (settlements || []).map(s => ({
      fromMemberId: s.from_member_id,
      toMemberId: s.to_member_id,
      amountPaise: s.amount_paise,
    }));

    const balances = calculateNetBalances(expenseData, settlementData);
    const simplifiedDebts = simplifyDebts(balances);

    return NextResponse.json({
      balances,
      simplifiedDebts,
      settlements,
    });
  } catch (err: unknown) {
    console.error('[GET /api/settlements]', err);
    return NextResponse.json({ error: 'Failed to calculate settlements' }, { status: 500 });
  }
}

// POST /api/settlements — record a settlement
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { trip_id, from_member_id, to_member_id, amount_rupees, upi_ref, note, recorded_by } = body;

    if (!trip_id || !from_member_id || !to_member_id || !amount_rupees) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('settlements')
      .insert({
        trip_id,
        from_member_id,
        to_member_id,
        amount_paise: rupeesToPaise(Number(amount_rupees)),
        upi_ref: upi_ref || null,
        note: note || null,
        recorded_by: recorded_by || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Timeline event
    await supabase.from('timeline_events').insert({
      trip_id,
      event_type: 'settlement_recorded',
      title: 'Settlement recorded',
      description: `₹${amount_rupees} settled`,
      icon: '✅',
      color: '#10b981',
      settlement_id: data.id,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    console.error('[POST /api/settlements]', err);
    const message = err instanceof Error ? err.message : 'Failed to record settlement';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
