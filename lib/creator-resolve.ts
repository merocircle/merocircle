import { createClient } from '@/lib/supabase/server';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolve a creator slug (UUID or vanity username) to creator id and optional username.
 * Use for server-side metadata and routing.
 */
export async function resolveCreatorSlug(slug: string): Promise<{
  creatorId: string;
  username: string | null;
} | null> {
  if (!slug || typeof slug !== 'string') return null;
  const trimmed = slug.trim();

  const supabase = await createClient();

  if (UUID_REGEX.test(trimmed)) {
    const { data } = await supabase
      .from('users')
      .select('id, username')
      .eq('id', trimmed)
      .eq('role', 'creator')
      .maybeSingle();
    if (!data) return null;
    return { creatorId: data.id, username: data.username ?? null };
  }

  const decoded = decodeURIComponent(trimmed).toLowerCase();
  const { data } = await supabase
    .from('users')
    .select('id, username')
    .eq('username', decoded)
    .eq('role', 'creator')
    .maybeSingle();

  if (!data) return null;
  return { creatorId: data.id, username: data.username ?? decoded };
}
