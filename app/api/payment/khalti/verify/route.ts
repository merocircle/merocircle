import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { khaltiConfig } from '@/lib/khalti/config';
import { KhaltiLookupResponse } from '@/lib/khalti/types';
import { logger } from '@/lib/logger';
import { processPaymentSuccess } from '@/lib/payment-success-engine';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Extract parameters from Khalti callback
    const pidx = searchParams.get('pidx');
    const purchase_order_id = searchParams.get('purchase_order_id');
    const transaction_id = searchParams.get('transaction_id');
    const amount = searchParams.get('amount');
    const status = searchParams.get('status');

    logger.info('Khalti callback received', 'KHALTI_VERIFY', {
      pidx,
      purchase_order_id,
      transaction_id,
      amount,
      status,
    });

    if (!pidx) {
      logger.error('Missing pidx parameter', 'KHALTI_VERIFY');
      return NextResponse.redirect(
        new URL(`/payment/failure?error=missing_pidx`, request.url)
      );
    }

    const supabase = await createClient();

    // Find transaction by purchase_order_id
    const { data: transaction, error: transactionError } = await supabase
      .from('supporter_transactions')
      .select('*')
      .eq('transaction_uuid', purchase_order_id)
      .eq('payment_method', 'khalti')
      .single();

    if (transactionError || !transaction) {
      logger.error('Transaction not found', 'KHALTI_VERIFY', { 
        purchase_order_id, 
        error: transactionError?.message 
      });
      return NextResponse.redirect(
        new URL(`/payment/failure?error=transaction_not_found`, request.url)
      );
    }

    // Check if already processed
    if (transaction.status === 'completed') {
      logger.info('Transaction already completed', 'KHALTI_VERIFY', { pidx });
      return NextResponse.redirect(
        new URL(
          `/payment/success?pidx=${pidx}&amount=${amount}&gateway=khalti&creator_id=${transaction.creator_id}`,
          request.url
        )
      );
    }

    // Verify payment with Khalti API
    try {
      const lookupResponse = await fetch(khaltiConfig.verificationUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${khaltiConfig.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pidx }),
      });

      if (!lookupResponse.ok) {
        throw new Error(`Khalti lookup API returned ${lookupResponse.status}`);
      }

      const lookupData: KhaltiLookupResponse = await lookupResponse.json();

      logger.info('Khalti lookup response', 'KHALTI_VERIFY', {
        pidx,
        status: lookupData.status,
        transaction_id: lookupData.transaction_id,
      });

      // Check if payment is completed
      if (lookupData.status === 'Completed') {
        // Use unified payment success engine
        const gatewayData = {
              khalti_transaction_id: lookupData.transaction_id,
              verification_status: lookupData.status,
              fee: lookupData.fee,
        };

        const result = await processPaymentSuccess({
          transactionId: transaction.id,
          gatewayData,
        });

        if (!result.success) {
          logger.error('Payment success processing failed', 'KHALTI_VERIFY', {
            transactionId: transaction.id,
            error: result.error,
          });
          // Still redirect to success page as payment was verified by Khalti
          // The error will be logged for investigation
        } else {
          logger.info('Khalti payment verified and processed successfully', 'KHALTI_VERIFY', {
            pidx,
            transactionId: transaction.id,
            khaltiTransactionId: lookupData.transaction_id,
          });
        }

        // Redirect to success page
        return NextResponse.redirect(
          new URL(
            `/payment/success?pidx=${pidx}&amount=${amount}&gateway=khalti&creator_id=${transaction.creator_id}&transaction_id=${lookupData.transaction_id}`,
            request.url
          )
        );
      } else if (lookupData.status === 'Pending' || lookupData.status === 'Initiated') {
        // Payment still pending
        logger.warn('Khalti payment still pending', 'KHALTI_VERIFY', { 
          pidx, 
          status: lookupData.status 
        });
        
        return NextResponse.redirect(
          new URL(`/payment/pending?pidx=${pidx}&status=${lookupData.status}`, request.url)
        );
      } else {
        // Payment failed, expired, or cancelled
        await supabase
          .from('supporter_transactions')
          .update({
            status: lookupData.status === 'User canceled' ? 'cancelled' : 'failed',
            esewa_data: {
              ...(transaction.esewa_data as Record<string, unknown>),
              verification_status: lookupData.status,
              verified_at: new Date().toISOString(),
            },
          })
          .eq('id', transaction.id);

        logger.warn('Khalti payment not completed', 'KHALTI_VERIFY', { 
          pidx, 
          status: lookupData.status 
        });

        return NextResponse.redirect(
          new URL(
            `/payment/failure?pidx=${pidx}&status=${lookupData.status}&error=payment_not_completed`,
            request.url
          )
        );
      }

    } catch (verifyError) {
      logger.error('Khalti verification error', 'KHALTI_VERIFY', { 
        error: verifyError instanceof Error ? verifyError.message : 'Unknown',
        pidx,
      });

      // Mark as failed
      await supabase
        .from('supporter_transactions')
        .update({
          status: 'failed',
          esewa_data: {
            ...(transaction.esewa_data as Record<string, unknown>),
            error: verifyError instanceof Error ? verifyError.message : 'Unknown error',
          },
        })
        .eq('id', transaction.id);

      return NextResponse.redirect(
        new URL(`/payment/failure?pidx=${pidx}&error=verification_error`, request.url)
      );
    }

  } catch (error) {
    logger.error('Khalti callback processing failed', 'KHALTI_VERIFY', { 
      error: error instanceof Error ? error.message : 'Unknown' 
    });
    
    return NextResponse.redirect(
      new URL(`/payment/failure?error=callback_processing_failed`, request.url)
    );
  }
}
