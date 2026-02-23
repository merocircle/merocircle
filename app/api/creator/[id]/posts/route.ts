import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOptionalUser, handleApiError } from '@/lib/api-utils'

const DEFAULT_LIMIT = 10
const MAX_LIMIT = 50

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: creatorId } = await params
    const { searchParams } = new URL(request.url)
    const limit = Math.min(MAX_LIMIT, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10))
    const user = await getOptionalUser()
    const supabase = await createClient()

    // Creator profile for formatting
    const { data: creatorProfileRow, error: profileError } = await supabase
      .from('creator_profiles')
      .select('category, is_verified')
      .eq('user_id', creatorId)
      .single()

    if (profileError || !creatorProfileRow) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    const profileRow = creatorProfileRow as { category: string | null; is_verified: boolean }
    const creatorProfile = {
      category: profileRow.category ?? null,
      is_verified: !!profileRow.is_verified
    }

    const { data: creatorUserRow } = await supabase
      .from('users')
      .select('id, display_name, photo_url, role')
      .eq('id', creatorId)
      .single()

    const creatorUser = creatorUserRow
      ? {
          id: (creatorUserRow as { id: string }).id,
          display_name: (creatorUserRow as { display_name: string | null }).display_name ?? '',
          photo_url: (creatorUserRow as { photo_url: string | null }).photo_url ?? null,
          role: (creatorUserRow as { role: string }).role ?? 'creator'
        }
      : null

    const { data: supporterData } = user
      ? await supabase
          .from('supporters')
          .select('tier_level')
          .eq('supporter_id', user.id)
          .eq('creator_id', creatorId)
          .eq('is_active', true)
          .maybeSingle()
      : { data: null }
    const isSupporter = !!supporterData

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select(`
        *,
        post_likes(id, user_id),
        post_comments(id, content, created_at, user_id, users(id, display_name, photo_url)),
        users!posts_creator_id_fkey(id, display_name, photo_url, role),
        polls(id, question, allows_multiple_answers, expires_at)
      `)
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (postsError) {
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
    }

    const formattedPosts = (posts || []).map((post: {
      id: string
      title: string
      content: string
      image_url: string | null
      image_urls?: string[]
      media_url: string | null
      is_public: boolean
      tier_required: string | null
      post_type?: string
      created_at: string
      updated_at: string
      creator_id: string
      users?: { id: string; display_name: string; photo_url: string | null; role: string }
      post_likes?: Array<{ id: string; user_id: string }>
      post_comments?: Array<{ id: string; content: string; created_at: string }>
      polls?: { id: string; question: string; allows_multiple_answers: boolean; expires_at: string | null }
    }) => {
      const isSupporterOnly = !post.is_public || (post.tier_required && post.tier_required !== 'free')
      const shouldHideContent = isSupporterOnly && !isSupporter && user?.id !== creatorId

      return {
        id: post.id,
        title: post.title,
        content: shouldHideContent ? null : post.content,
        image_url: post.image_url,
        image_urls: post.image_urls || [],
        media_url: post.media_url,
        is_public: post.is_public,
        tier_required: post.tier_required || 'free',
        post_type: post.post_type || 'post',
        created_at: post.created_at,
        updated_at: post.updated_at,
        creator_id: post.creator_id,
        creator: {
          id: post.users?.id || creatorId,
          display_name: post.users?.display_name ?? creatorUser?.display_name ?? '',
          photo_url: post.users?.photo_url ?? creatorUser?.photo_url ?? null,
          role: post.users?.role || 'creator'
        },
        creator_profile: {
          category: creatorProfile.category,
          is_verified: creatorProfile.is_verified
        },
        poll: shouldHideContent ? null : (post.polls || null),
        likes: post.post_likes || [],
        comments: post.post_comments || [],
        likes_count: post.post_likes?.length || 0,
        comments_count: post.post_comments?.length || 0,
        is_liked: !!user && (post.post_likes || []).some((like: { user_id: string }) => like.user_id === user.id)
      }
    })

    const has_more = formattedPosts.length === limit

    return NextResponse.json({
      posts: formattedPosts,
      has_more,
      success: true
    })
  } catch (error) {
    return handleApiError(error, 'CREATOR_POSTS_API', 'Failed to fetch creator posts')
  }
}
