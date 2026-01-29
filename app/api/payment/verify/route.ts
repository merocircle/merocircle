import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { config } from '@/lib/config';
import { logger } from '@/lib/logger';
import { upsertSupporter, updateSupporterCount } from '@/lib/payment-utils';
import { handleApiError } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transaction_uuid = searchParams.get('transaction_uuid');
    const total_amount = searchParams.get('total_amount');

    if (!transaction_uuid || !total_amount) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: transaction, error: transactionError } = await supabase
      .from('supporter_transactions')
      .select('*')
      .eq('transaction_uuid', transaction_uuid)
      .single();

    if (transactionError || !transaction) {
      logger.error('Transaction not found', 'PAYMENT_VERIFY', { transaction_uuid });
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    const transactionAmount = Number(transaction.amount);
    const receivedAmount = Number(total_amount);
    
    if (Math.abs(transactionAmount - receivedAmount) > 0.01) {
      logger.warn('Amount mismatch', 'PAYMENT_VERIFY', {
        transaction_uuid,
        expected: transaction.amount,
        received: total_amount,
        transactionAmount,
        receivedAmount
      });
      return NextResponse.json(
        { error: 'Amount mismatch' },
        { status: 400 }
      );
    }

    if (transaction.status === 'completed') {
      return NextResponse.json({
        success: true,
        status: 'completed',
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          transaction_uuid: transaction.transaction_uuid,
          created_at: transaction.created_at,
        }
      });
    }

    const updateData: {
      status: string;
      completed_at: string;
      esewa_data: Record<string, unknown>;
    } = {
      status: 'completed',
      completed_at: new Date().toISOString(),
      esewa_data: {
        ...transaction.esewa_data,
        status: 'COMPLETE',
        verified_at: new Date().toISOString(),
      }
    };

    if (config.esewa.testMode) {
      updateData.esewa_data.ref_id = `TEST-${Date.now()}`;
    }

    const { error: updateError } = await supabase
      .from('supporter_transactions')
      .update(updateData)
      .eq('id', transaction.id);

    if (updateError) {
      logger.error('Failed to update transaction status', 'PAYMENT_VERIFY', {
        error: updateError.message,
        transactionId: transaction.id
      });
      return NextResponse.json(
        { error: 'Failed to update transaction' },
        { status: 500 }
      );
    }

    // Ensure supporter record exists
    if (transaction.supporter_id && transaction.creator_id) {
      // Get tier level from transaction metadata
      const tierLevel = transaction.esewa_data?.tier_level || 1;
      await upsertSupporter(transaction.supporter_id, transaction.creator_id, transactionAmount, tierLevel);

      // Channel membership is now handled by database trigger
      // Just sync the supporter to Stream Chat
      try {
        // Use internal API call to sync supporter to Stream channels
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        await fetch(`${baseUrl}/api/stream/sync-supporter`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supporterId: transaction.supporter_id,
            creatorId: transaction.creator_id,
            tierLevel,
          }),
        });
        logger.info('Supporter synced to Stream channels', 'PAYMENT_VERIFY', {
          supporterId: transaction.supporter_id,
          creatorId: transaction.creator_id,
          tierLevel,
        });
      } catch (streamError) {
        logger.warn('Failed to sync supporter to Stream', 'PAYMENT_VERIFY', {
          error: streamError instanceof Error ? streamError.message : 'Unknown',
        });
        // Don't fail the payment if Stream sync fails
      }
    }

    // Update supporters_count in creator_profiles
    if (transaction.creator_id) {
      await updateSupporterCount(transaction.creator_id);
    }

    logger.info('Transaction completed successfully', 'PAYMENT_VERIFY', {
      transactionId: transaction.id,
      creatorId: transaction.creator_id,
      supporterId: transaction.supporter_id,
      amount: transactionAmount
    });

    return NextResponse.json({
      success: true,
      status: 'completed',
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        transaction_uuid: transaction.transaction_uuid,
        created_at: transaction.created_at,
      },
      test_mode: config.esewa.testMode
    });
  } catch (error) {
    return handleApiError(error, 'PAYMENT_VERIFY', 'Payment verification failed');
  }
}

