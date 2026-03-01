import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

/**
 * GET /api/posts/[id]/likes
 * Returns the list of users who liked this post (id, display_name, photo_url).
 * Post must exist; no auth required for public posts (caller can enforce visibility).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const supabase = await createClient();

    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const { data: likes, error: likesError } = await supabase
      .from('post_likes')
      .select(`
        user_id,
        users(id, display_name, photo_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (likesError) {
      logger.warn('Error fetching post likers', 'POST_LIKES_API', {
        postId,
        error: likesError.message,
      });
      return NextResponse.json(
        { error: 'Failed to load likes' },
        { status: 500 }
      );
    }

    const likers = (likes || []).map((row: { user_id: string; users: { id: string; display_name: string; photo_url: string | null } | null }) => {
      const u = row.users;
      return u
        ? { id: u.id, display_name: u.display_name, photo_url: u.photo_url }
        : { id: row.user_id, display_name: 'Unknown', photo_url: null as string | null };
    });

    return NextResponse.json({ likers });
  } catch (error) {
    return handleApiError(error, 'POST_LIKES_API', 'Failed to fetch likers');
  }
}
