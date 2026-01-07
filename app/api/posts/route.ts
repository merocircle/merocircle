import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    
    // Query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const creator_id = searchParams.get('creator_id');
    const tier = searchParams.get('tier') || 'free';
    
    const offset = (page - 1) * limit;

    // Build query with simpler joins
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

    // Filter by creator if specified
    if (creator_id) {
      query = query.eq('creator_id', creator_id);
    }

    // Filter by tier access
    if (tier !== 'all') {
      query = query.in('tier_required', ['free', tier]);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: posts, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch posts', details: error.message },
        { status: 500 }
      );
    }

    // Get likes and comments count separately for each post
    const postsWithCounts = await Promise.all(
      (posts || []).map(async (post) => {
        // Get likes count
        const { count: likesCount } = await supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        // Get comments count
        const { count: commentsCount } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        // Get creator profile if exists
        const { data: creatorProfile } = await supabase
          .from('creator_profiles')
          .select('category, is_verified')
          .eq('user_id', post.creator_id)
          .single();

        return {
          ...post,
          likes_count: likesCount || 0,
          comments_count: commentsCount || 0,
          creator_profile: creatorProfile
        };
      })
    );

    // Get total count for pagination
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
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is a creator
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userProfile?.role !== 'creator') {
      return NextResponse.json(
        { error: 'Only creators can create posts' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, image_url, media_url, is_public = true, tier_required = 'free' } = body;

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Create the post
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        creator_id: user.id,
        title,
        content,
        image_url,
        media_url,
        is_public,
        tier_required
      })
      .select(`
        *,
        users!posts_creator_id_fkey(
          id,
          display_name,
          photo_url,
          role
        )
      `)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create post' },
        { status: 500 }
      );
    }

    return NextResponse.json(post, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
