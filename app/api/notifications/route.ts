import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { getAuthenticatedUser, handleApiError } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const { user, errorResponse } = await getAuthenticatedUser(request);
    if (errorResponse || !user) return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // Filter by type: 'like', 'comment', 'payment', 'support'
    const limit = parseInt(searchParams.get('limit') || '50');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // Build query
    let query = supabase
      .from('notifications')
      .select(`
        id,
        type,
        read,
        created_at,
        metadata,
        actor:users!notifications_actor_id_fkey(
          id,
          display_name,
          photo_url
        ),
        post:posts!notifications_post_id_fkey(
          id,
          title,
          image_url,
          creator_id
        ),
        comment:post_comments!notifications_comment_id_fkey(
          id,
          content
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (type) {
      query = query.eq('type', type);
    }

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      logger.error('Error fetching notifications', 'NOTIFICATIONS_API', {
        error: error.message,
        userId: user.id
      });
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }

    // Format notifications for frontend
    const formattedNotifications = (notifications || []).map((notification: any) => ({
      id: notification.id,
      type: notification.type,
      read: notification.read,
      created_at: notification.created_at,
      user: {
        id: notification.actor?.id,
        name: notification.actor?.display_name || 'Unknown User',
        avatar: notification.actor?.photo_url || null,
      },
      post: notification.post ? {
        id: notification.post.id,
        title: notification.post.title,
        image_url: notification.post.image_url,
        creator_id: notification.post.creator_id,
      } : null,
      comment: notification.comment ? {
        id: notification.comment.id,
        content: notification.comment.content,
      } : null,
      message: notification.metadata?.action || `${notification.type} on your post`,
    }));

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);

    return NextResponse.json({
      notifications: formattedNotifications,
      unreadCount: unreadCount || 0,
      total: formattedNotifications.length,
    }, {
      headers: {
        // Short cache for notifications, with immediate revalidation
        'Cache-Control': 'private, max-age=10, stale-while-revalidate=30'
      }
    });
  } catch (error) {
    logger.error('Error in notifications API', 'NOTIFICATIONS_API', {
      error: error instanceof Error ? error.message : 'Unknown'
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const { user, errorResponse } = await getAuthenticatedUser(request);
    if (errorResponse || !user) return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = await createClient();

    const body = await request.json();
    const { notificationIds, markAllRead } = body;

    if (markAllRead) {
      // Mark all notifications as read for this user
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        logger.error('Error marking all notifications as read', 'NOTIFICATIONS_API', {
          error: error.message,
          userId: user.id
        });
        return NextResponse.json(
          { error: 'Failed to update notifications' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
      // Mark specific notifications as read
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', notificationIds)
        .eq('user_id', user.id);

      if (error) {
        logger.error('Error marking notifications as read', 'NOTIFICATIONS_API', {
          error: error.message,
          userId: user.id
        });
        return NextResponse.json(
          { error: 'Failed to update notifications' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: 'Notifications marked as read' });
    }

    return NextResponse.json(
      { error: 'Invalid request. Provide notificationIds array or markAllRead flag' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Error in notifications API', 'NOTIFICATIONS_API', {
      error: error instanceof Error ? error.message : 'Unknown'
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
