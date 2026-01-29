import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateAmount, validateUUID } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/api-utils';

/**
 * Validate payment request data
 */
export function validatePaymentRequest(
  amount: string | number,
  creatorId: string,
  supporterId: string
): {
  valid: boolean;
  errorResponse: NextResponse | null;
  validatedAmount?: number;
} {
  // Validate amount
  const amountValidation = validateAmount(amount);
  if (!amountValidation.valid) {
    return {
      valid: false,
      errorResponse: NextResponse.json({ error: amountValidation.error }, { status: 400 }),
    };
  }

  // Validate UUIDs
  if (!validateUUID(creatorId) || !validateUUID(supporterId)) {
    return {
      valid: false,
      errorResponse: NextResponse.json({ error: 'Invalid user IDs' }, { status: 400 }),
    };
  }

  return {
    valid: true,
    errorResponse: null,
    validatedAmount: amountValidation.value,
  };
}

/**
 * Verify creator exists
 */
export async function verifyCreator(creatorId: string): Promise<{
  exists: boolean;
  creator: { id: string; display_name: string } | null;
  errorResponse: NextResponse | null;
}> {
  const supabase = await createClient();
  const { data: creator, error } = await supabase
    .from('users')
    .select('id, display_name')
    .eq('id', creatorId)
    .single();

  if (error || !creator) {
    return {
      exists: false,
      creator: null,
      errorResponse: NextResponse.json({ error: 'Creator not found' }, { status: 404 }),
    };
  }

  return { exists: true, creator, errorResponse: null };
}

/**
 * Generate transaction UUID
 */
export function generateTransactionUuid(prefix: string = ''): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
}

/**
 * Update supporter count for a creator
 */
export async function updateSupporterCount(creatorId: string): Promise<number> {
  const supabase = await createClient();
  const { data: countResult } = await supabase
    .from('supporters')
    .select('supporter_id')
    .eq('creator_id', creatorId)
    .eq('is_active', true);

  if (!countResult) return 0;

  const uniqueSupporters = new Set(countResult.map((r) => r.supporter_id)).size;
  
  await supabase
    .from('creator_profiles')
    .update({ supporters_count: uniqueSupporters })
    .eq('user_id', creatorId);

  logger.info('Updated supporter count', 'PAYMENT_UTILS', {
    creatorId,
    supportersCount: uniqueSupporters,
  });

  return uniqueSupporters;
}

/**
 * Ensure supporter record exists or update it
 */
export async function upsertSupporter(
  supporterId: string,
  creatorId: string,
  amount: number,
  tierLevel: number = 1
): Promise<void> {
  const supabase = await createClient();
  
  const { data: existingSupporter } = await supabase
    .from('supporters')
    .select('id')
    .eq('supporter_id', supporterId)
    .eq('creator_id', creatorId)
    .single();

  if (!existingSupporter) {
    await supabase.from('supporters').insert({
      supporter_id: supporterId,
      creator_id: creatorId,
      tier: 'basic',
      tier_level: tierLevel,
      amount,
      is_active: true,
    });
  } else {
    await supabase
      .from('supporters')
      .update({
        is_active: true,
        tier_level: tierLevel,
        amount,
      })
      .eq('id', existingSupporter.id);
  }
}
