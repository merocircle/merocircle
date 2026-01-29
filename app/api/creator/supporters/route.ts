import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { getAuthenticatedUser, requireCreatorRole, handleApiError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/creator/supporters
 * Returns all supporters for the authenticated creator
 */
export async function GET() {
  try {
    // Authenticate and verify creator role
    const { user, errorResponse: authError } = await getAuthenticatedUser();
    if (authError || !user) return authError || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { isCreator, errorResponse: roleError } = await requireCreatorRole(user.id);
    if (roleError) return roleError;

    const supabase = await createClient();

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
    return handleApiError(error, 'CREATOR_SUPPORTERS', 'Failed to fetch supporters');
  }
}
