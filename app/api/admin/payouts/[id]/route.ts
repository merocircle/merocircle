import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser, handleApiError } from '@/lib/api-utils';
import { requireAdmin } from '@/lib/admin-middleware';
import { logger } from '@/lib/logger';

/**
 * PATCH /api/admin/payouts/[id]
 * Update payout status (mark as completed, processing, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user) {
      return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin access
    const { isAdmin: userIsAdmin, error: adminError } = await requireAdmin(user.id);
    if (adminError) return adminError;

    const { id: payoutId } = await params;
    const { status, payoutReference, notes } = await request.json();

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['pending', 'processing', 'completed', 'failed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      }, { status: 400 });
    }

    const supabase = await createClient();

    // Prepare update data
    const updateData: any = { status };
    if (payoutReference) updateData.payout_reference = payoutReference;
    if (notes) updateData.notes = notes;
    if (status === 'completed') updateData.completed_at = new Date().toISOString();

    // Update payout
    const { data: payout, error: updateError } = await supabase
      .from('creator_payouts')
      .update(updateData)
      .eq('id', payoutId)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to update payout', 'ADMIN_PAYOUTS_API', {
        error: updateError.message,
        payoutId
      });
      return NextResponse.json({ error: 'Failed to update payout' }, { status: 500 });
    }

    // If status is 'completed', update all linked transactions to 'paid_out'
    if (status === 'completed') {
      const { error: txnUpdateError } = await supabase
        .from('supporter_transactions')
        .update({ payout_status: 'paid_out' })
        .eq('payout_id', payoutId);

      if (txnUpdateError) {
        logger.error('Failed to update transactions after payout completion', 'ADMIN_PAYOUTS_API', {
          error: txnUpdateError.message,
          payoutId
        });
      }
    }

    logger.info('Payout updated successfully', 'ADMIN_PAYOUTS_API', {
      payoutId,
      status,
      adminUserId: user.id
    });

    return NextResponse.json({
      success: true,
      payout: {
        id: payout.id,
        status: payout.status,
        completedAt: payout.completed_at
      },
      message: 'Payout updated successfully'
    });
  } catch (error) {
    return handleApiError(error, 'ADMIN_PAYOUTS_API', 'Failed to update payout');
  }
}
