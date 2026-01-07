import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get support history (transactions) for this user
    const { data: transactions, error: transactionsError } = await supabase
      .from('supporter_transactions')
      .select(`
        id,
        amount,
        message,
        status,
        created_at,
        users!supporter_transactions_creator_id_fkey(
          id,
          display_name,
          photo_url
        )
      `)
      .eq('supporter_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (transactionsError) {
      console.error('Error fetching support history:', transactionsError);
      return NextResponse.json({ error: 'Failed to fetch support history' }, { status: 500 });
    }

    // Format the response
    const history = transactions?.map(transaction => ({
      id: transaction.id,
      creator: {
        id: transaction.users?.id,
        name: transaction.users?.display_name,
        photo_url: transaction.users?.photo_url
      },
      amount: transaction.amount,
      message: transaction.message,
      status: transaction.status,
      date: transaction.created_at
    })) || [];

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Support history API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 