import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { rupeesToPaise, divideEquallyPaise, calculatePercentageSplits, calculateSharesSplits } from '@/lib/currency';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get('trip_id');
    if (!tripId) return NextResponse.json({ error: 'trip_id required' }, { status: 400 });

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        paid_by_member:members!expenses_paid_by_fkey(id, name, color, avatar_url),
        splits:expense_splits(*, member:members(id, name, color)),
        category:categories(id, name, icon, color)
      `)
      .eq('trip_id', tripId)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('[GET /api/expenses]', err);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      trip_id, title, amount_rupees, paid_by, split_type = 'equal',
      participant_ids, splits: rawSplits, category_id, note, expense_date,
      created_by,
    } = body;

    if (!trip_id || !title || !amount_rupees || !paid_by) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const totalPaise = rupeesToPaise(Number(amount_rupees));
    const supabase = createServiceClient();

    // Calculate splits
    let splitAmounts: { member_id: string; amount_paise: number; percentage?: number; shares?: number }[] = [];

    if (split_type === 'equal') {
      const amounts = divideEquallyPaise(totalPaise, participant_ids.length);
      splitAmounts = participant_ids.map((id: string, i: number) => ({
        member_id: id,
        amount_paise: amounts[i],
      }));
    } else if (split_type === 'exact') {
      splitAmounts = rawSplits.map((s: { member_id: string; value: number }) => ({
        member_id: s.member_id,
        amount_paise: rupeesToPaise(s.value),
      }));
    } else if (split_type === 'percentage') {
      const percentages = rawSplits.map((s: { value: number }) => s.value);
      const amounts = calculatePercentageSplits(totalPaise, percentages);
      splitAmounts = rawSplits.map((s: { member_id: string; value: number }, i: number) => ({
        member_id: s.member_id,
        amount_paise: amounts[i],
        percentage: s.value,
      }));
    } else if (split_type === 'shares') {
      const shares = rawSplits.map((s: { value: number }) => s.value);
      const amounts = calculateSharesSplits(totalPaise, shares);
      splitAmounts = rawSplits.map((s: { member_id: string; value: number }, i: number) => ({
        member_id: s.member_id,
        amount_paise: amounts[i],
        shares: s.value,
      }));
    }

    // Insert expense
    const { data: expense, error: expError } = await supabase
      .from('expenses')
      .insert({
        trip_id,
        title: title.trim(),
        amount_paise: totalPaise,
        paid_by,
        split_type,
        category_id: category_id || null,
        note: note || null,
        expense_date: expense_date || new Date().toISOString().split('T')[0],
        created_by: created_by || null,
      })
      .select()
      .single();

    if (expError) throw expError;

    // Insert splits
    const { error: splitError } = await supabase
      .from('expense_splits')
      .insert(splitAmounts.map(s => ({ ...s, expense_id: expense.id })));

    if (splitError) throw splitError;

    // Add timeline event
    await supabase.from('timeline_events').insert({
      trip_id,
      event_type: 'expense_created',
      title: `New expense: ${title}`,
      description: `₹${amount_rupees} added`,
      icon: '💰',
      color: '#10b981',
      expense_id: expense.id,
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (err: unknown) {
    console.error('[POST /api/expenses]', err);
    const message = err instanceof Error ? err.message : 'Failed to create expense';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const supabase = createServiceClient();

    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[DELETE /api/expenses]', err);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
