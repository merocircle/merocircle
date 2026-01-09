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
      logger.error('Error fetching supported creators', 'SUPPORTER_API', { error: creatorsError.message, userId: user.id });
      return NextResponse.json({ error: 'Failed to fetch supported creators' }, { status: 500 });
    }

    const creatorMap = new Map();
    
    supportedCreators?.forEach((transaction: Record<string, unknown>) => {
      const creatorId = transaction.creator_id as string
      const creator = transaction.users as Record<string, unknown> | null
      const profile = transaction.creator_profiles as Record<string, unknown> | null
      
      if (!creator || !profile) return
      
      if (creatorMap.has(creatorId)) {
        const existing = creatorMap.get(creatorId)
        existing.totalSupported += transaction.amount as number
        existing.transactionCount += 1
        if (new Date(transaction.created_at as string) > new Date(existing.lastSupportDate)) {
          existing.lastSupportDate = transaction.created_at as string
        }
      } else {
        creatorMap.set(creatorId, {
          id: creatorId,
          name: creator.display_name ? String(creator.display_name) : 'Unknown',
          photo_url: creator.photo_url ? String(creator.photo_url) : null,
          category: profile.category ? String(profile.category) : null,
          bio: profile.bio ? String(profile.bio) : null,
          is_verified: profile.is_verified === true,
          totalSupported: transaction.amount as number,
          transactionCount: 1,
          lastSupportDate: transaction.created_at as string
        })
      }
    })

    const creators = Array.from(creatorMap.values())
      .sort((a, b) => new Date(b.lastSupportDate).getTime() - new Date(a.lastSupportDate).getTime())

    return NextResponse.json({ creators })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 