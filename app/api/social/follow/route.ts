import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { creatorId, action } = await request.json()
    
    if (!creatorId || !action || !['follow', 'unfollow'].includes(action)) {
      return NextResponse.json(
        { error: 'Creator ID and valid action (follow/unfollow) required' },
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
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if trying to follow themselves
    if (user.id === creatorId) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      )
    }

    // Check if creator exists
    const { data: creator, error: creatorError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', creatorId)
      .single()

    if (creatorError || !creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      )
    }

    if (action === 'follow') {
      // Add follow relationship
      const { error: followError } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: creatorId
        })

      if (followError) {
        // Check if already following
        if (followError.code === '23505') {
          return NextResponse.json(
            { error: 'Already following this creator' },
            { status: 409 }
          )
        }
        throw followError
      }

      supabase
        .from('user_activities')
        .insert({
          user_id: user.id,
          activity_type: 'user_followed',
          target_id: creatorId,
          target_type: 'user',
          metadata: { action: 'followed' }
        })
        .then()

      return NextResponse.json({ 
        success: true, 
        message: 'Successfully followed creator',
        action: 'followed'
      })

    } else if (action === 'unfollow') {
      // Remove follow relationship
      const { error: unfollowError } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', creatorId)

      if (unfollowError) {
        throw unfollowError
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Successfully unfollowed creator',
        action: 'unfollowed'
      })
    }

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const creatorId = searchParams.get('creatorId')
    
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
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user follows this creator
    const { data: follow, error: followError } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', creatorId)
      .single()

    if (followError && followError.code !== 'PGRST116') {
      throw followError
    }

    return NextResponse.json({ 
      isFollowing: !!follow 
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
