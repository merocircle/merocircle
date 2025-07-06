import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const creatorId = params.id
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { tierId, action } = body

    if (!tierId || !action) {
      return NextResponse.json(
        { error: 'Tier ID and action are required' },
        { status: 400 }
      )
    }

    if (action === 'subscribe') {
      // Get tier details
      const { data: tier, error: tierError } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('id', tierId)
        .eq('creator_id', creatorId)
        .eq('is_active', true)
        .single()

      if (tierError || !tier) {
        return NextResponse.json(
          { error: 'Subscription tier not found' },
          { status: 404 }
        )
      }

      // Check if already subscribed to this tier
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('subscriber_id', user.id)
        .eq('tier_id', tierId)
        .eq('status', 'active')
        .single()

      if (existingSub) {
        return NextResponse.json(
          { error: 'Already subscribed to this tier' },
          { status: 400 }
        )
      }

      // Create subscription
      const nextBillingDate = new Date()
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)

      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .insert({
          subscriber_id: user.id,
          creator_id: creatorId,
          tier_id: tierId,
          amount: tier.price,
          next_billing_date: nextBillingDate.toISOString().split('T')[0],
          status: 'active'
        })
        .select()
        .single()

      if (subError) {
        console.error('Subscription creation error:', subError)
        return NextResponse.json(
          { error: 'Failed to create subscription' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        subscription,
        message: `Successfully subscribed to ${tier.tier_name}`
      })

    } else if (action === 'unsubscribe') {
      // Cancel subscription
      const { data: subscription, error: cancelError } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'cancelled',
          auto_renew: false,
          end_date: new Date().toISOString().split('T')[0]
        })
        .eq('subscriber_id', user.id)
        .eq('tier_id', tierId)
        .eq('status', 'active')
        .select()
        .single()

      if (cancelError) {
        console.error('Unsubscribe error:', cancelError)
        return NextResponse.json(
          { error: 'Failed to cancel subscription' },
          { status: 500 }
        )
      }

      if (!subscription) {
        return NextResponse.json(
          { error: 'No active subscription found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        subscription,
        message: 'Successfully cancelled subscription'
      })

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "subscribe" or "unsubscribe"' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Subscription API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 