import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const creatorId = params.id
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    
    if (!creatorId) {
      return NextResponse.json(
        { error: 'Creator ID required' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
    
    // Get current user (optional for like status)
    const { data: { user } } = await supabase.auth.getUser()

    // Get creator's posts with engagement data
    const { data: postsData, error: postsError } = await supabase
      .rpc('get_creator_posts', { 
        creator_user_id: creatorId,
        current_user_id: user?.id || null,
        post_limit: limit
      })

    if (postsError) {
      console.error('Creator posts error:', postsError)
      return NextResponse.json(
        { error: 'Failed to fetch creator posts' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      posts: postsData || [],
      success: true
    })
    
  } catch (error) {
    console.error('Creator posts API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 