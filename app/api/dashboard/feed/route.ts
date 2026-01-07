import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: following } = await supabase
      .from('follows')
      .select('following_id, creator_profiles!follows_following_id_fkey(*, users!inner(id, display_name, photo_url))')
      .eq('follower_id', user.id)

    const followingIds = following?.map(f => f.following_id) || []
    let recentActivity = []
    
    if (followingIds.length > 0) {
      const { data: posts } = await supabase
        .from('posts')
        .select('*, users!inner(id, display_name, photo_url)')
        .in('creator_id', followingIds)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(10)
      recentActivity = posts || []
    }

    const { data: supportTransactions } = await supabase
      .from('supporter_transactions')
      .select('amount, created_at')
      .eq('supporter_id', user.id)
      .eq('status', 'completed')

    const totalSupported = supportTransactions?.reduce((sum, t) => sum + t.amount, 0) || 0
    const thisMonth = new Date()
    thisMonth.setDate(1)
    const thisMonthSupport = supportTransactions?.filter(t => new Date(t.created_at) >= thisMonth)
      .reduce((sum, t) => sum + t.amount, 0) || 0

    return NextResponse.json({
      stats: {
        totalSupported,
        creatorsSupported: new Set(followingIds).size,
        thisMonth: thisMonthSupport,
        favoriteCreators: followingIds.length
      },
      followingCreators: (following || []).map((f: any) => ({
        id: f.creator_profiles.user_id,
        name: f.creator_profiles.users.display_name,
        category: f.creator_profiles.category || 'Creator',
        avatar: f.creator_profiles.users.photo_url,
        supporters: f.creator_profiles.followers_count || 0,
        isVerified: f.creator_profiles.is_verified || false,
        posts_count: f.creator_profiles.posts_count || 0
      })),
      recentActivity: recentActivity.map((p: any) => ({
        id: p.id,
        creator: p.users.display_name,
        creatorId: p.creator_id,
        action: 'posted',
        title: p.title || 'New post',
        content: p.content,
        time: p.created_at,
        type: p.image_url ? 'image' : 'text',
        likes: 0,
        comments: 0
      }))
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

