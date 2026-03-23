import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser, handleApiError } from '@/lib/api-utils';

export async function GET() {
  try {
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user) return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = await createClient();

    const { data: profile, error } = await (supabase
      .from('users' as any)
      .select('*, creator_profiles(*)')
      .eq('id', user.id)
      .single() as any);

    if (error) {
      return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
    }

    const { creator_profiles, ...userProfile } = profile;
    return NextResponse.json({
      userProfile,
      creatorProfile: Array.isArray(creator_profiles) ? creator_profiles[0] ?? null : creator_profiles ?? null,
    });
  } catch (error) {
    return handleApiError(error, 'ME_API', 'Failed to load profile');
  }
}
