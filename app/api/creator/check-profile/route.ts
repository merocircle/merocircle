import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser, handleApiError } from '@/lib/api-utils';

/**
 * GET /api/creator/check-profile
 * Returns the current user's creator profile and subscription tiers.
 * Used by the creator signup flow instead of calling Supabase directly.
 */
export async function GET() {
  try {
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user) return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = await createClient();

    const { data: profile } = await supabase
      .from('creator_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ profile: null, tiers: [] });
    }

    const { data: tiers } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('creator_id', user.id)
      .order('tier_level', { ascending: true });

    return NextResponse.json({ profile, tiers: tiers ?? [] });
  } catch (error) {
    return handleApiError(error, 'CREATOR_CHECK_PROFILE_API', 'Failed to check creator profile');
  }
}
