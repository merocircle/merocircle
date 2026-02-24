import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateStreamToken, upsertStreamUser } from '@/lib/stream-server';
import { logger } from '@/lib/logger';
import { getAuthenticatedUser, handleApiError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { user, errorResponse } = await getAuthenticatedUser(request);
    if (errorResponse || !user) return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = await createClient();

    // Get user profile from Supabase
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, display_name, photo_url')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      logger.error('Failed to fetch user profile for Stream token', 'STREAM_TOKEN_API', {
        userId: user.id,
        error: profileError?.message
      });
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Upsert user in Stream to ensure they exist
    await upsertStreamUser(
      userProfile.id,
      userProfile.display_name,
      userProfile.photo_url
    );

    // Generate Stream token for the user
    const token = generateStreamToken(userProfile.id);

    logger.info('Stream token generated', 'STREAM_TOKEN_API', {
      userId: user.id
    });

    return NextResponse.json({
      token,
      userId: userProfile.id,
      userName: userProfile.display_name,
      userImage: userProfile.photo_url
    });
  } catch (error) {
    return handleApiError(error, 'STREAM_TOKEN_API', 'Failed to generate Stream token');
  }
}
