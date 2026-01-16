import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: creatorId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.id !== creatorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { completed } = await request.json();

    // Update onboarding status
    const { error } = await supabase
      .from('creator_profiles')
      .update({ onboarding_completed: completed })
      .eq('user_id', creatorId);

    if (error) {
      console.error('Failed to update onboarding status:', error);
      return NextResponse.json({ error: 'Failed to update onboarding status' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Onboarding API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
