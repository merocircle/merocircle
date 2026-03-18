import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOptionalUser } from '@/lib/api-utils'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '20')

    logger.info('Creator search request', 'SOCIAL_SEARCH_API', { query: query?.slice(0, 50), limit })

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
      } as any)

    if (searchError) {
      throw searchError
    }

    // Transform search results and fetch usernames
    const resultsWithUsernames = await Promise.all(
      (searchData || []).map(async (creator: any) => {
        // Fetch username and vanity_username for each creator
        const { data: userData } = await supabase
          .from('users')
          .select('username')
          .eq('id', creator.user_id)
          .maybeSingle();
        
        const { data: profileData } = await supabase
          .from('creator_profiles')
          .select('vanity_username')
          .eq('user_id', creator.user_id)
          .maybeSingle();

        return {
          ...creator,
          avatar_url: creator.photo_url || null,
          supporter_count: creator.supporters_count || 0,
          total_earned: Number(creator.total_earnings) || 0,
          created_at: new Date().toISOString(),
          username: profileData?.vanity_username || userData?.username || null,
          vanity_username: profileData?.vanity_username || null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: resultsWithUsernames,
      total: resultsWithUsernames.length,
      query: query.trim()
    })

  } catch (error) {
    logger.error('Creator search failed', 'SOCIAL_SEARCH_API', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 