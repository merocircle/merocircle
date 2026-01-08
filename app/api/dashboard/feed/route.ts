import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch following relationships
    const { data: following, error: followingError } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)

    const followingIds = following?.map(f => f.following_id) || []
    
    // Fetch creator profiles and user details for following creators
    let followingCreators: any[] = []
    if (followingIds.length > 0) {
      const { data: profiles } = await supabase
        .from('creator_profiles')
        .select('*, users(id, display_name, photo_url)')
        .in('user_id', followingIds)
      
      followingCreators = (profiles || []).map((p: any) => ({
        id: p.user_id,
        name: p.users?.display_name || 'Creator',
        category: p.category || 'Creator',
        avatar: p.users?.photo_url || null,
        supporters: p.followers_count || 0,
        isVerified: p.is_verified || false,
        posts_count: p.posts_count || 0
      }))
    }
    
    // Fetch recent posts from followed creators
    let recentActivity = []
    if (followingIds.length > 0) {
      const { data: posts } = await supabase
        .from('posts')
        .select('*, users(id, display_name, photo_url)')
        .in('creator_id', followingIds)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(10)
      recentActivity = posts || []
    }

    // Fetch support transactions first
    const { data: supportTransactions, error: transactionsError } = await supabase
      .from('supporter_transactions')
      .select('id, amount, created_at, creator_id')
      .eq('supporter_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })

    // Get unique creator IDs and fetch their details
    const creatorIds = [...new Set((supportTransactions || []).map((t: any) => t.creator_id))]
    let creatorsMap = new Map()
    
    if (creatorIds.length > 0) {
      const { data: creators } = await supabase
        .from('users')
        .select('id, display_name, photo_url')
        .in('id', creatorIds)
      
      creatorsMap = new Map((creators || []).map((c: any) => [c.id, c]))
    }

    const totalSupported = (supportTransactions || []).reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0
    const thisMonth = new Date()
    thisMonth.setDate(1)
    const thisMonthSupport = (supportTransactions || []).filter(t => new Date(t.created_at) >= thisMonth)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0

    const uniqueCreatorsSupported = creatorIds.length

    const supportActivities = (supportTransactions || []).slice(0, 10).map((t: any) => {
      const creator = creatorsMap.get(t.creator_id) || {
        id: t.creator_id,
        display_name: 'Creator',
        photo_url: null
      }
      
      return {
        id: t.id,
        creator: creator.display_name,
        creatorId: t.creator_id,
        action: 'supported',
        title: `Supported with NPR ${Number(t.amount || 0).toLocaleString()}`,
        content: null,
        time: t.created_at,
        type: 'support',
        amount: Number(t.amount || 0)
      }
    })

    const postActivities = (recentActivity || []).map((p: any) => ({
      id: p.id,
      creator: p.users?.display_name || 'Creator',
      creatorId: p.creator_id,
      action: 'posted',
      title: p.title || 'New post',
      content: p.content,
      time: p.created_at,
      type: p.image_url ? 'image' : 'text',
      likes: 0,
      comments: 0
    }));

    const allRecentActivity = [...supportActivities, ...postActivities]
      .sort((a, b) => {
        const timeA = a.time ? new Date(a.time).getTime() : 0;
        const timeB = b.time ? new Date(b.time).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, 20)

    return NextResponse.json({
      stats: {
        totalSupported,
        creatorsSupported: uniqueCreatorsSupported,
        thisMonth: thisMonthSupport,
        favoriteCreators: followingIds.length
      },
      followingCreators: followingCreators,
      recentActivity: allRecentActivity
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

