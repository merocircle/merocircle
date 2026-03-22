import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { getAuthenticatedUser, handleApiError } from '@/lib/api-utils';

/**
 * POST /api/creator/signup
 * Creates a creator_profiles record for the current user server-side.
 */
export async function POST(request: NextRequest) {
  try {
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user) return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { bio, category, social_links, vanity_username } = body;

    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    const supabase = await createClient();

    const payload: Record<string, unknown> = {
      user_id: user.id,
      bio: bio ?? null,
      category,
      social_links: social_links ?? {},
    };

    if (vanity_username) {
      payload.vanity_username = vanity_username.trim().toLowerCase();
    }

    const { data: creatorProfile, error: createError } = await supabase
      .from('creator_profiles')
      .insert(payload as any)
      .select()
      .single();

    if (createError) {
      if (createError.code === '23505') {
        const { data: existing } = await supabase
          .from('creator_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        logger.info('Creator profile already exists', 'CREATOR_SIGNUP_API', { userId: user.id });
        return NextResponse.json({ creatorProfile: existing });
      }
      logger.error('Failed to create creator profile', 'CREATOR_SIGNUP_API', { error: createError.message, userId: user.id });
      return NextResponse.json({ error: 'Failed to create creator profile' }, { status: 500 });
    }

    logger.info('Creator profile created', 'CREATOR_SIGNUP_API', { userId: user.id });
    return NextResponse.json({ creatorProfile }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'CREATOR_SIGNUP_API', 'Failed to create creator profile');
  }
}
