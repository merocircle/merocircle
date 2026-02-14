import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateEsewaSignature } from '@/lib/generateEsewaSignature';
import { PaymentRequestData, EsewaConfig } from '@/lib/esewa-types';
import { config } from '@/lib/config';
import { sanitizeString } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { validatePaymentRequest, verifyCreator, generateTransactionUuid } from '@/lib/payment-utils';
import { handleApiError } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const paymentData: PaymentRequestData = await request.json();
    const { amount, creatorId, supporterId, supporterMessage, tier_level } = paymentData;

    // Rate limiting
    if (!rateLimit(`payment:${supporterId}`, 5, 300000)) {
      return NextResponse.json({ error: 'Too many payment requests. Please wait.' }, { status: 429 });
    }

    // Validate payment request
    const validation = validatePaymentRequest(amount, creatorId, supporterId);
    if (!validation.valid || !validation.validatedAmount) {
      return validation.errorResponse!;
    }

    // Verify creator exists
    const { exists, creator, errorResponse } = await verifyCreator(creatorId);
    if (!exists || !creator) {
      return errorResponse!;
    }

    const supabase = await createClient();

    // Generate transaction UUID
    const transactionUuid = generateTransactionUuid();
    const amountStr = validation.validatedAmount.toString();

    // Build success_url for eSewa redirect. Must be a public HTTPS URL so eSewa can redirect the user.
    // Set NEXT_PUBLIC_APP_URL to your production URL (e.g. https://yourdomain.com); avoid localhost.
    const successUrl = `${config.app.baseUrl}/payment/success?transaction_uuid=${transactionUuid}&total_amount=${amountStr}&product_code=${config.esewa.merchantCode}&creator_id=${creatorId}`;
    if (config.app.baseUrl.startsWith('http://localhost')) {
      logger.warn('eSewa success_url uses localhost – user may get stuck on eSewa success page. Set NEXT_PUBLIC_APP_URL to a public URL for payment redirects.', 'PAYMENT_API', { successUrl });
    }

    // Build eSewa config (without signature)
    const esewaConfig: Omit<EsewaConfig, 'signature'> = {
      amount: amountStr,
      tax_amount: "0",
      total_amount: amountStr,
      transaction_uuid: transactionUuid,
      product_code: config.esewa.merchantCode,
      product_service_charge: "0",
      product_delivery_charge: "0",
      success_url: successUrl,
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
      // Store tier_level as direct column (business logic, not gateway-specific)
      tier_level: tier_level || 1,
      esewa_data: {
        transaction_uuid: transactionUuid,
        product_code: config.esewa.merchantCode,
        signature,
        test_mode: config.esewa.testMode,
        // Note: tier_level is NOT stored here - it's business logic, not payment gateway data
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
    return handleApiError(error, 'PAYMENT_API', 'Payment initiation failed');
  }
}
