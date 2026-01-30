import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validatePostContent, sanitizeString } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { getAuthenticatedUser, requireCreatorRole, parsePaginationParams, handleApiError } from '@/lib/api-utils';
import { sendBulkPostNotifications } from '@/lib/sendgrid';
import { slugifyDisplayName } from '@/lib/utils';

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

    const supabase = await createClient();

    const body = await request.json();
    const {
      title,
      content,
      image_url,
      image_urls,
      is_public = true,
      tier_required = 'free',
      post_type = 'post',
      poll_data
    } = body;

    // Handle image_urls - support both single image_url and multiple image_urls
    let finalImageUrls: string[] = [];
    if (image_urls && Array.isArray(image_urls) && image_urls.length > 0) {
      finalImageUrls = image_urls.filter((url: string) => url && url.trim());
    } else if (image_url) {
      finalImageUrls = [image_url];
    }

    const validation = validatePostContent(title, content);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Validate poll data if it's a poll post
    if (post_type === 'poll') {
      if (!poll_data || !poll_data.question || !poll_data.options || poll_data.options.length < 2) {
        return NextResponse.json({
          error: 'Poll must have a question and at least 2 options'
        }, { status: 400 });
      }
      if (poll_data.options.length > 10) {
        return NextResponse.json({
          error: 'Poll cannot have more than 10 options'
        }, { status: 400 });
      }
    }

    // Create the post
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        creator_id: user.id,
        title: sanitizeString(title),
        content: sanitizeString(content),
        image_url: finalImageUrls.length > 0 ? finalImageUrls[0] : null, // Keep first image in image_url for backward compatibility
        image_urls: finalImageUrls.length > 0 ? finalImageUrls : [],
        is_public: is_public ?? true,
        tier_required: tier_required || 'free',
        post_type: post_type || 'post'
      })
      .select('*, users!posts_creator_id_fkey(id, display_name, photo_url, role)')
      .single();

    if (error) {
      logger.error('Post creation failed', 'POSTS_API', { error: error.message, userId: user.id });
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }

    // If it's a poll, create the poll data
    if (post_type === 'poll' && poll_data) {
      // Create poll
      const { data: pollRecord, error: pollError } = await supabase
        .from('polls')
        .insert({
          post_id: post.id,
          question: sanitizeString(poll_data.question),
          allows_multiple_answers: poll_data.allows_multiple_answers || false,
          expires_at: poll_data.expires_at || null
        })
        .select()
        .single();

      if (pollError) {
        // Rollback: delete the post
        await supabase.from('posts').delete().eq('id', post.id);
        logger.error('Poll creation failed', 'POSTS_API', { error: pollError.message, userId: user.id });
        return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 });
      }

      // Create poll options
      const optionsToInsert = poll_data.options.map((option: string, index: number) => ({
        poll_id: pollRecord.id,
        option_text: sanitizeString(option),
        position: index
      }));

      const { error: optionsError } = await supabase
        .from('poll_options')
        .insert(optionsToInsert);

      if (optionsError) {
        // Rollback: delete poll and post
        await supabase.from('polls').delete().eq('id', pollRecord.id);
        await supabase.from('posts').delete().eq('id', post.id);
        logger.error('Poll options creation failed', 'POSTS_API', { error: optionsError.message, userId: user.id });
        return NextResponse.json({ error: 'Failed to create poll options' }, { status: 500 });
      }
    }


    sendPostNotificationsToSupporters(post, user.id, supabase).catch((error) => {

      logger.error('Failed to send post notifications', 'POSTS_API', {
        error: error.message,
        postId: post.id,
        creatorId: user.id
      });
    });

    return NextResponse.json(post, { status: 201 });
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
      .select('display_name')
      .eq('id', creatorId)
      .single();

    const creatorName = creatorData?.display_name || 'Your creator';
    const creatorSlug = creatorData?.display_name ? slugifyDisplayName(creatorData.display_name) : null;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://merocircle.com';
    const postUrl = creatorSlug 
      ? `${appUrl}/${encodeURIComponent(creatorSlug)}?post=${post.id}`
      : `${appUrl}/creator/${creatorId}?post=${post.id}`;

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
