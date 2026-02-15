import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { getAuthenticatedUser, requireCreatorRole, handleApiError } from '@/lib/api-utils';

export async function PATCH(request: NextRequest) {
  try {
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user) return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { errorResponse: roleError } = await requireCreatorRole(user.id);
    if (roleError) return roleError;

    const body = await request.json();
    const { tiers } = body;

    if (!Array.isArray(tiers)) {
      return NextResponse.json({ error: 'Invalid request: tiers must be an array' }, { status: 400 });
    }

    const supabase = await createClient();

    for (const t of tiers) {
      const { tier_level, price, tier_name, description, benefits, extra_perks } = t;
      if (!tier_level || !Number.isInteger(tier_level) || tier_level < 1 || tier_level > 3) continue;

      const updates: Record<string, unknown> = { price: parseFloat(String(price)) || 0 };
      if (tier_name !== undefined) updates.tier_name = tier_name;
      if (description !== undefined) updates.description = description;
      if (Array.isArray(benefits)) updates.benefits = benefits;
      if (Array.isArray(extra_perks)) updates.extra_perks = extra_perks;

      const { error } = await supabase
        .from('subscription_tiers')
        .update(updates)
        .eq('creator_id', user.id)
        .eq('tier_level', tier_level);

      if (error) {
        logger.error('Error updating tier', 'CREATOR_TIERS_API', { error: error.message, tier_level, userId: user.id });
        return NextResponse.json({ error: 'Failed to update tiers' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'CREATOR_TIERS_API', 'Failed to update tiers');
  }
}
