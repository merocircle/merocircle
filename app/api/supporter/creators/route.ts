import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { getAuthenticatedUser, handleApiError } from '@/lib/api-utils'

/**
 * Supported creators = current memberships only (supporters.is_active = true).
 * Uses supporters table so "Your circle" reflects who you're currently supporting;
 * after unsubscribe they disappear. Payment history stays in supporter_transactions.
 */
export async function GET(request: NextRequest) {
  try {
    const { user, errorResponse } = await getAuthenticatedUser(request);
    if (errorResponse || !user) return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = await createClient();

    // Current circle = active supporter rows only (not payment history)
    const { data: supporterRows, error: supportersError } = await supabase
      .from('supporters')
      .select('creator_id, amount, created_at')
      .eq('supporter_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (supportersError) {
      logger.error('Error fetching supporters', 'SUPPORTER_API', {
        error: supportersError.message,
        userId: user.id,
      });
      return NextResponse.json({ error: 'Failed to fetch supported creators' }, { status: 500 });
    }

    if (!supporterRows || supporterRows.length === 0) {
      return NextResponse.json({ creators: [] });
    }

    const creatorIds = supporterRows.map((s: { creator_id: string }) => s.creator_id).filter(Boolean);
    if (creatorIds.length === 0) {
      return NextResponse.json({ creators: [] });
    }

    const { data: creatorData, error: creatorsError } = await supabase
      .from('users')
      .select(`
        id,
        display_name,
        photo_url,
        creator_profiles(
          bio,
          category,
          is_verified,
          total_earnings,
          supporters_count,
          vanity_username
        )
      `)
      .in('id', creatorIds);

    if (creatorsError) {
      logger.error('Error fetching creators', 'SUPPORTER_API', {
        error: creatorsError.message,
        userId: user.id,
      });
      return NextResponse.json({ error: 'Failed to fetch creators' }, { status: 500 });
    }

    // Optional: get total supported from transactions for display (still for these creators only)
    const { data: txData } = await supabase
      .from('supporter_transactions')
      .select('creator_id, amount, created_at')
      .eq('supporter_id', user.id)
      .eq('status', 'completed')
      .in('creator_id', creatorIds);

    const txByCreator = new Map<string, { total: number; count: number; lastDate: string }>();
    (txData || []).forEach((t: { creator_id: string; amount: number; created_at: string }) => {
      const cur = txByCreator.get(t.creator_id) || { total: 0, count: 0, lastDate: '' };
      cur.total += Number(t.amount) || 0;
      cur.count += 1;
      if (t.created_at && (!cur.lastDate || t.created_at > cur.lastDate)) cur.lastDate = t.created_at;
      txByCreator.set(t.creator_id, cur);
    });

    const creators = supporterRows.map((s: { creator_id: string; amount: number; created_at: string }) => {
      const creator = creatorData?.find((c: Record<string, unknown>) => c.id === s.creator_id);
      // If the creator was deleted or not found in users, still return a stub
      // so they are not silently dropped from the circle strip
      const profile = creator
        ? (Array.isArray(creator.creator_profiles)
            ? creator.creator_profiles[0]
            : creator.creator_profiles)
        : null;
      const tx = txByCreator.get(s.creator_id);
      return {
        id: s.creator_id,
        name: creator ? ((creator.display_name as string) || 'Creator') : 'Creator',
        photo_url: creator ? ((creator.photo_url as string) || null) : null,
        vanity_username: profile?.vanity_username ? String(profile.vanity_username) : null,
        category: profile?.category ? String(profile.category) : null,
        bio: profile?.bio ? String(profile.bio) : null,
        is_verified: profile?.is_verified === true,
        supporters_count: profile?.supporters_count ? Number(profile.supporters_count) : 0,
        total_earnings: profile?.total_earnings ? Number(profile.total_earnings) : 0,
        totalSupported: tx?.total ?? Number(s.amount) ?? 0,
        transactionCount: tx?.count ?? 1,
        lastSupportDate: tx?.lastDate || s.created_at,
      };
    });

    // Sort by last support date
    creators.sort((a: { lastSupportDate: string }, b: { lastSupportDate: string }) =>
      new Date(b.lastSupportDate).getTime() - new Date(a.lastSupportDate).getTime()
    );

    return NextResponse.json({ creators });
  } catch (error) {
    return handleApiError(error, 'SUPPORTER_API', 'Failed to fetch supported creators');
  }
} 