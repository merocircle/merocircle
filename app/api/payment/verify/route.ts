import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateEsewaSignature } from '@/lib/generateEsewaSignature';
import { config } from '@/lib/config';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transaction_uuid = searchParams.get('transaction_uuid');
    const total_amount = searchParams.get('total_amount');
    const product_code = searchParams.get('product_code') || config.esewa.merchantCode;

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

    const updateData: any = {
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
    logger.error('Payment verification failed', 'PAYMENT_VERIFY', {
      error: error instanceof Error ? error.message : 'Unknown'
    });
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}

