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

    // Transform search results
    const results = (searchData || []).map((creator: Record<string, unknown>) => ({
      ...creator,
      avatar_url: creator.photo_url || null,
      supporter_count: creator.supporters_count || 0,
      total_earned: Number(creator.total_earnings) || 0,
      created_at: new Date().toISOString(),
    }))

    return NextResponse.json({
      success: true,
      data: results,
      total: results.length,
      query: query.trim()
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 