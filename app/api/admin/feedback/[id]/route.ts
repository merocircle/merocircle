import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/api-utils';
import { isAdmin } from '@/lib/admin-middleware';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse) return errorResponse;

    // Check if user is admin
    if (!isAdmin(user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id: feedbackId } = await params;
    const body = await request.json();
    const { addressed } = body;

    if (typeof addressed !== 'boolean') {
      return NextResponse.json({ error: 'addressed must be a boolean' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from('feedback')
      .update({ addressed })
      .eq('id', feedbackId);

    if (error) {
      console.error('[ADMIN_FEEDBACK_API] Error updating feedback:', error);
      return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ADMIN_FEEDBACK_API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
