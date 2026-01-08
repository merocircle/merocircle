import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Fetch transactions first
    const { data: transactions, error: transactionsError } = await supabase
      .from('supporter_transactions')
      .select('id, amount, supporter_message, status, created_at, completed_at, creator_id')
      .eq('supporter_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (transactionsError) {
      logger.error('Failed to fetch support history', 'SUPPORTER_HISTORY', {
        error: transactionsError.message,
        userId: user.id
      });
      return NextResponse.json({ error: 'Failed to fetch support history' }, { status: 500 });
    }

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ history: [] });
    }

    // Get unique creator IDs
    const creatorIds = [...new Set(transactions.map((t: any) => t.creator_id))];

    // Fetch creator details
    const { data: creators, error: creatorsError } = await supabase
      .from('users')
      .select('id, display_name, photo_url')
      .in('id', creatorIds);

    if (creatorsError) {
      logger.error('Failed to fetch creators', 'SUPPORTER_HISTORY', {
        error: creatorsError.message
      });
      // Continue with empty creator data if fetch fails
    }

    // Create a map of creator IDs to creator data
    const creatorsMap = new Map((creators || []).map((c: any) => [c.id, c]));

    // Map transactions with creator data
    const history = transactions.map((t: any) => {
      const creator = creatorsMap.get(t.creator_id) || {
        id: t.creator_id,
        display_name: 'Creator',
        photo_url: null
      };

      return {
        id: t.id,
        creator: {
          id: creator.id,
          name: creator.display_name,
          photo_url: creator.photo_url
        },
        amount: Number(t.amount || 0),
        message: t.supporter_message,
        status: t.status,
        date: t.completed_at || t.created_at
      };
    });

    return NextResponse.json({ history });
  } catch (error) {
    logger.error('Support history error', 'SUPPORTER_HISTORY', {
      error: error instanceof Error ? error.message : 'Unknown'
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
