import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const searchParams = request.nextUrl.searchParams;
    
    // Query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const creator_id = searchParams.get('creator_id');
    const tier = searchParams.get('tier') || 'free';
    
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('posts')
      .select(`
        *,
        creator:users!posts_creator_id_fkey(
          id,
          display_name,
          photo_url,
          role
        ),
        creator_profile:creator_profiles!posts_creator_id_fkey(
          category,
          is_verified
        ),
        likes_count:post_likes(count),
        comments_count:comments(count)
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
        { error: 'Failed to fetch posts' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('is_public', true);

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
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
        creator:users!posts_creator_id_fkey(
          id,
          display_name,
          photo_url,
          role
        ),
        creator_profile:creator_profiles!posts_creator_id_fkey(
          category,
          is_verified
        )
      `)
      .single();

    if (error) {
      console.error('Error creating post:', error);
      return NextResponse.json(
        { error: 'Failed to create post' },
        { status: 500 }
      );
    }

    return NextResponse.json(post, { status: 201 });

  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 