import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
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
    
    // Get current user (optional for search)
    const { data: { user } } = await supabase.auth.getUser()

    // Call the optimized creator search function
    const { data: searchData, error: searchError } = await supabase
      .rpc('search_creators', {
        search_query: query.trim(),
        search_limit: limit
      })

    if (searchError) {
      throw searchError
    }

    // Transform and add follow status for each creator
    let resultsWithFollowStatus = (searchData || []).map(creator => ({
      ...creator,
      avatar_url: creator.photo_url || null, // Map photo_url to avatar_url
      follower_count: creator.followers_count || 0, // Map followers_count to follower_count
      following_count: 0, // Not available from search, default to 0
      total_earned: Number(creator.total_earnings) || 0, // Map total_earnings to total_earned
      created_at: new Date().toISOString(), // Default value since not in search results
      isFollowing: false // Default, will be updated if user is logged in
    }))
    
    if (user && searchData?.length) {
      const creatorIds = searchData.map(creator => creator.user_id)
      
      const { data: followData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .in('following_id', creatorIds)

      const followedCreatorIds = new Set(followData?.map(f => f.following_id) || [])
      
      resultsWithFollowStatus = resultsWithFollowStatus.map(creator => ({
        ...creator,
        isFollowing: followedCreatorIds.has(creator.user_id)
      }))
    }

    return NextResponse.json({
      success: true,
      data: resultsWithFollowStatus,
      total: resultsWithFollowStatus.length,
      query: query.trim()
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 