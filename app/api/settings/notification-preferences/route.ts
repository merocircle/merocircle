import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser, handleApiError } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user) return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    logger.info('Fetch notification preferences', 'NOTIFICATION_PREFS_API', { userId: user.id });
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('user_notification_preferences')
      .select('email_everyone_mentions, email_username_mentions, email_new_members')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    return NextResponse.json({
      email_everyone_mentions: data?.email_everyone_mentions ?? true,
      email_username_mentions: data?.email_username_mentions ?? true,
      email_new_members: data?.email_new_members ?? true,
    });
  } catch (error) {
    return handleApiError(error, 'NOTIFICATION_PREFS', 'Failed to fetch notification preferences');
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user) return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    logger.info('Update notification preferences', 'NOTIFICATION_PREFS_API', { userId: user.id });
    const body = await request.json();
    const {
      email_everyone_mentions,
      email_username_mentions,
      email_new_members,
    } = body;

    const supabase = await createClient();
    const updates: Record<string, boolean | string> = {};
    if (typeof email_everyone_mentions === 'boolean') updates.email_everyone_mentions = email_everyone_mentions;
    if (typeof email_username_mentions === 'boolean') updates.email_username_mentions = email_username_mentions;
    if (typeof email_new_members === 'boolean') updates.email_new_members = email_new_members;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid preferences to update' }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('user_notification_preferences')
      .upsert(
        { user_id: user.id, ...updates } as { user_id: string; email_everyone_mentions?: boolean; email_username_mentions?: boolean; email_new_members?: boolean; updated_at: string },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    return NextResponse.json({
      email_everyone_mentions: data?.email_everyone_mentions ?? true,
      email_username_mentions: data?.email_username_mentions ?? true,
      email_new_members: data?.email_new_members ?? true,
    });
  } catch (error) {
    return handleApiError(error, 'NOTIFICATION_PREFS', 'Failed to update notification preferences');
  }
}
