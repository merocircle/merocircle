import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: creatorId } = await params;
    const supabase = await createClient();

    const { data: tiers, error } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('is_active', true)
      .order('tier_level', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tiers: tiers || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: creatorId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.id !== creatorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tiers } = await request.json();

    if (!Array.isArray(tiers) || tiers.length !== 3) {
      return NextResponse.json({ error: 'Must provide exactly 3 tiers' }, { status: 400 });
    }

    // Update each tier
    const updates = tiers.map((tier: any) =>
      supabase
        .from('subscription_tiers')
        .update({
          tier_name: tier.tier_name,
          price: tier.price,
          description: tier.description,
          benefits: tier.benefits
        })
        .eq('creator_id', creatorId)
        .eq('tier_level', tier.tier_level)
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
