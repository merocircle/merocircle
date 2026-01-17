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
    const { amount, creatorId, supporterId, supporterMessage, tier_level } = paymentData;

    // Rate limiting
    if (!rateLimit(`payment:${supporterId}`, 5, 300000)) {
      return NextResponse.json({ error: 'Too many payment requests. Please wait.' }, { status: 429 });
    }

    // Validate amount
    const amountValidation = validateAmount(amount);
    if (!amountValidation.valid) {
      return NextResponse.json({ error: amountValidation.error }, { status: 400 });
    }

    // Validate UUIDs
    if (!validateUUID(creatorId) || !validateUUID(supporterId)) {
      return NextResponse.json({ error: 'Invalid user IDs' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify creator exists
    const { data: creator } = await supabase
      .from('users')
      .select('id, display_name')
      .eq('id', creatorId)
      .single();

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Generate transaction UUID
    const transactionUuid = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const amountStr = amountValidation.value!.toString();

    // Build eSewa config (without signature)
    const esewaConfig: Omit<EsewaConfig, 'signature'> = {
      amount: amountStr,
      tax_amount: "0",
      total_amount: amountStr,
      transaction_uuid: transactionUuid,
      product_code: config.esewa.merchantCode,
      product_service_charge: "0",
      product_delivery_charge: "0",
      success_url: `${config.app.baseUrl}/payment/success?transaction_uuid=${transactionUuid}&total_amount=${amountStr}&product_code=${config.esewa.merchantCode}&creator_id=${creatorId}`,
      failure_url: `${config.app.baseUrl}/payment/failure`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
    };

    // Generate signature
    const signatureString = `total_amount=${esewaConfig.total_amount},transaction_uuid=${esewaConfig.transaction_uuid},product_code=${esewaConfig.product_code}`;
    const signature = generateEsewaSignature(config.esewa.secretKey, signatureString);

    // Store transaction in database
    const insertData: any = {
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
        tier_level: tier_level || 1
      }
    };

    const { data: transaction, error: transactionError } = await supabase
      .from('supporter_transactions')
      .insert(insertData)
      .select()
      .single();

    if (transactionError) {
      logger.error('Transaction creation failed', 'PAYMENT_API', { error: transactionError.message });
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }

    logger.info('Transaction created', 'PAYMENT_API', { transactionId: transaction.id, amount: amountStr });

    // Complete eSewa config with signature
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
