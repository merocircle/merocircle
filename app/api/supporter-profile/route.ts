import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCreatorUsername } from '@/lib/creator-username';

export const dynamic = 'force-dynamic';

/**
 * GET /api/supporter-profile?displayName=xxx&creatorId=xxx
 *
 * Looks up a mentioned person by their display name. The creatorId is the post
 * author's ID — used to check if they're a supporter of this creator (for joined_at).
 * Returns is_creator and creator_slug when the person has a creator profile.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const displayName = searchParams.get('displayName');
  const creatorId = searchParams.get('creatorId');

  if (!displayName || !creatorId) {
    return NextResponse.json(
      { error: 'Missing required query params: displayName, creatorId' },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  // Step 1: resolve the display_name → internal user ID (server-side only)
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, display_name, photo_url')
    .ilike('display_name', displayName)
    .limit(1)
    .single();

  if (userError || !userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const user = userData as { id: string; display_name: string; photo_url: string | null };

  // Step 2: confirm they are an active supporter of this creator and get join date
  const { data: supporterData } = await supabase
    .from('supporters')
    .select('created_at')
    .eq('supporter_id', user.id)
    .eq('creator_id', creatorId)
    .eq('is_active', true)
    .single();

  // Step 3: check if this user is a creator (has creator_profiles)
  const { data: creatorProfile } = await supabase
    .from('creator_profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  const isCreator = !!creatorProfile;
  const creatorSlug = isCreator ? await getCreatorUsername(user.id) : null;

  // Return only the public-safe fields — no user ID in the response
  return NextResponse.json({
    display_name: user.display_name,
    photo_url: user.photo_url,
    joined_at: (supporterData as { created_at?: string } | null)?.created_at ?? null,
    is_creator: isCreator,
    creator_slug: creatorSlug,
  });
}
