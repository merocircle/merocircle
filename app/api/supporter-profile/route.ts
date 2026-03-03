import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/supporter-profile?displayName=xxx&creatorId=xxx
 *
 * Looks up a supporter by their display name within a creator's supporter list.
 * The client never sends or receives a user UUID — display name is the only
 * identifier stored in post content, keeping internal IDs out of public data.
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

  // Step 2: confirm they are an active supporter of this creator and get join date
  const { data: supporterData } = await supabase
    .from('supporters')
    .select('created_at')
    .eq('supporter_id', userData.id)
    .eq('creator_id', creatorId)
    .eq('is_active', true)
    .single();

  // Return only the public-safe fields — no user ID in the response
  return NextResponse.json({
    display_name: userData.display_name,
    photo_url: userData.photo_url,
    joined_at: supporterData?.created_at ?? null,
  });
}
