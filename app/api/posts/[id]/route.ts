import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

interface Params {
  id: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const supabase = createServerClient();
    const { id } = params;

    const { data: post, error } = await supabase
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
        likes:post_likes(
          id,
          user_id,
          created_at,
          user:users(display_name, photo_url)
        ),
        comments:comments(
          id,
          content,
          created_at,
          updated_at,
          user:users(id, display_name, photo_url)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(post);

  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const supabase = createServerClient();
    const { id } = params;

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if post exists and user owns it
    const { data: existingPost } = await supabase
      .from('posts')
      .select('creator_id')
      .eq('id', id)
      .single();

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (existingPost.creator_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only edit your own posts' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, image_url, media_url, is_public, tier_required } = body;

    // Update the post
    const { data: post, error } = await supabase
      .from('posts')
      .update({
        title,
        content,
        image_url,
        media_url,
        is_public,
        tier_required,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
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
      console.error('Error updating post:', error);
      return NextResponse.json(
        { error: 'Failed to update post' },
        { status: 500 }
      );
    }

    return NextResponse.json(post);

  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const supabase = createServerClient();
    const { id } = params;

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if post exists and user owns it
    const { data: existingPost } = await supabase
      .from('posts')
      .select('creator_id')
      .eq('id', id)
      .single();

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (existingPost.creator_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own posts' },
        { status: 403 }
      );
    }

    // Delete the post (this will cascade delete likes and comments)
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting post:', error);
      return NextResponse.json(
        { error: 'Failed to delete post' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Post deleted successfully' });

  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 