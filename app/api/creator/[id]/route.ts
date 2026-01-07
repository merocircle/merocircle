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

    const { data: creatorProfile, error: profileError } = await supabase
      .from('creator_profiles')
      .select('*, users!inner(id, display_name, email, photo_url, role)')
      .eq('user_id', creatorId)
      .single()

    if (profileError || !creatorProfile) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    let isFollowing = false
    if (user) {
      const { data: followData } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', creatorId)
        .single()
      isFollowing = !!followData
    }

    const { data: paymentMethods } = await supabase
      .from('creator_payment_methods')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('is_active', true)

    const { data: posts } = await supabase
      .from('posts')
      .select('*, post_likes(id, user_id)')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false })
      .limit(20)

    const formattedPosts = (posts || []).map((post: any) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      image_url: post.image_url,
      type: post.image_url ? 'image' : 'text',
      likes: post.post_likes?.length || 0,
      comments: 0,
      views: 0,
      createdAt: post.created_at,
      isPublic: post.is_public,
      isLiked: user ? post.post_likes?.some((like: any) => like.user_id === user.id) : false
    }))

    return NextResponse.json({
      success: true,
      creatorDetails: {
        user_id: creatorProfile.user_id,
        display_name: creatorProfile.users.display_name,
        email: creatorProfile.users.email,
        avatar_url: creatorProfile.users.photo_url,
        bio: creatorProfile.bio,
        category: creatorProfile.category,
        verified: creatorProfile.is_verified,
        follower_count: creatorProfile.followers_count || 0,
        post_count: creatorProfile.posts_count || 0,
        total_earnings: creatorProfile.total_earnings || 0,
        join_date: creatorProfile.created_at,
        is_following: isFollowing
      },
      paymentMethods: (paymentMethods || []).map((m: any) => ({
        type: m.payment_type,
        details: m.phone_number || m.account_number || m.merchant_id || '',
        qr_code: m.qr_code_url
      })),
      posts: formattedPosts
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 