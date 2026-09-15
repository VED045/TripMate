import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

const MEMBER_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f97316', 
  '#10b981', '#06b6d4', '#eab308', '#ef4444', 
  '#84cc16', '#f43f5e', '#14b8a6', '#a855f7'
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get('trip_id');
    const includeInactive = searchParams.get('include_inactive') === 'true';

    if (!tripId) {
      return NextResponse.json({ error: 'trip_id required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    let query = supabase
      .from('members')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true });

    if (!includeInactive) {
      query = query.or('is_active.eq.true,is_active.is.null');
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('[GET /api/members]', err);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { trip_id, name, upi_id, phone, color, is_admin } = body;

    if (!trip_id || !name?.trim()) {
      return NextResponse.json({ error: 'trip_id and name are required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const assignedColor = color || MEMBER_COLORS[Math.floor(Math.random() * MEMBER_COLORS.length)];

    const insertData: Record<string, unknown> = {
      trip_id,
      name: name.trim(),
      upi_id: upi_id?.trim() || null,
      color: assignedColor,
      is_admin: Boolean(is_admin),
      is_active: true,
    };
    if (phone?.trim()) insertData.phone = phone.trim();

    let { data, error } = await supabase
      .from('members')
      .insert(insertData)
      .select()
      .single();

    if (error && (error.code === 'PGRST204' || error.message?.includes('phone'))) {
      delete insertData.phone;
      const retry = await supabase
        .from('members')
        .insert(insertData)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) throw error;

    // Timeline event
    await supabase.from('timeline_events').insert({
      trip_id,
      event_type: 'member_added',
      title: `${name.trim()} joined the trip!`,
      description: 'New crew member added',
      icon: '👋',
      member_id: data.id,
      color: assignedColor,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    console.error('[POST /api/members]', err);
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, upi_id, phone, qr_code_url, color, avatar_url, is_admin, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'Member id is required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (upi_id !== undefined) updateData.upi_id = upi_id?.trim() || null;
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (qr_code_url !== undefined) updateData.qr_code_url = qr_code_url;
    if (color !== undefined) updateData.color = color;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    if (is_admin !== undefined) updateData.is_admin = is_admin;
    if (is_active !== undefined) updateData.is_active = is_active;
    updateData.updated_at = new Date().toISOString();

    let { data, error } = await supabase
      .from('members')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error && (error.code === 'PGRST204' || error.message?.includes('phone'))) {
      delete updateData.phone;
      const retry = await supabase
        .from('members')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('[PATCH /api/members]', err);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Member id is required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // 1. Fetch member to check trip_id
    const { data: member, error: memberErr } = await supabase
      .from('members')
      .select('id, trip_id, name')
      .eq('id', id)
      .single();

    if (memberErr || !member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // 2. Fetch all expenses for the trip to calculate net balance
    const { data: expenses } = await supabase
      .from('expenses')
      .select('paid_by, amount_paise, expense_splits(member_id, amount_paise)')
      .eq('trip_id', member.trip_id);

    let paidPaise = 0;
    let owedPaise = 0;

    (expenses || []).forEach((exp) => {
      if (exp.paid_by === id) paidPaise += exp.amount_paise || 0;
      const splits = exp.expense_splits as Array<{ member_id: string; amount_paise: number }> | undefined;
      (splits || []).forEach((s) => {
        if (s.member_id === id) owedPaise += s.amount_paise || 0;
      });
    });

    const netPaise = paidPaise - owedPaise;

    // 3. Block removal if outstanding balance is non-zero
    if (Math.abs(netPaise) > 0) {
      const formattedAmount = (Math.abs(netPaise) / 100).toFixed(2);
      const statusText = netPaise > 0 ? `is owed ₹${formattedAmount}` : `owes ₹${formattedAmount}`;
      return NextResponse.json(
        {
          error: `Cannot remove ${member.name}. They have an outstanding balance (${statusText}). Please settle all dues before removing member.`,
          netPaise,
        },
        { status: 400 }
      );
    }

    // 4. Perform soft deletion so historical records remain valid
    const { error: updateErr } = await supabase
      .from('members')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true, message: `${member.name} removed successfully.` });
  } catch (err: unknown) {
    console.error('[DELETE /api/members]', err);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
