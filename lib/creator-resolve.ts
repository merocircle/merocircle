import { createClient } from '@/lib/supabase/server';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolve a creator slug (UUID or vanity username) to creator id and effective slug.
 * Vanity: 1) creator_profiles.vanity_username, 2) fallback users.username (email prefix).
 */
export async function resolveCreatorSlug(slug: string): Promise<{
  creatorId: string;
  username: string | null;
} | null> {
  if (!slug || typeof slug !== 'string') return null;
  const trimmed = slug.trim();

  const supabase = await createClient();

  if (UUID_REGEX.test(trimmed)) {
    const { data: user } = await supabase
      .from('users')
      .select('id, username')
      .eq('id', trimmed)
      .eq('role', 'creator')
      .maybeSingle();
    if (!user) return null;
    const { data: profile } = await supabase
      .from('creator_profiles')
      .select('vanity_username')
      .eq('user_id', user.id)
      .maybeSingle();
    const effectiveSlug = (profile?.vanity_username?.trim() || user.username) ?? null;
    return { creatorId: user.id, username: effectiveSlug };
  }

  const decoded = decodeURIComponent(trimmed).toLowerCase();

  // 1) Resolve by creator_profiles.vanity_username
  const { data: profiles } = await supabase
    .from('creator_profiles')
    .select('user_id, vanity_username')
    .not('vanity_username', 'is', null);

  const vanityMatch = (profiles ?? []).find(
    (p: { vanity_username?: string | null }) =>
      p.vanity_username != null && p.vanity_username.trim().toLowerCase() === decoded
  );
  if (vanityMatch) {
    return {
      creatorId: vanityMatch.user_id,
      username: vanityMatch.vanity_username?.trim() ?? decoded,
    };
  }

  // 2) Fallback: users.username
  const { data: user } = await supabase
    .from('users')
    .select('id, username')
    .eq('username', decoded)
    .eq('role', 'creator')
    .maybeSingle();

  if (!user) return null;
  return { creatorId: user.id, username: user.username ?? decoded };
}
