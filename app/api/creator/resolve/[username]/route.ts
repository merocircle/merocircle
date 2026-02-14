import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/api-utils';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolve vanity slug to creator id.
 * 1) Try creator_profiles.vanity_username (creator-chosen).
 * 2) Fallback: users.username (email prefix) for creators without vanity_username.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const decoded = decodeURIComponent(username || '').trim().toLowerCase();

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
    }

    // If it looks like a UUID, don't treat as username
    if (UUID_REGEX.test(decoded)) {
      return NextResponse.json({ error: 'Use creator id endpoint for UUID' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1) Resolve by creator_profiles.vanity_username
    const { data: byVanity, error: vanityError } = await supabase
      .from('creator_profiles')
      .select('user_id, vanity_username')
      .not('vanity_username', 'is', null);

    if (!vanityError && byVanity?.length) {
      const match = byVanity.find(
        (row: { vanity_username?: string | null; user_id: string }) =>
          row.vanity_username != null && row.vanity_username.trim().toLowerCase() === decoded
      );
      if (match) {
        const { data: u } = await supabase
          .from('users')
          .select('display_name')
          .eq('id', match.user_id)
          .single();
        return NextResponse.json({
          creatorId: match.user_id,
          displayName: u?.display_name ?? '',
          username: decoded,
        });
      }
    }

    // 2) Fallback: users.username (email prefix)
    const { data: user, error } = await supabase
      .from('users')
      .select('id, display_name')
      .eq('username', decoded)
      .eq('role', 'creator')
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    return NextResponse.json({
      creatorId: user.id,
      displayName: user.display_name || '',
      username: decoded,
    });
  } catch (error) {
    return handleApiError(error, 'CREATOR_RESOLVE_API', 'Failed to resolve creator username');
  }
}
