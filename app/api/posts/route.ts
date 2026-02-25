import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { getAuthenticatedUser, requireCreatorRole, parsePaginationParams, handleApiError } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const { page, limit, offset } = parsePaginationParams(searchParams);
    const creator_id = searchParams.get('creator_id');
    const tier = searchParams.get('tier') || 'free';

    let query = supabase
      .from('posts')
      .select(`
        *,
        users!posts_creator_id_fkey(
          id,
          display_name,
          photo_url,
          role
        ),
        polls(
          id,
          question,
          allows_multiple_answers,
          expires_at
        )
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (creator_id) {
      query = query.eq('creator_id', creator_id);
    }

    if (tier !== 'all') {
      query = query.in('tier_required', ['free', tier]);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: posts, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch posts', details: error.message },
        { status: 500 }
      );
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({
        posts: [],
        pagination: { page, limit, total: 0, totalPages: 0 }
      });
    }

    const postIds = posts.map(p => p.id);
    const creatorIds = [...new Set(posts.map(p => p.creator_id))];

    const [likesData, commentsData, profilesData] = await Promise.all([
      supabase
        .from('post_likes')
        .select('post_id')
        .in('post_id', postIds),
      supabase
        .from('post_comments')
        .select('post_id')
        .in('post_id', postIds),
      supabase
        .from('creator_profiles')
        .select('user_id, category, is_verified')
        .in('user_id', creatorIds)
    ]);

    const likesCountMap = (likesData.data || []).reduce((acc, like) => {
      acc[like.post_id] = (acc[like.post_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const commentsCountMap = (commentsData.data || []).reduce((acc, comment) => {
      acc[comment.post_id] = (acc[comment.post_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const profilesMap = (profilesData.data || []).reduce((acc, profile) => {
      acc[profile.user_id] = { category: profile.category, is_verified: profile.is_verified };
      return acc;
    }, {} as Record<string, { category: string | null; is_verified: boolean }>);

    const postsWithCounts = posts.map(post => ({
      ...post,
      likes_count: likesCountMap[post.id] || 0,
      comments_count: commentsCountMap[post.id] || 0,
      creator_profile: profilesMap[post.creator_id] || null,
      // polls is an object (one-to-one relationship), not an array
      poll: post.polls || null
    }));

    const { count } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('is_public', true);

    return NextResponse.json({
      posts: postsWithCounts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    return handleApiError(error, 'POSTS_API', 'Failed to fetch posts');
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate and check creator role
    const { user, errorResponse: authError } = await getAuthenticatedUser();
    if (authError || !user) return authError || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { isCreator, errorResponse: roleError } = await requireCreatorRole(user.id);
    if (roleError) return roleError;

    const body = await request.json();
    const {
      title,
      content,
      image_url,
      image_urls,
      is_public = true,
      tier_required = 'free',
      post_type = 'post',
      poll_data,
      sendNotifications: shouldNotify = true,
    } = body;

    // Use unified post publishing engine
    const { publishPost } = await import('@/lib/post-publishing-engine');
    const result = await publishPost({
      creatorId: user.id,
      title,
      content,
      image_url,
      image_urls,
      is_public,
      tier_required,
      post_type,
      poll_data,
      sendNotifications: shouldNotify,
      logActivity: true,
    });

    if (!result.success) {
      const statusCode = result.error?.includes('required') || result.error?.includes('must have') ? 400 : 500;
      return NextResponse.json({ error: result.error || 'Failed to create post' }, { status: statusCode });
    }

    return NextResponse.json(result.post, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'POSTS_API', 'Failed to create post');
  }
}

/**
 * Sends email notifications to all active supporters when a creator posts
 */
async function sendPostNotificationsToSupporters(
  post: any,
  creatorId: string,
  supabase: any
): Promise<void> {
  try {
    const { data: supporters, error } = await supabase
      .from('supporters')
      .select(`
        supporter_id,
        user:supporter_id!inner(
          id,
          email,
          display_name
        )
      `)
      .eq('creator_id', creatorId)
      .eq('is_active', true);

    if (error) {
      logger.error('Failed to fetch supporters for email notifications', 'POSTS_API', {
        error: error.message,
        creatorId
      });
      return;
    }

    if (!supporters || supporters.length === 0) {
      logger.info('No active supporters to notify', 'POSTS_API', { creatorId, postId: post.id });
      return;
    }

    const { data: creatorData } = await supabase
      .from('users')
      .select('display_name, username')
      .eq('id', creatorId)
      .single();

    const creatorName = creatorData?.display_name || 'Your creator';
    const creatorUsername = creatorData?.username || undefined;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://merocircle.app';
    const postUrl = `${appUrl}/creator/${creatorId}?post=${post.id}`;

    const supportersWithEmails = supporters
      .filter((s: any) => s.user && s.user.email)
      .map((s: any) => ({
        email: s.user.email,
        name: s.user.display_name || 'Supporter'
      }));

    if (supportersWithEmails.length === 0) {
      logger.info('No supporters with valid emails found', 'POSTS_API', { creatorId, postId: post.id });
      return;
    }

    // Send bulk email notifications
    const { sent, failed } = await sendBulkPostNotifications(supportersWithEmails, {
      creatorName,
      creatorUsername,
      postTitle: post.title || 'New Post',
      postContent: post.content || '',
      postImageUrl: post.image_url || (post.image_urls && post.image_urls[0]) || null,
      postUrl,
      isPoll: post.post_type === 'poll'
    });

    logger.info('Post notification emails sent', 'POSTS_API', {
      creatorId,
      postId: post.id,
      totalSupporters: supportersWithEmails.length,
      sent,
      failed
    });
  } catch (error: any) {
    // Don't throw - this is a background operation
    logger.error('Error sending post notifications', 'POSTS_API', {
      error: error.message,
      creatorId,
      postId: post.id
    });
  }
} 
