import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
    try {
        const tripId = req.nextUrl.searchParams.get('trip_id');

        if (!tripId) {
            return NextResponse.json(
                { error: 'trip_id is required' },
                { status: 400 }
            );
        }

        const supabase = createServiceClient();

        const { data, error } = await supabase
            .from('media')
            .select(`
        *,
        tags:media_tags(
          id,
          member_id
        )
      `)
            .eq('trip_id', tripId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[GET /api/media]', error);

            return NextResponse.json(
                { error: 'Failed to fetch media', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(data || []);
    } catch (err) {
        console.error('[GET /api/media]', err);

        return NextResponse.json(
            { error: 'Failed to fetch media' },
            { status: 500 }
        );
    }
}