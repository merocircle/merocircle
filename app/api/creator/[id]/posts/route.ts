import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOptionalUser, handleApiError } from '@/lib/api-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: creatorId } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const user = await getOptionalUser(request)
    const supabase = await createClient()

    const { data: postsData, error: postsError } = await supabase
      .rpc('get_creator_posts', { 
        creator_user_id: creatorId,
        current_user_id: user?.id || null,
        post_limit: limit
      })

    if (postsError) {
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
    }

    return NextResponse.json({ posts: postsData || [], success: true })
  } catch (error) {
    return handleApiError(error, 'CREATOR_POSTS_API', 'Failed to fetch creator posts')
  }
} 