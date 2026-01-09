import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch transactions with separate queries to avoid relationship issues
    const { data: transactions, error: transactionsError } = await supabase
      .from('supporter_transactions')
      .select('creator_id, amount, created_at')
      .eq('supporter_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (transactionsError) {
      logger.error('Error fetching transactions', 'SUPPORTER_API', { 
        error: transactionsError.message, 
        userId: user.id 
      });
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ creators: [] });
    }

    // Get unique creator IDs
    const creatorIds = [...new Set(transactions.map(t => t.creator_id as string).filter(Boolean))];
    
    if (creatorIds.length === 0) {
      return NextResponse.json({ creators: [] });
    }

    // Fetch creator details
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
          followers_count
        )
      `)
      .in('id', creatorIds);

    if (creatorsError) {
      logger.error('Error fetching creators', 'SUPPORTER_API', { 
        error: creatorsError.message, 
        userId: user.id 
      });
      return NextResponse.json({ error: 'Failed to fetch creators' }, { status: 500 });
    }

    // Map transactions to supported creators
    const creatorMap = new Map();
    
    transactions.forEach((transaction: Record<string, unknown>) => {
      const creatorId = transaction.creator_id as string;
      if (!creatorId) return;
      
      const creator = creatorData?.find((c: Record<string, unknown>) => c.id === creatorId);
      if (!creator) return;
      
      const profile = Array.isArray(creator.creator_profiles) 
        ? creator.creator_profiles[0] 
        : creator.creator_profiles;
      
      if (creatorMap.has(creatorId)) {
        const existing = creatorMap.get(creatorId);
        existing.totalSupported += Number(transaction.amount) || 0;
        existing.transactionCount += 1;
        if (new Date(transaction.created_at as string) > new Date(existing.lastSupportDate)) {
          existing.lastSupportDate = transaction.created_at as string;
        }
      } else {
        creatorMap.set(creatorId, {
          id: creatorId,
          name: creator.display_name ? String(creator.display_name) : 'Unknown',
          photo_url: creator.photo_url ? String(creator.photo_url) : null,
          category: profile?.category ? String(profile.category) : null,
          bio: profile?.bio ? String(profile.bio) : null,
          is_verified: profile?.is_verified === true,
          totalSupported: Number(transaction.amount) || 0,
          transactionCount: 1,
          lastSupportDate: transaction.created_at as string
        });
      }
    });

    const creators = Array.from(creatorMap.values())
      .sort((a, b) => new Date(b.lastSupportDate).getTime() - new Date(a.lastSupportDate).getTime());

    return NextResponse.json({ creators })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 