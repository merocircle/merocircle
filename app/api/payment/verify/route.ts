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

    // Find transaction in database
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

    // Verify amount matches
    if (transaction.amount !== total_amount) {
      logger.warn('Amount mismatch', 'PAYMENT_VERIFY', {
        transaction_uuid,
        expected: transaction.amount,
        received: total_amount
      });
      return NextResponse.json(
        { error: 'Amount mismatch' },
        { status: 400 }
      );
    }

    // If already completed, return success
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

    // In test mode, auto-verify
    if (config.esewa.testMode) {
      await supabase
        .from('supporter_transactions')
        .update({
          status: 'completed',
          esewa_data: {
            ...transaction.esewa_data,
            status: 'COMPLETE',
            ref_id: `TEST-${Date.now()}`,
            verified_at: new Date().toISOString(),
          }
        })
        .eq('id', transaction.id);

      return NextResponse.json({
        success: true,
        status: 'completed',
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          transaction_uuid: transaction.transaction_uuid,
          created_at: transaction.created_at,
        },
        test_mode: true
      });
    }

    // Production mode: Verify with eSewa API
    // Note: eSewa verification requires server-to-server call
    // For now, we'll mark as completed if transaction exists and amount matches
    // In production, you should call eSewa verification API here
    
    await supabase
      .from('supporter_transactions')
      .update({
        status: 'completed',
        esewa_data: {
          ...transaction.esewa_data,
          status: 'COMPLETE',
          verified_at: new Date().toISOString(),
        }
      })
      .eq('id', transaction.id);

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

