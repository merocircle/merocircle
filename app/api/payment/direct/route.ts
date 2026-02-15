import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeString } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { validatePaymentRequest, validatePaymentRequestAllowZero, verifyCreator, generateTransactionUuid } from '@/lib/payment-utils';
import { processPaymentSuccess } from '@/lib/payment-success-engine';
import { handleApiError } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, creatorId, supporterId, supporterMessage, tier_level } = body;

    // Validate payment request (allow zero for free tier)
    const allowZero = amount === 0 || amount === '0';
    const validation = allowZero
      ? validatePaymentRequestAllowZero(amount, creatorId, supporterId)
      : validatePaymentRequest(amount, creatorId, supporterId);
    if (!validation.valid || validation.validatedAmount === undefined) {
      return validation.errorResponse!;
    }

    // Verify creator exists
    const { exists, creator, errorResponse } = await verifyCreator(creatorId);
    if (!exists || !creator) {
      return errorResponse!;
    }

    const supabase = await createClient();

    // Generate transaction UUID
    const transactionUuid = generateTransactionUuid('DIRECT');
    const amountStr = validation.validatedAmount.toString();
    const tierLevel = tier_level || 1;

    // Create transaction as completed (bypassing payment gateway)
    const insertData: any = {
      supporter_id: supporterId,
      creator_id: creatorId,
      amount: amountStr,
      payment_method: 'direct',
      status: 'completed',
      supporter_message: supporterMessage ? sanitizeString(supporterMessage) : null,
      transaction_uuid: transactionUuid,
      completed_at: new Date().toISOString(),
      // Store tier_level as direct column (business logic, not gateway-specific)
      tier_level: tierLevel,
      // Gateway-specific data (no tier_level here - it's business logic)
      esewa_data: {
        transaction_uuid: transactionUuid,
        payment_method: 'direct',
        bypassed: true,
        created_at: new Date().toISOString(),
      }
    };

    const { data: transaction, error: transactionError } = await supabase
      .from('supporter_transactions')
      .insert(insertData)
      .select()
      .single();

    if (transactionError) {
      logger.error('Direct transaction creation failed', 'DIRECT_PAYMENT', { 
        error: transactionError.message 
      });
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }

    logger.info('Direct transaction created', 'DIRECT_PAYMENT', { 
      transactionId: transaction.id, 
      amount: amountStr 
    });

    // Use unified payment success engine to process the payment
    // Since transaction is already marked as completed, the engine will handle
    // supporter creation, count updates, and Stream Chat sync
    const gatewayData = {
      transaction_uuid: transactionUuid,
      payment_method: 'direct',
      bypassed: true,
    };

    const result = await processPaymentSuccess({
      transactionId: transaction.id,
      gatewayData,
          tierLevel,
        });

    if (!result.success) {
      logger.error('Payment success processing failed', 'DIRECT_PAYMENT', {
        transactionId: transaction.id,
        error: result.error,
      });
      // Transaction is already created, so we return success but log the error
      // The supporter and Stream sync may have partially completed
    }

    logger.info('Direct payment completed successfully', 'DIRECT_PAYMENT', {
      transactionId: transaction.id,
      creatorId,
      supporterId,
      amount: validation.validatedAmount,
      streamSyncSuccess: result.streamSync?.success,
    });

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        transaction_uuid: transaction.transaction_uuid,
        created_at: transaction.created_at,
      },
      message: 'Support registered successfully'
    });
  } catch (error) {
    return handleApiError(error, 'DIRECT_PAYMENT', 'Direct payment failed');
  }
}
