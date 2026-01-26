import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { khaltiConfig } from '@/lib/khalti/config';
import { KhaltiLookupResponse } from '@/lib/khalti/types';
import { logger } from '@/lib/logger';

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
        // Update transaction as completed
        const { error: updateError } = await supabase
          .from('supporter_transactions')
          .update({
            status: 'completed',
            esewa_data: {
              ...(transaction.esewa_data as Record<string, unknown>),
              khalti_transaction_id: lookupData.transaction_id,
              verification_status: lookupData.status,
              fee: lookupData.fee,
              verified_at: new Date().toISOString(),
            },
          })
          .eq('id', transaction.id);

        if (updateError) {
          logger.error('Failed to update transaction', 'KHALTI_VERIFY', {
            error: updateError.message
          });
        } else {
          logger.info('Khalti payment verified successfully', 'KHALTI_VERIFY', {
            pidx,
            transactionId: transaction.id,
            khaltiTransactionId: lookupData.transaction_id,
          });

          // Create/update supporter record
          const tierLevel = (transaction.esewa_data as any)?.tier_level || 1;
          const transactionAmount = Number(transaction.amount);

          const { data: existingSupporter } = await supabase
            .from('supporters')
            .select('id')
            .eq('supporter_id', transaction.supporter_id)
            .eq('creator_id', transaction.creator_id)
            .single();

          if (!existingSupporter) {
            await supabase
              .from('supporters')
              .insert({
                supporter_id: transaction.supporter_id,
                creator_id: transaction.creator_id,
                tier: 'basic',
                tier_level: tierLevel,
                amount: transactionAmount,
                is_active: true,
              });
          } else {
            await supabase
              .from('supporters')
              .update({
                is_active: true,
                tier_level: tierLevel,
                amount: transactionAmount,
              })
              .eq('id', existingSupporter.id);
          }

          // Update supporters_count in creator_profiles (count active supporters)
          const { data: countResult } = await supabase
            .from('supporters')
            .select('supporter_id')
            .eq('creator_id', transaction.creator_id)
            .eq('is_active', true);

          if (countResult) {
            const uniqueSupporters = new Set(countResult.map(r => r.supporter_id)).size;
            await supabase
              .from('creator_profiles')
              .update({ supporters_count: uniqueSupporters })
              .eq('user_id', transaction.creator_id);

            logger.info('Updated supporter count', 'KHALTI_VERIFY', {
              creatorId: transaction.creator_id,
              supportersCount: uniqueSupporters
            });
          }

          // Sync supporter to Stream Chat channels
          try {
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
            logger.info('Supporter synced to Stream channels', 'KHALTI_VERIFY', {
              supporterId: transaction.supporter_id,
              creatorId: transaction.creator_id,
              tierLevel,
            });
          } catch (streamError) {
            logger.warn('Failed to sync supporter to Stream', 'KHALTI_VERIFY', {
              error: streamError instanceof Error ? streamError.message : 'Unknown',
            });
          }
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
