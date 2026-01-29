import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { khaltiConfig } from '@/lib/khalti/config';
import { KhaltiInitiatePayload } from '@/lib/khalti/types';
import { sanitizeString } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { validatePaymentRequest, verifyCreator, generateTransactionUuid } from '@/lib/payment-utils';
import { handleApiError } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const paymentData = await request.json();
    const { amount, creatorId, supporterId, supporterMessage, tier_level } = paymentData;

    // Rate limiting
    if (!rateLimit(`payment:khalti:${supporterId}`, 5, 300000)) {
      return NextResponse.json({ error: 'Too many payment requests. Please wait.' }, { status: 429 });
    }

    // Validate payment request
    const validation = validatePaymentRequest(amount, creatorId, supporterId);
    if (!validation.valid || !validation.validatedAmount) {
      return validation.errorResponse!;
    }

    // Validate Khalti configuration
    if (!khaltiConfig.secretKey || 
        khaltiConfig.secretKey.includes('your_') || 
        khaltiConfig.secretKey === 'test_secret_key_your_key_here') {
      logger.error('Khalti not configured', 'KHALTI_API', {
        hasSecretKey: !!khaltiConfig.secretKey,
        message: 'Register at https://test-admin.khalti.com to get test keys',
      });
      return NextResponse.json({ 
        error: 'Khalti payment gateway is not configured. Register at https://test-admin.khalti.com to get test keys, then add to .env.local',
        registrationUrl: 'https://test-admin.khalti.com/join/',
      }, { status: 503 });
    }

    // Verify creator exists
    const { exists, creator, errorResponse } = await verifyCreator(creatorId);
    if (!exists || !creator) {
      return errorResponse!;
    }

    const supabase = await createClient();

    // Generate unique purchase order ID
    const timestamp = Date.now();
    const purchaseOrderId = `BWS_${creatorId.substring(0, 8)}_${timestamp}`;
    
    // Khalti expects amount in paisa (smallest unit)
    // Convert NPR to paisa: 1 NPR = 100 paisa
    const amountInPaisa = Math.round(validation.validatedAmount * 100);
    
    // Validate minimum amount (Khalti minimum is typically 10 NPR = 1000 paisa)
    if (amountInPaisa < 1000) {
      return NextResponse.json({ error: 'Minimum amount is NPR 10 for Khalti' }, { status: 400 });
    }

    const purchaseOrderName = sanitizeString(
      supporterMessage || `Support for ${creator.display_name} - Tier ${tier_level || 1}`
    );

    // Build Khalti payment payload
    const khaltiPayload: KhaltiInitiatePayload = {
      return_url: khaltiConfig.returnUrl,
      website_url: khaltiConfig.websiteUrl,
      amount: amountInPaisa,
      purchase_order_id: purchaseOrderId,
      purchase_order_name: purchaseOrderName,
      customer_info: {
        name: 'Supporter', // Can be updated with actual user info if available
      },
      amount_breakdown: [
        {
          label: `Tier ${tier_level || 1} Support`,
          amount: amountInPaisa,
        }
      ],
      product_details: [
        {
          identity: purchaseOrderId,
          name: purchaseOrderName,
          total_price: amountInPaisa,
          quantity: 1,
          unit_price: amountInPaisa,
        }
      ],
    };

    logger.info('Initiating Khalti payment', 'KHALTI_API', {
      purchaseOrderId,
      amount: amountInPaisa,
      amountInNPR: validation.validatedAmount,
      creatorId,
    });

    // Call Khalti API to initiate payment
    const khaltiResponse = await fetch(khaltiConfig.paymentUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${khaltiConfig.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(khaltiPayload),
    });

    if (!khaltiResponse.ok) {
      const errorData = await khaltiResponse.json().catch(() => ({}));
      logger.error('Khalti API error', 'KHALTI_API', { 
        status: khaltiResponse.status,
        error: errorData,
      });
      return NextResponse.json({ 
        error: 'Failed to initiate Khalti payment. Please try again.' 
      }, { status: 500 });
    }

    const khaltiData = await khaltiResponse.json();

    if (!khaltiData.pidx || !khaltiData.payment_url) {
      logger.error('Invalid Khalti response', 'KHALTI_API', { khaltiData });
      return NextResponse.json({ 
        error: 'Invalid response from Khalti. Please try again.' 
      }, { status: 500 });
    }

    // Store transaction in database
    const insertData = {
      supporter_id: supporterId,
      creator_id: creatorId,
      amount: String(validation.validatedAmount), // Store in NPR
      payment_method: 'khalti',
      status: 'pending',
      supporter_message: supporterMessage ? sanitizeString(supporterMessage) : null,
      transaction_uuid: purchaseOrderId,
      esewa_product_code: null,
      esewa_signature: null,
      esewa_data: {
        gateway: 'khalti',
        pidx: khaltiData.pidx,
        purchase_order_id: purchaseOrderId,
        amount_paisa: amountInPaisa,
        amount_npr: validation.validatedAmount,
        tier_level: tier_level || 1,
        expires_at: khaltiData.expires_at,
        expires_in: khaltiData.expires_in,
      },
    };

    const { data: transaction, error: transactionError } = await supabase
      .from('supporter_transactions')
      .insert(insertData)
      .select()
      .single();

    if (transactionError) {
      logger.error('Khalti transaction creation failed', 'KHALTI_API', { 
        error: transactionError.message 
      });
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }

    logger.info('Khalti payment initiated successfully', 'KHALTI_API', {
      transactionId: transaction.id,
      pidx: khaltiData.pidx,
      purchaseOrderId,
    });

    return NextResponse.json({
      success: true,
      gateway: 'khalti',
      pidx: khaltiData.pidx,
      payment_url: khaltiData.payment_url,
      transaction_id: transaction.id,
      purchase_order_id: purchaseOrderId,
      amount: validation.validatedAmount,
      expires_at: khaltiData.expires_at,
      expires_in: khaltiData.expires_in,
      message: 'Khalti payment initiated successfully',
    });

  } catch (error) {
    return handleApiError(error, 'KHALTI_API', 'Payment initiation failed. Please try again.');
  }
}
