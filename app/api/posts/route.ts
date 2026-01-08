import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validatePostContent, sanitizeString } from '@/lib/validation';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const creator_id = searchParams.get('creator_id');
    const tier = searchParams.get('tier') || 'free';
    const offset = (page - 1) * limit;

    let query = supabase
      .from('posts')
      .select(`
        *,
        users!posts_creator_id_fkey(
          id,
          display_name,
          photo_url,
          role
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
      creator_profile: profilesMap[post.creator_id] || null
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
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userProfile?.role !== 'creator') {
      return NextResponse.json({ error: 'Only creators can create posts' }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, image_url, is_public = true, tier_required = 'free' } = body;

    const validation = validatePostContent(title, content);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        creator_id: user.id,
        title: sanitizeString(title),
        content: sanitizeString(content),
        image_url: image_url || null,
        is_public: is_public ?? true,
        tier_required: tier_required || 'free'
      })
      .select('*, users!posts_creator_id_fkey(id, display_name, photo_url, role)')
      .single();

    if (error) {
      logger.error('Post creation failed', 'POSTS_API', { error: error.message, userId: user.id });
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    logger.error('Post creation error', 'POSTS_API', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
