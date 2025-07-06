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
    
    // Get current user (optional for viewing profiles)
    const { data: { user } } = await supabase.auth.getUser()

    // Get creator profile with stats and follow status
    const { data: creatorData, error: creatorError } = await supabase
      .rpc('get_creator_profile', { 
        creator_user_id: creatorId,
        current_user_id: user?.id || null
      })

    if (creatorError) {
      console.error('Creator profile error:', creatorError)
      return NextResponse.json(
        { error: 'Failed to fetch creator profile' },
        { status: 500 }
      )
    }

    if (!creatorData || creatorData.length === 0) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      creator: creatorData[0],
      success: true
    })
    
  } catch (error) {
    console.error('Creator profile API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 