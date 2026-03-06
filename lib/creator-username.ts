import { createClient } from '@/lib/supabase/server';

interface CreatorProfile {
  vanity_username?: string | null;
  bio?: string | null;
  category?: string | null;
  is_verified?: boolean;
  supporters_count?: number;
}

interface User {
  id: string;
  display_name: string;
  username?: string | null;
  photo_url?: string | null;
  creator_profiles?: CreatorProfile | CreatorProfile[] | null;
}

/**
 * Get creator username/vanity URL for a given creator ID
 * Returns the vanity_username if set, otherwise falls back to username
 */
export async function getCreatorUsername(creatorId: string): Promise<string | null> {
  if (!creatorId) return null;

  const supabase = await createClient();

  // First try to get vanity_username
  const { data: profile } = await supabase
    .from('creator_profiles')
    .select('vanity_username')
    .eq('user_id', creatorId)
    .maybeSingle();

  if ((profile as any)?.vanity_username?.trim()) {
    return (profile as any).vanity_username.trim();
  }

  // Fallback to username
  const { data: user } = await supabase
    .from('users')
    .select('username')
    .eq('id', creatorId)
    .maybeSingle();

  return (user as any)?.username?.trim() || null;
}

/**
 * Get creator profile with username for components
 */
export async function getCreatorWithUsername(creatorId: string): Promise<(User & { username: string | null }) | null> {
  if (!creatorId) return null;

  const supabase = await createClient();

  const { data: creator } = await supabase
    .from('users')
    .select(`
      id,
      display_name,
      username,
      photo_url,
      creator_profiles (
        bio,
        category,
        is_verified,
        supporters_count,
        vanity_username
      )
    `)
    .eq('id', creatorId)
    .eq('role', 'creator')
    .single();

  if (!creator) return null;

  const creatorProfile = Array.isArray((creator as any).creator_profiles)
    ? (creator as any).creator_profiles[0]
    : (creator as any).creator_profiles;

  const username = creatorProfile?.vanity_username?.trim() || (creator as any).username?.trim();

  return {
    ...(creator as User),
    username,
  };
}
