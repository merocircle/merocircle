import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/api-utils';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolve vanity username (email prefix) to creator id.
 * Username = part before @ in email, sanitized (lowercase, alphanumeric + underscore).
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
