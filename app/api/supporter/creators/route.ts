import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get creators that this user supports (has made transactions to)
    const { data: supportedCreators, error: creatorsError } = await supabase
      .from('supporter_transactions')
      .select(`
        creator_id,
        amount,
        created_at,
        users!supporter_transactions_creator_id_fkey(
          id,
          display_name,
          photo_url
        ),
        creator_profiles!supporter_transactions_creator_id_fkey(
          bio,
          category,
          is_verified,
          total_earnings,
          supporters_count,
          followers_count
        )
      `)
      .eq('supporter_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (creatorsError) {
      console.error('Error fetching supported creators:', creatorsError);
      return NextResponse.json({ error: 'Failed to fetch supported creators' }, { status: 500 });
    }

    // Group by creator and calculate totals
    const creatorMap = new Map();
    
    supportedCreators?.forEach(transaction => {
      const creatorId = transaction.creator_id;
      const creator = transaction.users;
      const profile = transaction.creator_profiles;
      
      if (!creator || !profile) return;
      
      if (creatorMap.has(creatorId)) {
        const existing = creatorMap.get(creatorId);
        existing.totalSupported += transaction.amount;
        existing.transactionCount += 1;
        existing.lastSupportDate = new Date(transaction.created_at) > new Date(existing.lastSupportDate) 
          ? transaction.created_at 
          : existing.lastSupportDate;
      } else {
        creatorMap.set(creatorId, {
          id: creatorId,
          name: creator.display_name,
          photo_url: creator.photo_url,
          category: profile.category,
          bio: profile.bio,
          is_verified: profile.is_verified,
          supporters_count: profile.supporters_count,
          followers_count: profile.followers_count,
          total_earnings: profile.total_earnings,
          totalSupported: transaction.amount,
          transactionCount: 1,
          lastSupportDate: transaction.created_at
        });
      }
    });

    const creators = Array.from(creatorMap.values())
      .sort((a, b) => new Date(b.lastSupportDate).getTime() - new Date(a.lastSupportDate).getTime());

    return NextResponse.json({ creators });
  } catch (error) {
    console.error('Supporter creators API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 