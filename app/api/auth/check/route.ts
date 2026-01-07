import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({
        authenticated: false,
        user: null,
        userProfile: null,
        creatorProfile: null
      })
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    let creatorProfile = null
    if (userProfile?.role === 'creator') {
      const { data: creator } = await supabase
        .from('creator_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      creatorProfile = creator
    }

    return NextResponse.json({
      authenticated: true,
      user: { id: user.id, email: user.email, created_at: user.created_at },
      userProfile,
      creatorProfile
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
