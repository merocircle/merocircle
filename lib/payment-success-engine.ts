import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { updateSupporterCount } from '@/lib/payment-utils';
import { manageSubscription } from '@/lib/subscription-engine';
import { createPaymentNotification, createSupportNotification } from '@/lib/notification-engine';
import { logSupportGiven } from '@/lib/activity-logging-engine';

/**
 * Extract tier level from transaction data in a gateway-agnostic way
 * Priority: override > direct column > metadata > legacy fields > default
 */
function extractTierLevel(
  transaction: any,
  overrideTierLevel?: number
): number {
  // Priority 1: Override (if explicitly provided)
  if (overrideTierLevel !== undefined && overrideTierLevel >= 1 && overrideTierLevel <= 3) {
    return overrideTierLevel;
  }
  
  // Priority 2: Direct column (preferred - business logic, not gateway-specific)
  if (transaction.tier_level !== undefined && transaction.tier_level !== null) {
    const tier = Number(transaction.tier_level);
    if (tier >= 1 && tier <= 3) {
      return tier;
    }
  }
  
  // Priority 3: Generic metadata field (fallback)
  if (transaction.metadata && typeof transaction.metadata.tier_level === 'number') {
    return transaction.metadata.tier_level;
  }
  
  // Priority 4: Legacy fields (backward compatibility only)
  if (transaction.esewa_data && typeof transaction.esewa_data.tier_level === 'number') {
    return transaction.esewa_data.tier_level;
  }
  
  if (transaction.khalti_data && typeof transaction.khalti_data.tier_level === 'number') {
    return transaction.khalti_data.tier_level;
  }
  
  // Default to tier 1
  return 1;
}

export interface PaymentSuccessParams {
  /** Transaction ID from database */
  transactionId: string;
  /** Optional: Additional gateway-specific data to merge into transaction metadata */
  gatewayData?: Record<string, unknown>;
  /** Optional: Override tier level (defaults to value from transaction metadata) */
  tierLevel?: number;
  /** Optional: Skip Stream Chat sync (useful for retries) */
  skipStreamSync?: boolean;
}

export interface PaymentSuccessResult {
  success: boolean;
  transaction?: {
    id: string;
    amount: number;
    transaction_uuid: string | null;
    created_at: string;
  };
  supporter?: {
    supporterId: string;
    creatorId: string;
    tierLevel: number;
  };
  streamSync?: {
    success: boolean;
    addedToChannels: number;
    error?: string;
  };
  error?: string;
}

/**
 * Unified payment success engine
 * Handles all post-payment success operations:
 * 1. Updates transaction status to 'completed'
 * 2. Creates/updates supporter record
 * 3. Updates supporter count in creator_profiles
 * 4. Syncs supporter to Stream Chat channels
 * 
 * This engine is gateway-agnostic and can be called from:
 * - eSewa verification
 * - Khalti verification
 * - Direct payment
 * - Any other payment gateway
 * 
 * @param params Payment success parameters
 * @returns Payment success result with transaction and supporter details
 */
export async function processPaymentSuccess(
  params: PaymentSuccessParams
): Promise<PaymentSuccessResult> {
  const { transactionId, gatewayData, tierLevel: overrideTierLevel, skipStreamSync = false } = params;

  try {
    const supabase = await createClient();

    // Step 1: Fetch the transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('supporter_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (transactionError || !transaction) {
      logger.error('Transaction not found in payment success engine', 'PAYMENT_SUCCESS_ENGINE', {
        transactionId,
        error: transactionError?.message,
      });
      return {
        success: false,
        error: 'Transaction not found',
      };
    }

    // Check if already completed (idempotency)
    if (transaction.status === 'completed') {
      logger.info('Transaction already completed, checking supporter and channel_members status', 'PAYMENT_SUCCESS_ENGINE', {
        transactionId,
        supporterId: transaction.supporter_id,
        creatorId: transaction.creator_id,
      });
      
      // Verify supporter record exists and is active
      // If not, we need to create it by calling manageSubscription
      if (transaction.supporter_id && transaction.creator_id) {
        const { data: existingSupporter, error: supporterCheckError } = await supabase
          .from('supporters')
          .select('id, tier_level, is_active')
          .eq('supporter_id', transaction.supporter_id)
          .eq('creator_id', transaction.creator_id)
          .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 or 1 rows
        
        logger.info('Existing supporter record check', 'PAYMENT_SUCCESS_ENGINE', {
          transactionId,
          supporterFound: !!existingSupporter,
          supporterIsActive: existingSupporter?.is_active,
          supporterTierLevel: existingSupporter?.tier_level,
          error: supporterCheckError?.message,
        });
        
        // Always call manageSubscription to ensure tier level is up-to-date
        // This handles: new supporters, inactive supporters, tier upgrades, tier downgrades
        const transactionTierLevel = extractTierLevel(transaction, overrideTierLevel);
        const needsUpdate = !existingSupporter || 
                           !existingSupporter.is_active || 
                           existingSupporter.tier_level !== transactionTierLevel;
        
        if (needsUpdate) {
          logger.info('Supporter record needs update, calling manageSubscription', 'PAYMENT_SUCCESS_ENGINE', {
            transactionId,
            supporterId: transaction.supporter_id,
            creatorId: transaction.creator_id,
            existingSupporter: !!existingSupporter,
            isActive: existingSupporter?.is_active,
            existingTierLevel: existingSupporter?.tier_level,
            transactionTierLevel,
            overrideTierLevel,
            reason: !existingSupporter ? 'supporter_missing' : 
                   !existingSupporter.is_active ? 'supporter_inactive' : 
                   'tier_level_mismatch',
          });
          
          const transactionAmount = Number(transaction.amount);
          
          try {
            const subscriptionResult = await manageSubscription({
              supporterId: transaction.supporter_id,
              creatorId: transaction.creator_id,
              amount: transactionAmount,
              tierLevel: transactionTierLevel,
              transactionId: transaction.id,
              isRecurring: false,
              cumulativeAmount: false,
            });
            
            logger.info('manageSubscription completed for already-completed transaction', 'PAYMENT_SUCCESS_ENGINE', {
              transactionId,
              success: subscriptionResult.success,
              error: subscriptionResult.error,
              previousTierLevel: existingSupporter?.tier_level,
              newTierLevel: subscriptionResult.supporter?.tierLevel,
              isUpgrade: subscriptionResult.supporter?.tierLevel && existingSupporter?.tier_level && 
                        subscriptionResult.supporter.tierLevel > existingSupporter.tier_level,
              isDowngrade: subscriptionResult.supporter?.tierLevel && existingSupporter?.tier_level && 
                          subscriptionResult.supporter.tierLevel < existingSupporter.tier_level,
            });
          } catch (subscriptionError) {
            logger.error('Failed to create/update supporter via manageSubscription', 'PAYMENT_SUCCESS_ENGINE', {
              transactionId,
              error: subscriptionError instanceof Error ? subscriptionError.message : 'Unknown',
            });
          }
        } else {
          // Supporter exists and is active, ensure they're in channel_members
          const tierLevel = existingSupporter.tier_level || extractTierLevel(transaction, overrideTierLevel);
          
          // Get eligible channels and ensure supporter is in channel_members
          const { data: eligibleChannels } = await supabase
            .from('channels')
            .select('id')
            .eq('creator_id', transaction.creator_id)
            .lte('min_tier_required', tierLevel);
          
          if (eligibleChannels && eligibleChannels.length > 0) {
            const channelMembers = eligibleChannels.map((c: { id: string }) => ({
              channel_id: c.id,
              user_id: transaction.supporter_id,
            }));
            
            const { error: membersError } = await supabase
              .from('channel_members')
              .upsert(channelMembers, {
                onConflict: 'channel_id,user_id',
              });
            
            logger.info('Channel members sync for completed transaction', 'PAYMENT_SUCCESS_ENGINE', {
              transactionId,
              supporterId: transaction.supporter_id,
              creatorId: transaction.creator_id,
              tierLevel,
              channelCount: eligibleChannels.length,
              upsertError: membersError?.message,
            });
          }
        }
      }
      
      // Still sync to Stream if requested (in case sync failed before)
      let streamSyncResult;
      if (!skipStreamSync && transaction.supporter_id && transaction.creator_id) {
        const tierLevel = extractTierLevel(transaction, overrideTierLevel);
        streamSyncResult = await syncSupporterToStream(
          transaction.supporter_id,
          transaction.creator_id,
          tierLevel
        );
      }

      return {
        success: true,
        transaction: {
          id: transaction.id,
          amount: Number(transaction.amount),
          transaction_uuid: transaction.transaction_uuid,
          created_at: transaction.created_at,
        },
        supporter: transaction.supporter_id && transaction.creator_id ? {
          supporterId: transaction.supporter_id,
          creatorId: transaction.creator_id,
          tierLevel: extractTierLevel(transaction, overrideTierLevel),
        } : undefined,
        streamSync: streamSyncResult,
      };
    }

    // Step 2: Update transaction status to 'completed'
    const updateData: {
      status: string;
      completed_at: string;
      esewa_data?: Record<string, unknown>;
      khalti_data?: Record<string, unknown>;
    } = {
      status: 'completed',
      completed_at: new Date().toISOString(),
    };

    // Get payment method (handle both payment_method and gateway for compatibility)
    const paymentMethod = (transaction as any).payment_method || (transaction as any).gateway || 'esewa';

    // Merge gateway-specific data into appropriate field
    if (gatewayData) {
      if (paymentMethod === 'khalti') {
        updateData.khalti_data = {
          ...(transaction.khalti_data as Record<string, unknown> || {}),
          ...gatewayData,
          verified_at: new Date().toISOString(),
        };
      } else {
        // Default to esewa_data for eSewa and direct payments
        updateData.esewa_data = {
          ...(transaction.esewa_data as Record<string, unknown> || {}),
          ...gatewayData,
          verified_at: new Date().toISOString(),
        };
      }
    } else {
      // If no gateway data provided, just add verified_at timestamp
      if (paymentMethod === 'khalti') {
        updateData.khalti_data = {
          ...(transaction.khalti_data as Record<string, unknown> || {}),
          verified_at: new Date().toISOString(),
        };
      } else {
        updateData.esewa_data = {
          ...(transaction.esewa_data as Record<string, unknown> || {}),
          verified_at: new Date().toISOString(),
        };
      }
    }

    const { error: updateError } = await supabase
      .from('supporter_transactions')
      .update(updateData)
      .eq('id', transaction.id);

    if (updateError) {
      logger.error('Failed to update transaction status', 'PAYMENT_SUCCESS_ENGINE', {
        error: updateError.message,
        transactionId: transaction.id,
      });
      return {
        success: false,
        error: 'Failed to update transaction status',
      };
    }

    logger.info('Transaction status updated to completed', 'PAYMENT_SUCCESS_ENGINE', {
      transactionId: transaction.id,
      paymentMethod: transaction.payment_method,
    });

    // Step 3: Create/update supporter record
    if (!transaction.supporter_id || !transaction.creator_id) {
      logger.warn('Transaction missing supporter_id or creator_id', 'PAYMENT_SUCCESS_ENGINE', {
        transactionId: transaction.id,
        supporterId: transaction.supporter_id,
        creatorId: transaction.creator_id,
      });
      return {
        success: false,
        error: 'Transaction missing required user IDs',
      };
    }

    const transactionAmount = Number(transaction.amount);

    const extractedTierLevel = extractTierLevel(transaction, overrideTierLevel);
    
    logger.info('Starting subscription management', 'PAYMENT_SUCCESS_ENGINE', {
      transactionId: transaction.id,
      supporterId: transaction.supporter_id,
      creatorId: transaction.creator_id,
      amount: transactionAmount,
      overrideTierLevel,
      extractedTierLevel,
    });

    // Use unified subscription management engine
    let finalTierLevel = extractedTierLevel;
    let subscriptionResult;
    
    try {
      subscriptionResult = await manageSubscription({
        supporterId: transaction.supporter_id,
        creatorId: transaction.creator_id,
        amount: transactionAmount,
        tierLevel: extractedTierLevel,
        transactionId: transaction.id,
        isRecurring: false, // One-time payments are not recurring
        cumulativeAmount: false, // Replace amount, don't add to existing
      });
      
      logger.info('Subscription management completed', 'PAYMENT_SUCCESS_ENGINE', {
        transactionId: transaction.id,
        success: subscriptionResult.success,
        error: subscriptionResult.error,
        supporterTierLevel: subscriptionResult.supporter?.tierLevel,
        supporterIsActive: subscriptionResult.supporter?.isActive,
      });

      if (!subscriptionResult.success) {
        logger.error('Failed to manage subscription', 'PAYMENT_SUCCESS_ENGINE', {
          error: subscriptionResult.error,
          supporterId: transaction.supporter_id,
          creatorId: transaction.creator_id,
        });
        // Continue even if subscription management fails - transaction is already marked as completed
        // Use fallback tier level
      } else {
        // Use the tier level from subscription result
        finalTierLevel = subscriptionResult.supporter?.tierLevel || finalTierLevel;
        logger.info('Subscription managed successfully', 'PAYMENT_SUCCESS_ENGINE', {
          supporterId: transaction.supporter_id,
          creatorId: transaction.creator_id,
          tierLevel: subscriptionResult.supporter?.tierLevel,
          amount: subscriptionResult.supporter?.amount,
          tierInfo: subscriptionResult.tierInfo,
        });
      }
    } catch (subscriptionError) {
      logger.error('Subscription management error', 'PAYMENT_SUCCESS_ENGINE', {
        error: subscriptionError instanceof Error ? subscriptionError.message : 'Unknown',
        supporterId: transaction.supporter_id,
        creatorId: transaction.creator_id,
      });
      // Continue even if subscription management fails - transaction is already marked as completed
    }

    // Step 4: Update supporter count in creator_profiles
    try {
      await updateSupporterCount(transaction.creator_id);
      logger.info('Supporter count updated', 'PAYMENT_SUCCESS_ENGINE', {
        creatorId: transaction.creator_id,
      });
    } catch (countError) {
      logger.error('Failed to update supporter count', 'PAYMENT_SUCCESS_ENGINE', {
        error: countError instanceof Error ? countError.message : 'Unknown',
        creatorId: transaction.creator_id,
      });
      // Continue even if count update fails
    }

    // Step 5: Create notifications for creator
    try {
      // Get supporter's display name for notification
      const { data: supporterUser } = await supabase
        .from('users')
        .select('display_name')
        .eq('id', transaction.supporter_id)
        .single();

      const supporterName = supporterUser?.display_name || undefined;

      // Create payment notification
      await createPaymentNotification(
        transaction.creator_id,
        transaction.supporter_id,
        transactionAmount,
        transaction.id,
        supporterName
      ).catch((notifError) => {
        logger.warn('Failed to create payment notification', 'PAYMENT_SUCCESS_ENGINE', {
          error: notifError instanceof Error ? notifError.message : 'Unknown',
          transactionId: transaction.id,
        });
      });

      // Create support notification
      await createSupportNotification(
        transaction.creator_id,
        transaction.supporter_id,
        finalTierLevel,
        transactionAmount,
        supporterName
      ).catch((notifError) => {
        logger.warn('Failed to create support notification', 'PAYMENT_SUCCESS_ENGINE', {
          error: notifError instanceof Error ? notifError.message : 'Unknown',
          transactionId: transaction.id,
        });
      });
    } catch (notifError) {
      logger.warn('Error creating notifications', 'PAYMENT_SUCCESS_ENGINE', {
        error: notifError instanceof Error ? notifError.message : 'Unknown',
        transactionId: transaction.id,
      });
      // Don't fail the payment if notifications fail
    }

    // Step 6: Log support activity
    try {
      await logSupportGiven(
        transaction.supporter_id,
        transaction.id,
        transaction.creator_id,
        transactionAmount
      ).catch((activityError) => {
        logger.warn('Failed to log support activity', 'PAYMENT_SUCCESS_ENGINE', {
          error: activityError instanceof Error ? activityError.message : 'Unknown',
          transactionId: transaction.id,
        });
        // Don't fail the payment if activity logging fails
      });
    } catch (activityError) {
      logger.warn('Error logging support activity', 'PAYMENT_SUCCESS_ENGINE', {
        error: activityError instanceof Error ? activityError.message : 'Unknown',
        transactionId: transaction.id,
      });
      // Don't fail the payment if activity logging fails
    }

    // Step 7: Sync supporter to Stream Chat channels
    let streamSyncResult;
    if (!skipStreamSync) {
      streamSyncResult = await syncSupporterToStream(
        transaction.supporter_id,
        transaction.creator_id,
        finalTierLevel
      );
    }

    logger.info('Payment success processing completed', 'PAYMENT_SUCCESS_ENGINE', {
      transactionId: transaction.id,
      creatorId: transaction.creator_id,
      supporterId: transaction.supporter_id,
      amount: transactionAmount,
      tierLevel: finalTierLevel,
      streamSyncSuccess: streamSyncResult?.success,
    });

    return {
      success: true,
      transaction: {
        id: transaction.id,
        amount: transactionAmount,
        transaction_uuid: transaction.transaction_uuid,
        created_at: transaction.created_at,
      },
      supporter: {
        supporterId: transaction.supporter_id,
        creatorId: transaction.creator_id,
        tierLevel: finalTierLevel,
      },
      streamSync: streamSyncResult,
    };
  } catch (error) {
    logger.error('Payment success engine error', 'PAYMENT_SUCCESS_ENGINE', {
      error: error instanceof Error ? error.message : 'Unknown',
      transactionId,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sync supporter to Stream Chat channels
 * This is a helper function used by the payment success engine
 */
async function syncSupporterToStream(
  supporterId: string,
  creatorId: string,
  tierLevel: number
): Promise<{ success: boolean; addedToChannels: number; error?: string }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/stream/sync-supporter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supporterId,
        creatorId,
        tierLevel,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    const addedToChannels = result.addedToChannels?.length || 0;

    logger.info('Supporter synced to Stream channels', 'PAYMENT_SUCCESS_ENGINE', {
      supporterId,
      creatorId,
      tierLevel,
      addedToChannels,
    });

    return {
      success: true,
      addedToChannels,
    };
  } catch (streamError) {
    logger.warn('Failed to sync supporter to Stream', 'PAYMENT_SUCCESS_ENGINE', {
      error: streamError instanceof Error ? streamError.message : 'Unknown',
      supporterId,
      creatorId,
    });
    return {
      success: false,
      addedToChannels: 0,
      error: streamError instanceof Error ? streamError.message : 'Unknown error',
    };
  }
}
