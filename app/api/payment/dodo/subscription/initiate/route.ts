import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeString } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { validatePaymentRequest, verifyCreator, generateTransactionUuid } from '@/lib/payment-utils';
import { handleApiError } from '@/lib/api-utils';
import { dodoClient } from '@/lib/dodo/client';
import { dodoConfig } from '@/lib/dodo/config';
import { convertNprToUsdCents, convertNprToUsd, getExchangeRateInfo } from '@/lib/dodo/exchange-rate';

/**
 * Initiate Dodo Payments subscription
 * 
 * POST /api/payment/dodo/subscription/initiate
 * 
 * Creates a recurring subscription through Dodo Payments (Visa/Mastercard)
 * and redirects user to Dodo's hosted payment page.
 */
export async function POST(request: NextRequest) {
  try {
    // Validate Dodo configuration first
    if (!dodoConfig.apiKey || dodoConfig.apiKey.trim() === '') {
      logger.error('Dodo Payments not configured', 'DODO_SUBSCRIPTION', {
        hasApiKey: !!dodoConfig.apiKey,
        environment: dodoConfig.environment,
        apiUrl: dodoConfig.apiUrl,
      });
      return NextResponse.json(
        { 
          error: 'Dodo Payments is not configured. Please set DODO_PAYMENTS_API_KEY in your environment variables.',
          configIssue: true,
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { amount, creatorId, supporterId, supporterMessage, tier_level } = body;

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

    // Get supporter details
    const { data: supporter, error: supporterError } = await supabase
      .from('users')
      .select('email, display_name')
      .eq('id', supporterId)
      .single();

    if (supporterError || !supporter) {
      logger.error('Supporter not found', 'DODO_SUBSCRIPTION', { supporterId });
      return NextResponse.json({ error: 'Supporter not found' }, { status: 404 });
    }

    // Get tier information
    const tierLevel = tier_level || 1;
    const { data: tierInfo } = await supabase
      .from('subscription_tiers')
      .select('tier_name, price')
      .eq('creator_id', creatorId)
      .eq('tier_level', tierLevel)
      .single();

    const tierName = tierInfo?.tier_name || `Tier ${tierLevel}`;

    // Generate transaction UUID for tracking
    const transactionUuid = generateTransactionUuid('DODO');

    // Get tier_id from subscription_tiers
    const { data: tier } = await supabase
      .from('subscription_tiers')
      .select('id')
      .eq('creator_id', creatorId)
      .eq('tier_level', tierLevel)
      .single();

    if (!tier) {
      logger.error('Tier not found', 'DODO_SUBSCRIPTION', { creatorId, tierLevel });
      return NextResponse.json({ error: 'Tier not found' }, { status: 404 });
    }

    // Check if subscription already exists for this supporter-creator pair
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id, status, external_subscription_id, payment_gateway')
      .eq('supporter_id', supporterId)
      .eq('creator_id', creatorId)
      .maybeSingle();

    // If there's an active subscription, cancel it first (especially if it's a different gateway)
    if (existingSubscription && existingSubscription.status === 'active') {
      logger.info('Existing active subscription found, cancelling before updating', 'DODO_SUBSCRIPTION', {
        existingSubscriptionId: existingSubscription.id,
        existingStatus: existingSubscription.status,
        existingGateway: existingSubscription.payment_gateway,
        newGateway: 'dodo',
      });

      // If it's a Dodo subscription, cancel it via Dodo API
      if (existingSubscription.payment_gateway === 'dodo' && existingSubscription.external_subscription_id) {
        try {
          await dodoClient.cancelSubscription(existingSubscription.external_subscription_id);
          logger.info('Cancelled existing Dodo subscription', 'DODO_SUBSCRIPTION', {
            externalSubscriptionId: existingSubscription.external_subscription_id,
          });
        } catch (cancelError) {
          logger.warn('Failed to cancel existing Dodo subscription via API', 'DODO_SUBSCRIPTION', {
            error: cancelError instanceof Error ? cancelError.message : 'Unknown',
            externalSubscriptionId: existingSubscription.external_subscription_id,
          });
        }
      }
    }

    // Prepare subscription data
    // Fetch exchange rate early so we can store it in subscription metadata
    const subscriptionNprAmount = validation.validatedAmount;
    const subscriptionUsdAmount = await convertNprToUsd(subscriptionNprAmount);
    const subscriptionExchangeInfo = await getExchangeRateInfo();

    const currentDate = new Date();
    const periodEnd = new Date(currentDate);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const subscriptionData: any = {
      supporter_id: supporterId,
      creator_id: creatorId,
      tier_id: tier.id,
      tier_level: tierLevel,
      amount: validation.validatedAmount, // Store original NPR amount
      currency: 'USD', // Dodo uses USD, but we store NPR amount
      payment_gateway: 'dodo',
      status: 'pending',
      billing_cycle: 'monthly',
      current_period_start: currentDate.toISOString(),
      current_period_end: periodEnd.toISOString(),
      metadata: {
        transaction_uuid: transactionUuid,
        tier_level: tierLevel,
        tier_name: tierName,
        original_npr_amount: subscriptionNprAmount.toString(), // Store original NPR amount
        converted_usd_amount: subscriptionUsdAmount.toString(), // Store converted USD amount
        exchange_rate: subscriptionExchangeInfo.rate.toString(), // Store exchange rate used
        exchange_rate_source: subscriptionExchangeInfo.source, // Store source of exchange rate
        exchange_rate_cached: subscriptionExchangeInfo.cached.toString(), // Store if rate was cached
      },
      // Clear external IDs if updating (will be set after Dodo API call)
      external_subscription_id: null,
      external_customer_id: null,
      cancelled_at: null,
    };

    let subscription;
    let subscriptionError;

    if (existingSubscription) {
      // Update existing subscription
      logger.info('Updating existing subscription', 'DODO_SUBSCRIPTION', {
        subscriptionId: existingSubscription.id,
      });

      const { data: updatedSubscription, error: updateError } = await supabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('id', existingSubscription.id)
        .select()
        .single();

      subscription = updatedSubscription;
      subscriptionError = updateError;
    } else {
      // Create new subscription
      logger.info('Creating new subscription', 'DODO_SUBSCRIPTION', {
        supporterId,
        creatorId,
        tierLevel,
      });

      const { data: newSubscription, error: insertError } = await supabase
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      subscription = newSubscription;
      subscriptionError = insertError;
    }

    if (subscriptionError || !subscription) {
      logger.error('Failed to create/update subscription record', 'DODO_SUBSCRIPTION', {
        error: subscriptionError?.message || 'Unknown error',
        code: subscriptionError?.code,
        existingSubscription: !!existingSubscription,
      });
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }

    // Create transaction record for tracking
    const transactionData: any = {
      supporter_id: supporterId,
      creator_id: creatorId,
      amount: validation.validatedAmount.toString(),
      payment_method: 'dodo',
      status: 'pending',
      supporter_message: supporterMessage ? sanitizeString(supporterMessage) : null,
      transaction_uuid: transactionUuid,
      tier_level: tierLevel,
      metadata: {
        subscription_id: subscription.id,
        tier_level: tierLevel,
        billing_cycle: 'monthly',
      },
    };

    const { data: transaction, error: transactionError } = await supabase
      .from('supporter_transactions')
      .insert(transactionData)
      .select()
      .single();

    if (transactionError) {
      logger.error('Failed to create transaction record', 'DODO_SUBSCRIPTION', {
        error: transactionError.message,
      });
      // Clean up subscription record
      await supabase.from('subscriptions').delete().eq('id', subscription.id);
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }

    // Create or get Dodo product first (products must exist before subscriptions)
    const productId = `tier_${tierLevel}_${creatorId}`;
    let dodoProductId: string;

    try {
      // Try to get existing product first
      try {
        const existingProduct = await dodoClient.getProduct(productId);
        dodoProductId = existingProduct.product_id;
        logger.info('Using existing Dodo product', 'DODO_SUBSCRIPTION', {
          productId: dodoProductId,
        });
      } catch (getError: any) {
        // Product doesn't exist, create it
        const errorMessage = getError?.message || String(getError || '');
        const errorMessageLower = errorMessage.toLowerCase();
        const statusCode = getError?.status || getError?.statusCode;
        const isNotFound = 
          statusCode === 404 ||
          errorMessage.includes('404') || 
          errorMessageLower.includes('not found') ||
          errorMessageLower.includes('could not be found') ||
          errorMessageLower.includes('doesn\'t exist') ||
          errorMessageLower.includes('does not exist');
        
        logger.info('Product get error caught', 'DODO_SUBSCRIPTION', {
          productId,
          errorMessage,
          statusCode,
          isNotFound,
        });
        
        if (isNotFound) {
          logger.info('Product not found, creating new product', 'DODO_SUBSCRIPTION', {
            productId,
            errorMessage,
          });

          try {
            // Convert NPR to USD cents for Dodo Payments
            const nprAmount = validation.validatedAmount;
            const usdCents = await convertNprToUsdCents(nprAmount);
            const usdAmount = await convertNprToUsd(nprAmount);
            const exchangeInfo = await getExchangeRateInfo();

            logger.info('Converting NPR to USD for Dodo product', 'DODO_SUBSCRIPTION', {
              nprAmount,
              usdAmount,
              usdCents,
              exchangeRate: exchangeInfo.rate,
              exchangeRateSource: exchangeInfo.source,
              cached: exchangeInfo.cached,
            });

            const newProduct = await dodoClient.createProduct({
              name: `${creator.display_name || 'Creator'}'s Tier ${tierLevel} Subscription`,
              description: `Monthly subscription for Tier ${tierLevel} support`,
              price: {
                type: 'recurring_price',
                price: usdCents, // Amount in USD cents (integer)
                currency: 'USD',
                discount: 0, // No discount
                purchasing_power_parity: false, // PPP not available
                payment_frequency_count: 1, // Monthly payments
                payment_frequency_interval: 'Month',
                subscription_period_count: 1, // 1 month subscription period
                subscription_period_interval: 'Month',
                tax_inclusive: false, // Tax not included
                trial_period_days: 0, // No trial period
              },
              tax_category: 'saas', // Required by Dodo Payments - using SaaS for subscriptions
              metadata: {
                creator_id: creatorId,
                tier_level: tierLevel.toString(),
                original_npr_amount: nprAmount.toString(), // Store original NPR amount
                exchange_rate: exchangeInfo.rate.toString(),
              },
            });

            dodoProductId = newProduct.product_id;
            logger.info('Created new Dodo product', 'DODO_SUBSCRIPTION', {
              productId: dodoProductId,
            });
          } catch (createError) {
            logger.error('Failed to create Dodo product', 'DODO_SUBSCRIPTION', {
              error: createError instanceof Error ? createError.message : 'Unknown',
              productId,
            });
            throw createError;
          }
        } else {
          // Some other error occurred, re-throw it
          logger.error('Unexpected error getting Dodo product', 'DODO_SUBSCRIPTION', {
            error: errorMessage,
            productId,
          });
          throw getError;
        }
      }
    } catch (productError) {
      logger.error('Failed to create or get Dodo product', 'DODO_SUBSCRIPTION', {
        error: productError instanceof Error ? productError.message : 'Unknown',
        productId,
        errorType: productError instanceof Error ? productError.constructor.name : typeof productError,
      });
      return NextResponse.json(
        { error: 'Failed to set up product for subscription' },
        { status: 500 }
      );
    }

    // Create Dodo checkout session with the product (replaces deprecated subscription endpoint)
    try {
      const checkoutSession = await dodoClient.createCheckoutSession({
        product_cart: [
          {
            product_id: dodoProductId, // Use the actual Dodo product ID
            quantity: 1, // Always 1 for tier subscriptions
          },
        ],
        customer: {
          email: supporter.email,
          name: supporter.display_name || 'Supporter',
        },
        return_url: `${dodoConfig.returnUrl}/payment/success?subscription_id=${subscription.id}&transaction_id=${transaction.id}&gateway=dodo`,
        metadata: {
          subscription_id: subscription.id,
          transaction_id: transaction.id,
          creator_id: creatorId,
          supporter_id: supporterId,
          tier_level: tierLevel.toString(), // Dodo Payments requires all metadata values to be strings
        },
        subscription_data: {
          // Optional: can add trial_period_days or on_demand here if needed
        },
      });

      // Update subscription with Dodo checkout session ID
      await supabase
        .from('subscriptions')
        .update({
          metadata: {
            ...subscription.metadata,
            dodo_checkout_session_id: checkoutSession.session_id,
          },
        })
        .eq('id', subscription.id);

      // Also update transaction with checkout session ID and exchange rate info
      // Reuse the conversion values from earlier in the function
      const transactionNprAmount = validation.validatedAmount;
      const transactionUsdAmount = await convertNprToUsd(transactionNprAmount);
      const transactionExchangeInfo = await getExchangeRateInfo();

      await supabase
        .from('supporter_transactions')
        .update({
          metadata: {
            ...transaction.metadata,
            dodo_checkout_session_id: checkoutSession.session_id,
            original_npr_amount: transactionNprAmount.toString(), // Store original NPR amount
            converted_usd_amount: transactionUsdAmount.toString(), // Store converted USD amount
            exchange_rate: transactionExchangeInfo.rate.toString(), // Store exchange rate used
            exchange_rate_source: transactionExchangeInfo.source, // Store source of exchange rate
            exchange_rate_cached: transactionExchangeInfo.cached.toString(), // Store if rate was cached
          },
        })
        .eq('id', transaction.id);

      // Log conversion details
      logger.info('Dodo checkout session created', 'DODO_SUBSCRIPTION', {
        subscriptionId: subscription.id,
        checkoutSessionId: checkoutSession.session_id,
        tierLevel,
        nprAmount: transactionNprAmount, // Original amount in NPR
        usdAmount: transactionUsdAmount, // Converted amount in USD
        exchangeRate: transactionExchangeInfo.rate,
        exchangeRateSource: transactionExchangeInfo.source,
        cached: transactionExchangeInfo.cached,
      });

      if (!checkoutSession.checkout_url) {
        logger.error('Checkout URL is null', 'DODO_SUBSCRIPTION', {
          sessionId: checkoutSession.session_id,
        });
        return NextResponse.json(
          { error: 'Failed to get checkout URL' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        payment_url: checkoutSession.checkout_url,
        session_id: checkoutSession.session_id,
        subscription_id: subscription.id,
      });
    } catch (dodoError) {
      const errorMessage = dodoError instanceof Error ? dodoError.message : 'Unknown error';
      const isConfigError = errorMessage.includes('API key') || errorMessage.includes('not set');
      
      logger.error('Dodo API error', 'DODO_SUBSCRIPTION', {
        error: errorMessage,
        errorType: dodoError instanceof Error ? dodoError.constructor.name : typeof dodoError,
        isConfigError,
        apiUrl: dodoConfig.apiUrl,
        hasApiKey: !!dodoConfig.apiKey,
        apiKeyLength: dodoConfig.apiKey?.length || 0,
      });

      // Mark subscription and transaction as failed
      await supabase
        .from('subscriptions')
        .update({ status: 'failed' })
        .eq('id', subscription.id);

      await supabase
        .from('supporter_transactions')
        .update({ status: 'failed' })
        .eq('id', transaction.id);

      // Return more helpful error message
      if (isConfigError) {
        return NextResponse.json(
          { 
            error: 'Dodo Payments configuration error. Please check your DODO_PAYMENTS_API_KEY environment variable.',
            configIssue: true,
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Failed to initiate Dodo subscription',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return handleApiError(error, 'DODO_SUBSCRIPTION', 'Subscription initiation failed');
  }
}
