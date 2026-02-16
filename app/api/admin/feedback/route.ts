import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/api-utils';
import { isAdmin } from '@/lib/admin-middleware';

export async function GET(request: Request) {
  try {
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse) return errorResponse;

    // Check if user is admin
    if (!isAdmin(user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('[ADMIN_FEEDBACK_API] Fetching feedback:', { limit, offset, adminUserId: user.id });

    // Fetch feedback with user info
    const { data: feedback, error } = await supabase
      .from('feedback')
      .select(`
        id,
        question,
        answer,
        user_id,
        display_name,
        is_creator,
        feedback_type,
        addressed,
        created_at
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[ADMIN_FEEDBACK_API] Error fetching feedback:', error);
      return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
    }

    console.log('[ADMIN_FEEDBACK_API] Fetched feedback:', {
      count: feedback?.length || 0,
      feedback: feedback?.map((f) => ({
        id: f.id,
        question: f.question,
        display_name: f.display_name,
        is_creator: f.is_creator,
        created_at: f.created_at,
      })),
    });

    // Get user emails for feedback with user_id
    const userIds = feedback
      ?.filter((f) => f.user_id)
      .map((f) => f.user_id) || [];

    let userEmailsMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, email')
        .in('id', userIds);

      userEmailsMap = (users || []).reduce(
        (acc, u) => {
          acc[u.id] = u.email;
          return acc;
        },
        {} as Record<string, string>
      );
    }

    // Enrich feedback with email
    const enrichedFeedback = feedback?.map((f) => ({
      ...f,
      email: f.user_id ? userEmailsMap[f.user_id] || null : null,
    }));

    // Get total count
    const { count } = await supabase
      .from('feedback')
      .select('*', { count: 'exact', head: true });

    console.log('[ADMIN_FEEDBACK_API] Response:', {
      total: count || 0,
      enrichedCount: enrichedFeedback?.length || 0,
    });

    return NextResponse.json({
      success: true,
      feedback: enrichedFeedback || [],
      total: count || 0,
    });
  } catch (error) {
    console.error('Admin feedback API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
