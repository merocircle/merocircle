import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Check if user already viewed this post today
    const today = new Date().toISOString().split('T')[0];
    const { data: existingView } = await supabase
      .from('post_views')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .gte('viewed_at', `${today}T00:00:00.000Z`)
      .lte('viewed_at', `${today}T23:59:59.999Z`)
      .maybeSingle();

    if (existingView) {
      return NextResponse.json({ already_viewed: true });
    }

    // Record the view
    await supabase.from('post_views').insert({
      post_id: postId,
      user_id: userId,
    });

    // Increment views_count on the post
    await supabase.rpc('increment_post_views', { post_id_input: postId });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('View tracking error', 'POST_VIEW_API', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
  }
}
