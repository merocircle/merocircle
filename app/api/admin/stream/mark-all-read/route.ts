import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { serverStreamClient } from '@/lib/stream-server';
import { getAuthenticatedUser, handleApiError } from '@/lib/api-utils';
import { requireAdmin } from '@/lib/admin-middleware';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const DELAY_MS = 150; // Between users to avoid Stream rate limits

/**
 * Mark all Stream Chat channels as read for every user in the app.
 * Admin only. Use once to clear legacy unread badges for all users.
 *
 * POST /api/admin/stream/mark-all-read
 */
export async function POST() {
  try {
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user) {
      return errorResponse ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { isAdmin: userIsAdmin, error: adminError } = await requireAdmin(user.id);
    if (adminError) return adminError;
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin required' }, { status: 403 });
    }

    const supabase = await createClient();
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(500);

    if (usersError) {
      logger.error('Failed to fetch users for mark-all-read', 'STREAM_MARK_ALL_READ_ALL', {
        error: usersError.message,
      });
      return NextResponse.json(
        { success: false, error: 'Failed to load users' },
        { status: 500 }
      );
    }

    const userIds = (users ?? []).map((u) => u.id).filter(Boolean);
    if (userIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users found.',
        usersProcessed: 0,
        totalChannelsMarked: 0,
        errors: [],
      });
    }

    let totalChannelsMarked = 0;
    const errors: Array<{ userId: string; error: string }> = [];

    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      try {
        const channels = await serverStreamClient.queryChannels(
          { type: 'messaging', members: { $in: [userId] } },
          { last_message_at: -1 },
          { limit: 100 }
        );

        const readByChannel: Record<string, string> = {};
        for (const ch of channels) {
          if (ch.id) readByChannel[`messaging:${ch.id}`] = '';
        }

        if (Object.keys(readByChannel).length > 0) {
          await serverStreamClient.markChannelsRead({
            user_id: userId,
            read_by_channel: readByChannel,
          });
          totalChannelsMarked += channels.length;
        } else {
          await serverStreamClient.markChannelsRead({ user_id: userId });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push({ userId, error: msg });
        logger.warn('Mark-all-read failed for user', 'STREAM_MARK_ALL_READ_ALL', { userId, error: msg });
      }

      if (i < userIds.length - 1) {
        await new Promise((r) => setTimeout(r, DELAY_MS));
      }
    }

    logger.info('Mark-all-read for all users completed', 'STREAM_MARK_ALL_READ_ALL', {
      adminUserId: user.id,
      usersProcessed: userIds.length,
      totalChannelsMarked,
      errorCount: errors.length,
    });

    return NextResponse.json({
      success: true,
      message: `Processed ${userIds.length} user(s), marked ${totalChannelsMarked} channel read state(s).`,
      usersProcessed: userIds.length,
      totalChannelsMarked,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return handleApiError(error, 'STREAM_MARK_ALL_READ_ALL', 'Failed to mark all users as read');
  }
}
