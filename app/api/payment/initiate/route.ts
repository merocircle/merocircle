import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateEsewaSignature } from '@/lib/generateEsewaSignature';
import { PaymentRequestData, EsewaConfig } from '@/lib/esewa-types';

// eSewa Test Configuration
const ESEWA_MERCHANT_CODE = process.env.NEXT_PUBLIC_ESEWA_MERCHANT_CODE || 'EPAYTEST';
const ESEWA_SECRET_KEY = process.env.NEXT_PUBLIC_ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
const ESEWA_PAYMENT_URL = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';

// TEST MODE: Set to true to bypass eSewa and test locally
const USE_TEST_MODE = process.env.ESEWA_TEST_MODE === 'true';

export async function POST(request: NextRequest) {
  try {
    const paymentData: PaymentRequestData = await request.json();
    const { amount, creatorId, supporterId, supporterMessage } = paymentData;

    console.log('[PAYMENT] Request received:', { amount, creatorId, supporterId, testMode: USE_TEST_MODE });

    // Validation
    if (!amount || !creatorId || !supporterId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify creator exists
    const { data: creator, error: creatorError } = await supabase
      .from('users')
      .select('id, display_name')
      .eq('id', creatorId)
      .single();

    if (creatorError || !creator) {
      console.error('[PAYMENT] Creator not found:', creatorError);
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    // Generate unique transaction UUID
    const transactionUuid = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    // Format amount as string
    const amountStr = Math.round(amount).toString();

    // eSewa configuration
    const esewaConfig: Omit<EsewaConfig, 'signature'> = {
      amount: amountStr,
      tax_amount: "0",
      total_amount: amountStr,
      transaction_uuid: transactionUuid,
      product_code: ESEWA_MERCHANT_CODE,
      product_service_charge: "0",
      product_delivery_charge: "0",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/success?transaction_uuid=${transactionUuid}&total_amount=${amountStr}&product_code=${ESEWA_MERCHANT_CODE}`,
      failure_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/failure`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
    };

    // Generate signature
    const signatureString = `total_amount=${esewaConfig.total_amount},transaction_uuid=${esewaConfig.transaction_uuid},product_code=${esewaConfig.product_code}`;
    const signature = generateEsewaSignature(ESEWA_SECRET_KEY, signatureString);

    console.log('[PAYMENT] Signature generated for:', signatureString);

    // Store transaction in database
    const { data: transaction, error: transactionError } = await supabase
      .from('supporter_transactions')
      .insert({
        supporter_id: supporterId,
        creator_id: creatorId,
        amount: amountStr,
        payment_method: 'esewa',
        status: 'pending',
        supporter_message: supporterMessage || null,
        transaction_uuid: transactionUuid,
        esewa_product_code: ESEWA_MERCHANT_CODE,
        esewa_signature: signature,
        esewa_data: {
          transaction_uuid: transactionUuid,
          product_code: ESEWA_MERCHANT_CODE,
          signature,
          test_mode: USE_TEST_MODE,
        }
      })
      .select()
      .single();

    if (transactionError) {
      console.error('[PAYMENT] Database error:', transactionError);
      return NextResponse.json(
        { error: 'Failed to create transaction' },
        { status: 500 }
      );
    }

    console.log('[PAYMENT] Transaction created:', transaction.id);

    // TEST MODE: Skip eSewa and go directly to success
    if (USE_TEST_MODE) {
      console.log('[PAYMENT] TEST MODE: Simulating eSewa success');
      
      // Auto-complete the transaction
      await supabase
        .from('supporter_transactions')
        .update({
          status: 'completed',
          esewa_data: {
            transaction_uuid: transactionUuid,
            product_code: ESEWA_MERCHANT_CODE,
            status: 'COMPLETE',
            ref_id: `TEST-${Date.now()}`,
            test_mode: true,
          },
        })
        .eq('id', transaction.id);

      return NextResponse.json({
        success: true,
        test_mode: true,
        redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/success?transaction_uuid=${transactionUuid}&total_amount=${amountStr}&product_code=${ESEWA_MERCHANT_CODE}&test=true`,
        transaction_id: transaction.id,
        message: 'TEST MODE: Payment auto-completed'
      });
    }

    // PRODUCTION MODE: Return eSewa config
    const completeEsewaConfig: EsewaConfig = {
      ...esewaConfig,
      signature,
    };

    return NextResponse.json({
      success: true,
      esewaConfig: completeEsewaConfig,
      payment_url: ESEWA_PAYMENT_URL,
      transaction_id: transaction.id,
      message: 'Payment initiated - redirecting to eSewa'
    });

  } catch (error) {
    console.error('[PAYMENT] Error:', error);
    return NextResponse.json(
      { error: 'Payment initiation failed' },
      { status: 500 }
    );
  }
}
