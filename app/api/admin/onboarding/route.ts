import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser, handleApiError } from '@/lib/api-utils';
import { requireAdmin } from '@/lib/admin-middleware';
import { logger } from '@/lib/logger';

/**
 * GET /api/admin/onboarding
 * List all creators pending onboarding
 */
export async function GET(request: NextRequest) {
  try {
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user) {
      return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin access
    const { isAdmin: userIsAdmin, error: adminError } = await requireAdmin(user.id);
    if (adminError) return adminError;

    const supabase = await createClient();

    // Get all creators with onboarding_completed = false
    const { data: creators, error } = await supabase
      .from('creator_profiles')
      .select(`
        id,
        user_id,
        bio,
        category,
        social_links,
        onboarding_completed,
        created_at,
        users!inner(
          id,
          display_name,
          email,
          photo_url,
          role,
          username
        )
      `)
      .eq('onboarding_completed', false)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch pending creators', 'ADMIN_ONBOARDING_API', { error: error.message });
      return NextResponse.json({ error: 'Failed to fetch pending creators' }, { status: 500 });
    }

    // Format the response
    const formattedCreators = (creators || []).map((creator) => {
      const userInfo = Array.isArray(creator.users) ? creator.users[0] : creator.users;
      return {
        id: creator.user_id,
        profileId: creator.id,
        displayName: userInfo?.display_name || '',
        email: userInfo?.email || '',
        username: userInfo?.username || '',
        photoUrl: userInfo?.photo_url || null,
        bio: creator.bio,
        category: creator.category,
        socialLinks: creator.social_links || {},
        createdAt: creator.created_at,
        onboardingCompleted: creator.onboarding_completed
      };
    });

    logger.info('Fetched pending creators for onboarding', 'ADMIN_ONBOARDING_API', {
      count: formattedCreators.length,
      adminUserId: user.id
    });

    return NextResponse.json({
      success: true,
      creators: formattedCreators,
      count: formattedCreators.length
    });
  } catch (error) {
    return handleApiError(error, 'ADMIN_ONBOARDING_API', 'Failed to fetch pending creators');
  }
}

/**
 * PATCH /api/admin/onboarding
 * Approve and onboard a creator
 */
export async function PATCH(request: NextRequest) {
  try {
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user) {
      return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin access
    const { isAdmin: userIsAdmin, error: adminError } = await requireAdmin(user.id);
    if (adminError) return adminError;

    const { creatorId } = await request.json();

    if (!creatorId) {
      return NextResponse.json({ error: 'Creator ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Update onboarding status
    const { error: updateError } = await supabase
      .from('creator_profiles')
      .update({ onboarding_completed: true })
      .eq('user_id', creatorId);

    if (updateError) {
      logger.error('Failed to onboard creator', 'ADMIN_ONBOARDING_API', {
        error: updateError.message,
        creatorId
      });
      return NextResponse.json({ error: 'Failed to onboard creator' }, { status: 500 });
    }

    logger.info('Creator onboarded successfully', 'ADMIN_ONBOARDING_API', {
      creatorId,
      adminUserId: user.id
    });

    return NextResponse.json({
      success: true,
      message: 'Creator onboarded successfully'
    });
  } catch (error) {
    return handleApiError(error, 'ADMIN_ONBOARDING_API', 'Failed to onboard creator');
  }
}
