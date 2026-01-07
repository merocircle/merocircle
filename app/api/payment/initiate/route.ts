import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateEsewaSignature } from '@/lib/generateEsewaSignature';
import { PaymentRequestData, EsewaConfig } from '@/lib/esewa-types';
import { config } from '@/lib/config';
import { validateAmount, validateUUID, sanitizeString } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const paymentData: PaymentRequestData = await request.json();
    const { amount, creatorId, supporterId, supporterMessage } = paymentData;

    if (!rateLimit(`payment:${supporterId}`, 5, 300000)) {
      return NextResponse.json({ error: 'Too many payment requests. Please wait.' }, { status: 429 });
    }

    const amountValidation = validateAmount(amount);
    if (!amountValidation.valid) {
      return NextResponse.json({ error: amountValidation.error }, { status: 400 });
    }

    if (!validateUUID(creatorId) || !validateUUID(supporterId)) {
      return NextResponse.json({ error: 'Invalid user IDs' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: creator } = await supabase
      .from('users')
      .select('id, display_name')
      .eq('id', creatorId)
      .single();

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    const transactionUuid = `${Date.now()}-${crypto.randomUUID()}`;
    const amountStr = amountValidation.value!.toString();

    const esewaConfig: Omit<EsewaConfig, 'signature'> = {
      amount: amountStr,
      tax_amount: "0",
      total_amount: amountStr,
      transaction_uuid: transactionUuid,
      product_code: config.esewa.merchantCode,
      product_service_charge: "0",
      product_delivery_charge: "0",
      success_url: `${config.app.baseUrl}/payment/success?transaction_uuid=${transactionUuid}&total_amount=${amountStr}&product_code=${config.esewa.merchantCode}`,
      failure_url: `${config.app.baseUrl}/payment/failure`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
    };

    const signatureString = `total_amount=${esewaConfig.total_amount},transaction_uuid=${esewaConfig.transaction_uuid},product_code=${esewaConfig.product_code}`;
    const signature = generateEsewaSignature(config.esewa.secretKey, signatureString);

    // Store transaction in database
    const { data: transaction, error: transactionError } = await supabase
      .from('supporter_transactions')
      .insert({
        supporter_id: supporterId,
        creator_id: creatorId,
        amount: amountStr,
        payment_method: 'esewa',
        status: 'pending',
        supporter_message: supporterMessage ? sanitizeString(supporterMessage) : null,
        transaction_uuid: transactionUuid,
        esewa_product_code: config.esewa.merchantCode,
        esewa_signature: signature,
        esewa_data: {
          transaction_uuid: transactionUuid,
          product_code: config.esewa.merchantCode,
          signature,
          test_mode: config.esewa.testMode,
        }
      })
      .select()
      .single();

    if (transactionError) {
      logger.error('Transaction creation failed', 'PAYMENT_API', { error: transactionError.message });
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }

    logger.info('Transaction created', 'PAYMENT_API', { transactionId: transaction.id, amount: amountStr });

    if (config.esewa.testMode) {
      
      // Auto-complete the transaction
      await supabase
        .from('supporter_transactions')
        .update({
          status: 'completed',
          esewa_data: {
            transaction_uuid: transactionUuid,
            product_code: config.esewa.merchantCode,
            status: 'COMPLETE',
            ref_id: `TEST-${Date.now()}`,
            test_mode: true,
          },
        })
        .eq('id', transaction.id);

      return NextResponse.json({
        success: true,
        test_mode: true,
        redirect_url: `${config.app.baseUrl}/payment/success?transaction_uuid=${transactionUuid}&total_amount=${amountStr}&product_code=${config.esewa.merchantCode}&test=true`,
        transaction_id: transaction.id,
        message: 'TEST MODE: Payment auto-completed'
      });
    }

    const completeEsewaConfig: EsewaConfig = {
      ...esewaConfig,
      signature,
    };

    return NextResponse.json({
      success: true,
      esewaConfig: completeEsewaConfig,
      payment_url: config.esewa.paymentUrl,
      transaction_id: transaction.id,
      message: 'Payment initiated'
    });
  } catch (error) {
    logger.error('Payment initiation failed', 'PAYMENT_API', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ error: 'Payment initiation failed' }, { status: 500 });
  }
}
import { generateEsewaSignature } from '@/lib/generateEsewaSignature';
import { PaymentRequestData, EsewaConfig } from '@/lib/esewa-types';
import { config } from '@/lib/config';
import { validateAmount, validateUUID, sanitizeString } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const paymentData: PaymentRequestData = await request.json();
    const { amount, creatorId, supporterId, supporterMessage } = paymentData;

    if (!rateLimit(`payment:${supporterId}`, 5, 300000)) {
      return NextResponse.json({ error: 'Too many payment requests. Please wait.' }, { status: 429 });
    }

    const amountValidation = validateAmount(amount);
    if (!amountValidation.valid) {
      return NextResponse.json({ error: amountValidation.error }, { status: 400 });
    }

    if (!validateUUID(creatorId) || !validateUUID(supporterId)) {
      return NextResponse.json({ error: 'Invalid user IDs' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: creator } = await supabase
      .from('users')
      .select('id, display_name')
      .eq('id', creatorId)
      .single();

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    const transactionUuid = `${Date.now()}-${crypto.randomUUID()}`;
    const amountStr = amountValidation.value!.toString();

    const esewaConfig: Omit<EsewaConfig, 'signature'> = {
      amount: amountStr,
      tax_amount: "0",
      total_amount: amountStr,
      transaction_uuid: transactionUuid,
      product_code: config.esewa.merchantCode,
      product_service_charge: "0",
      product_delivery_charge: "0",
      success_url: `${config.app.baseUrl}/payment/success?transaction_uuid=${transactionUuid}&total_amount=${amountStr}&product_code=${config.esewa.merchantCode}`,
      failure_url: `${config.app.baseUrl}/payment/failure`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
    };

    const signatureString = `total_amount=${esewaConfig.total_amount},transaction_uuid=${esewaConfig.transaction_uuid},product_code=${esewaConfig.product_code}`;
    const signature = generateEsewaSignature(config.esewa.secretKey, signatureString);

    // Store transaction in database
    const { data: transaction, error: transactionError } = await supabase
      .from('supporter_transactions')
      .insert({
        supporter_id: supporterId,
        creator_id: creatorId,
        amount: amountStr,
        payment_method: 'esewa',
        status: 'pending',
        supporter_message: supporterMessage ? sanitizeString(supporterMessage) : null,
        transaction_uuid: transactionUuid,
        esewa_product_code: config.esewa.merchantCode,
        esewa_signature: signature,
        esewa_data: {
          transaction_uuid: transactionUuid,
          product_code: config.esewa.merchantCode,
          signature,
          test_mode: config.esewa.testMode,
        }
      })
      .select()
      .single();

    if (transactionError) {
      logger.error('Transaction creation failed', 'PAYMENT_API', { error: transactionError.message });
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }

    logger.info('Transaction created', 'PAYMENT_API', { transactionId: transaction.id, amount: amountStr });

    if (config.esewa.testMode) {
      
      // Auto-complete the transaction
      await supabase
        .from('supporter_transactions')
        .update({
          status: 'completed',
          esewa_data: {
            transaction_uuid: transactionUuid,
            product_code: config.esewa.merchantCode,
            status: 'COMPLETE',
            ref_id: `TEST-${Date.now()}`,
            test_mode: true,
          },
        })
        .eq('id', transaction.id);

      return NextResponse.json({
        success: true,
        test_mode: true,
        redirect_url: `${config.app.baseUrl}/payment/success?transaction_uuid=${transactionUuid}&total_amount=${amountStr}&product_code=${config.esewa.merchantCode}&test=true`,
        transaction_id: transaction.id,
        message: 'TEST MODE: Payment auto-completed'
      });
    }

    const completeEsewaConfig: EsewaConfig = {
      ...esewaConfig,
      signature,
    };

    return NextResponse.json({
      success: true,
      esewaConfig: completeEsewaConfig,
      payment_url: config.esewa.paymentUrl,
      transaction_id: transaction.id,
      message: 'Payment initiated'
    });
  } catch (error) {
    logger.error('Payment initiation failed', 'PAYMENT_API', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json({ error: 'Payment initiation failed' }, { status: 500 });
  }
}