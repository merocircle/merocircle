import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

/** Allowed: lowercase letters, numbers, underscore. Min 3, max 30. */
const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;

/**
 * GET /api/creator/check-username?username=xxx
 * Returns { available: boolean }.
 * Checks creator_profiles.vanity_username and users.username (email-prefix fallback).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = searchParams.get('username');
    const username = (raw ?? '').trim().toLowerCase();
    logger.info('Check username availability', 'CREATOR_CHECK_USERNAME_API', { username });

    if (!username) {
      return NextResponse.json({ available: false, error: 'Username is required' }, { status: 400 });
    }

    if (!USERNAME_REGEX.test(username)) {
      return NextResponse.json({
        available: false,
        error: 'Username must be 3–30 characters, lowercase letters, numbers, and underscores only',
      }, { status: 400 });
    }

    const supabase = await createClient();

    // Check creator_profiles.vanity_username (unique index is on lower(trim(vanity_username)))
    const { data: byVanity, error: vanityError } = await supabase
      .from('creator_profiles')
      .select('vanity_username')
      .not('vanity_username', 'is', null);

    if (vanityError) {
      return NextResponse.json({ available: false, error: 'Check failed' }, { status: 500 });
    }

    const vanityTaken = (byVanity ?? []).some(
      (row: { vanity_username?: string | null }) =>
        row.vanity_username != null && row.vanity_username.trim().toLowerCase() === username
    );
    if (vanityTaken) {
      return NextResponse.json({ available: false });
    }

    // Check users.username (used as fallback for creators without vanity_username)
    const { data: byUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .eq('role', 'creator')
      .maybeSingle();

    if (userError) {
      return NextResponse.json({ available: false, error: 'Check failed' }, { status: 500 });
    }

    const userTaken = !!byUser;
    return NextResponse.json({ available: !userTaken });
  } catch (error) {
    return handleApiError(error, 'CHECK_USERNAME_API', 'Failed to check username');
  }
}
