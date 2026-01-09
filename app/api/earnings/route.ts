import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateTotalAmount } from '@/lib/api-helpers';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userProfile || userProfile.role !== 'creator') {
      return NextResponse.json({ error: 'Creator access required' }, { status: 403 });
    }

    const { data: transactions } = await supabase
      .from('supporter_transactions')
      .select('amount, created_at, supporter_id')
      .eq('creator_id', user.id)
      .eq('status', 'completed');

    const totalEarnings = calculateTotalAmount(transactions || []);
    const uniqueSupporters = new Set(transactions?.map(t => t.supporter_id) || []).size;

    return NextResponse.json({
      summary: {
        totalEarnings,
        totalSupporters: uniqueSupporters,
        averageSupport: uniqueSupporters > 0 ? totalEarnings / uniqueSupporters : 0
      },
      recentTransactions: (transactions || []).slice(0, 10)
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
