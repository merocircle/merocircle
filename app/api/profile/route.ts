import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { display_name, photo_url, bio, category, cover_image_url } = body;

    // Update users table
    const userUpdates: any = {};
    if (display_name !== undefined) userUpdates.display_name = display_name;
    if (photo_url !== undefined) userUpdates.photo_url = photo_url;

    if (Object.keys(userUpdates).length > 0) {
      const { error: userError } = await supabase
        .from('users')
        .update(userUpdates)
        .eq('id', user.id);

      if (userError) {
        logger.error('Error updating user', 'PROFILE_API', { error: userError.message, userId: user.id });
        return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 });
      }
    }

    // Update creator_profiles if user is a creator
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role === 'creator') {
      const profileUpdates: any = {};
      if (bio !== undefined) profileUpdates.bio = bio;
      if (category !== undefined) profileUpdates.category = category;
      if (cover_image_url !== undefined) profileUpdates.cover_image_url = cover_image_url;

      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await supabase
          .from('creator_profiles')
          .update(profileUpdates)
          .eq('user_id', user.id);

        if (profileError) {
          logger.error('Error updating creator profile', 'PROFILE_API', { error: profileError.message, userId: user.id });
          return NextResponse.json({ error: 'Failed to update creator profile' }, { status: 500 });
        }
      }
    }

    logger.info('Profile updated successfully', 'PROFILE_API', { userId: user.id });

    return NextResponse.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    logger.error('Profile update error', 'PROFILE_API', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
