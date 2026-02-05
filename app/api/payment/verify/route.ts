import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { config } from '@/lib/config';
import { logger } from '@/lib/logger';
import { processPaymentSuccess } from '@/lib/payment-success-engine';
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

    // Use unified payment success engine
    const gatewayData: Record<string, unknown> = {
      status: 'COMPLETE',
    };

    if (config.esewa.testMode) {
      gatewayData.ref_id = `TEST-${Date.now()}`;
    }

    const result = await processPaymentSuccess({
      transactionId: transaction.id,
      gatewayData,
    });

    if (!result.success) {
      logger.error('Payment success processing failed', 'PAYMENT_VERIFY', {
        transactionId: transaction.id,
        error: result.error,
      });
      return NextResponse.json(
        { error: result.error || 'Failed to process payment success' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      status: 'completed',
      transaction: result.transaction,
      test_mode: config.esewa.testMode
    });
  } catch (error) {
    return handleApiError(error, 'PAYMENT_VERIFY', 'Payment verification failed');
  }
}

