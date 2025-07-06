import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const creatorId = params.id
    const supabase = await createClient()
    
    // Get current user ID if authenticated
    const { data: { user } } = await supabase.auth.getUser()
    const viewerId = user?.id || null

    // Get detailed creator information
    const { data, error } = await supabase
      .rpc('get_creator_details', {
        creator_user_id: creatorId,
        viewer_user_id: viewerId
      })

    if (error) {
      console.error('Creator details error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch creator details' },
        { status: 500 }
      )
    }

    if (!data || !data.creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      ...data
    })

  } catch (error) {
    console.error('Creator details API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 