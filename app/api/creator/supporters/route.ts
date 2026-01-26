import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/creator/supporters
 * Returns all supporters for the authenticated creator
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a creator
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userProfile || userProfile.role !== 'creator') {
      return NextResponse.json({ error: 'Only creators can access this' }, { status: 403 });
    }

    // Get all active supporters for this creator
    const { data: supporters, error } = await supabase
      .from('supporters')
      .select(`
        id,
        supporter_id,
        tier_level,
        amount,
        is_active,
        created_at,
        user:supporter_id (
          id,
          display_name,
          photo_url
        )
      `)
      .eq('creator_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch supporters', 'CREATOR_SUPPORTERS', { error: error.message });
      return NextResponse.json({ error: 'Failed to fetch supporters' }, { status: 500 });
    }

    // Filter out any supporters without user data (shouldn't happen but just in case)
    const validSupporters = (supporters || []).filter(s => s.user);

    logger.info('Fetched creator supporters', 'CREATOR_SUPPORTERS', {
      creatorId: user.id,
      count: validSupporters.length
    });

    return NextResponse.json({ supporters: validSupporters });
  } catch (error) {
    logger.error('Error fetching supporters', 'CREATOR_SUPPORTERS', {
      error: error instanceof Error ? error.message : 'Unknown'
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
