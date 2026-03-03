import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/api-utils';
import { isAdmin } from '@/lib/admin-middleware';
import { logger } from '@/lib/logger';

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
      logger.error('Error updating feedback', 'ADMIN_FEEDBACK_API', { error: error.message, feedbackId });
      return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
    }

    logger.info('Feedback updated', 'ADMIN_FEEDBACK_API', { feedbackId, addressed });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Admin feedback API error', 'ADMIN_FEEDBACK_API', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
