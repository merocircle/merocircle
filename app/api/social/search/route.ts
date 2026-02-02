import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOptionalUser } from '@/lib/api-utils'

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

    const user = await getOptionalUser()
    const supabase = await createClient()

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