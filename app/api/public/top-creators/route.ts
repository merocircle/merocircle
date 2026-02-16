import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // First get all users who exist (inner join approach)
    const { data: users } = await supabase
      .from('users')
      .select('id, display_name, photo_url')
      .not('display_name', 'is', null);

    if (!users || users.length === 0) {
      return NextResponse.json({ creators: [] });
    }

    const validUserIds = users.map((u) => u.id);
    const usersMap = new Map(users.map((u) => [u.id, u]));

    // Then get creator profiles only for existing users
    const { data: profiles, error } = await supabase
      .from('creator_profiles')
      .select('user_id, bio, category, cover_image_url, supporters_count, vanity_username')
      .in('user_id', validUserIds)
      .order('supporters_count', { ascending: false })
      .limit(6);

    if (error || !profiles || profiles.length === 0) {
      return NextResponse.json({ creators: [] });
    }

    const creators = profiles
      .map((p) => {
        const u = usersMap.get(p.user_id);
        if (!u || !u.display_name) return null;
        return {
          name: u.display_name,
          category: p.category || 'Creator',
          bio: p.bio || '',
          supporters: p.supporters_count || 0,
          profileImage: u.photo_url || null,
          coverImage: p.cover_image_url || null,
          vanityUsername: p.vanity_username || null,
        };
      })
      .filter(Boolean)
      .slice(0, 3);

    return NextResponse.json({ creators });
  } catch {
    return NextResponse.json({ creators: [] });
  }
}
