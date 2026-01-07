import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: creatorId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user || user.id !== creatorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { data: creatorProfile } = await supabase
      .from('creator_profiles')
      .select('*')
      .eq('user_id', creatorId)
      .single()

    if (!creatorProfile) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
    }

    const { data: posts } = await supabase
      .from('posts')
      .select('*, post_likes(id), post_comments(id)')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false })
      .limit(20)

    const { data: supporters } = await supabase
      .from('supporters')
      .select('*, users!supporters_supporter_id_fkey(id, display_name, photo_url)')
      .eq('creator_id', creatorId)
      .eq('is_active', true)

    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, created_at')
      .eq('creator_id', creatorId)
      .eq('status', 'completed')

    const totalEarnings = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0
    const thisMonth = new Date()
    thisMonth.setDate(1)
    const monthlyEarnings = transactions?.filter(t => new Date(t.created_at) >= thisMonth)
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0

    return NextResponse.json({
      stats: {
        monthlyEarnings,
        totalEarnings,
        supporters: supporters?.length || 0,
        posts: posts?.length || 0,
        followers: creatorProfile.followers_count || 0
      },
      posts: (posts || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        content: p.content,
        type: p.image_url ? 'image' : 'text',
        likes: p.post_likes?.length || 0,
        comments: p.post_comments?.length || 0,
        createdAt: p.created_at,
        isPublic: p.is_public
      })),
      supporters: (supporters || []).map((s: any) => ({
        id: s.supporter_id,
        name: s.users?.display_name || 'Supporter',
        amount: Number(s.amount) || 0,
        joined: s.created_at,
        avatar: s.users?.photo_url
      }))
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

