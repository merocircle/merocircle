import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser, handleApiError } from '@/lib/api-utils';

/**
 * GET /api/me
 * Returns the authenticated user's profile and creator profile.
 * Used by the frontend auth context instead of calling Supabase directly.
 */
export async function GET() {
  try {
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user) return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = await createClient();

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        return NextResponse.json({ userProfile: null, creatorProfile: null });
      }
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }

    let creatorProfile = null;
    if ((userProfile as any)?.role === 'creator') {
      const { data: creator } = await supabase
        .from('creator_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      creatorProfile = creator ?? null;
    }

    return NextResponse.json({ userProfile, creatorProfile });
  } catch (error) {
    return handleApiError(error, 'ME_API', 'Failed to fetch profile');
  }
}
