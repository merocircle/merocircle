import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function fetchCreatorDetails(creatorIds: string[]) {
  if (creatorIds.length === 0) return new Map();

  const supabase = await createClient();
  const { data: creators, error } = await supabase
    .from('users')
    .select('id, display_name, photo_url')
    .in('id', creatorIds);

  if (error) {
    logger.error('Failed to fetch creator details', 'API_HELPER', { error: error.message });
    return new Map();
  }

  return new Map((creators || []).map((c: { id: string; display_name: string; photo_url: string | null }) => [c.id, c]));
}

export async function fetchCreatorProfiles(userIds: string[]) {
  if (userIds.length === 0) return [];

  const supabase = await createClient();
  const { data: profiles, error } = await supabase
    .from('creator_profiles')
    .select('*, users(id, display_name, photo_url)')
    .in('user_id', userIds);

  if (error) {
    logger.error('Failed to fetch creator profiles', 'API_HELPER', { error: error.message });
    return [];
  }

  return (profiles || []).map((p: { user_id: string; category: string | null; supporters_count: number | null; is_verified: boolean | null; posts_count: number | null; users?: { display_name: string; photo_url: string | null } }) => ({
    id: p.user_id,
    name: p.users?.display_name || 'Creator',
    category: p.category || 'Creator',
    avatar: p.users?.photo_url || null,
    supporters: p.supporters_count || 0,
    isVerified: p.is_verified || false,
    posts_count: p.posts_count || 0
  }));
}

export function calculateMonthlyTotal(transactions: Array<{ created_at: string; amount: number | string }>) {
  const thisMonth = new Date();
  thisMonth.setDate(1);
  
  return transactions
    .filter(t => new Date(t.created_at) >= thisMonth)
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
}

export function calculateTotalAmount(transactions: Array<{ amount: number | string }>) {
  return transactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
}
