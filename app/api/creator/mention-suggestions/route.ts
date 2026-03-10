import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser, requireCreatorRole, handleApiError } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/** Shape compatible with Supporter for the mention dropdown */
export interface MentionSuggestion {
  id: string;
  supporter_id: string;
  user: { id: string; display_name: string; photo_url: string | null };
  is_creator?: boolean;
}

/**
 * GET /api/creator/mention-suggestions?q=xxx
 *
 * Returns both supporters and other creators for @-mention autocomplete.
 * Used when a creator is writing a post and types @.
 * Excludes the current creator from results.
 */
export async function GET(req: NextRequest) {
  try {
    const { user, errorResponse: authError } = await getAuthenticatedUser();
    if (authError || !user) return authError || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { errorResponse: roleError } = await requireCreatorRole(user.id);
    if (roleError) return roleError;

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 20);

    const supabase = await createClient();

    // 1. Fetch supporters for this creator
    const { data: supporters } = await supabase
      .from('supporters')
      .select(`
        supporter_id,
        user:supporter_id (
          id,
          display_name,
          photo_url
        )
      `)
      .eq('creator_id', user.id)
      .eq('is_active', true);

    const supporterList: MentionSuggestion[] = (supporters || [])
      .filter((s: { user?: unknown }) => s.user)
      .map((s: { supporter_id: string; user: { id: string; display_name: string; photo_url: string | null } }) => ({
        id: s.supporter_id,
        supporter_id: s.supporter_id,
        user: s.user,
        is_creator: false,
      }));

    const supporterIds = new Set(supporterList.map((s) => s.supporter_id));

    // 2. If query is 2+ chars, search creators (excluding self and existing supporters)
    let creators: MentionSuggestion[] = [];

    if (q.length >= 2) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: searchData } = await (supabase.rpc as any)('search_creators', {
        search_query: q,
        search_limit: limit + supporterIds.size,
      });

      creators = (searchData || [])
        .filter((c: { user_id: string }) => c.user_id !== user.id && !supporterIds.has(c.user_id))
        .slice(0, limit)
        .map((c: { user_id: string; display_name: string; photo_url: string | null }) => ({
          id: c.user_id,
          supporter_id: c.user_id,
          user: {
            id: c.user_id,
            display_name: c.display_name || 'Creator',
            photo_url: c.photo_url || null,
          },
          is_creator: true,
        }));
    }

    // 3. Filter supporters by query (if any)
    const filteredSupporters = q
      ? supporterList.filter((s) => s.user.display_name.toLowerCase().includes(q))
      : supporterList;

    // 4. Merge: supporters first, then creators (dedupe by id)
    const seen = new Set<string>();
    const combined: MentionSuggestion[] = [];
    for (const s of filteredSupporters) {
      if (!seen.has(s.supporter_id) && combined.length < limit) {
        seen.add(s.supporter_id);
        combined.push(s);
      }
    }
    for (const c of creators) {
      if (!seen.has(c.supporter_id) && combined.length < limit) {
        seen.add(c.supporter_id);
        combined.push(c);
      }
    }

    logger.debug('Mention suggestions', 'CREATOR_MENTION_SUGGESTIONS', {
      creatorId: user.id,
      queryLength: q.length,
      combinedCount: combined.length,
    });

    return NextResponse.json({ suggestions: combined });
  } catch (error) {
    return handleApiError(error, 'CREATOR_MENTION_SUGGESTIONS', 'Failed to fetch mention suggestions');
  }
}
