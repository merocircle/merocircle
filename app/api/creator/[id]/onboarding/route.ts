import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser, handleApiError } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: creatorId } = await params;
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user) return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (user.id !== creatorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    logger.info('Update onboarding', 'CREATOR_ONBOARDING_API', { creatorId, userId: user.id });
    const supabase = await createClient();

    const { completed } = await request.json();

    // Update onboarding status
    const { error } = await supabase
      .from('creator_profiles')
      .update({ onboarding_completed: completed })
      .eq('user_id', creatorId);

    if (error) {
      return NextResponse.json({ error: 'Failed to update onboarding status' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'ONBOARDING_API', 'Failed to update onboarding status');
  }
}
