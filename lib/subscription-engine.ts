import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { sendSubscriptionConfirmationEmail, sendNewSupporterNotificationEmail } from '@/lib/email';
import { getCreatorProfileUrl } from '@/emails/config';
import { createSupportNotification } from '@/lib/notification-engine';
import { logSupportGiven } from '@/lib/activity-logging-engine';

export interface SubscriptionParams {
  /** Supporter user ID */
  supporterId: string;
  /** Creator user ID */
  creatorId: string;
  /** Payment amount in NPR */
  amount: number;
  /** Optional: Explicit tier level (1, 2, or 3). If not provided, will be determined from amount */
  tierLevel?: number;
  /** Optional: Transaction ID for linking */
  transactionId?: string;
  /** Optional: Subscription ID if this is for a recurring subscription */
  subscriptionId?: string;
  /** Optional: Whether this is a recurring subscription payment */
  isRecurring?: boolean;
  /** Optional: Whether to update amount cumulatively (default: false, replaces amount) */
  cumulativeAmount?: boolean;
  /** Optional: Payment gateway used (esewa, khalti, dodo, direct) */
  paymentGateway?: 'esewa' | 'khalti' | 'dodo' | 'direct';
}

export interface SubscriptionResult {
  success: boolean;
  supporter?: {
    id: string;
    supporterId: string;
    creatorId: string;
    tierLevel: number;
    amount: number;
    isActive: boolean;
    subscriptionId?: string | null;
  };
  tierInfo?: {
    tierLevel: number;
    tierName: string;
    tierPrice: number;
    matchedByAmount: boolean;
  };
  error?: string;
}

/**
 * Unified subscription management engine
 *
 * Sync rule: supporter and subscription stay in sync at the application level.
 * - Grant access: only through this engine (creates/updates supporters + subscriptions).
 * - Revoke access: only through processUnsubscribe in unsubscribe-engine.ts.
 *
 * This engine:
 * 1. Determines tier level from payment amount (if not explicitly provided)
 * 2. Creates or updates supporter record (is_active = true)
 * 3. Handles tier upgrades/downgrades
 * 4. Creates or updates subscription record when applicable; links supporter.subscription_id
 * 5. Ensures data consistency
 *
 * @param params Subscription parameters
 * @returns Subscription result with supporter and tier details
 */
export async function manageSubscription(
  params: SubscriptionParams
): Promise<SubscriptionResult> {
  const {
    supporterId,
    creatorId,
    amount,
    tierLevel: explicitTierLevel,
    transactionId,
    subscriptionId,
    isRecurring = false,
    cumulativeAmount = false,
    paymentGateway = 'direct',
  } = params;

  try {
    logger.info('manageSubscription called', 'SUBSCRIPTION_ENGINE', {
      supporterId,
      creatorId,
      amount,
      explicitTierLevel,
      transactionId,
      isRecurring,
      cumulativeAmount,
      subscriptionId,
    });

    const supabase = await createClient();

    // Step 1: Determine tier level
    let tierLevel: number;
    let tierInfo: { tierLevel: number; tierName: string; tierPrice: number; matchedByAmount: boolean } | undefined;

    if (explicitTierLevel && explicitTierLevel >= 1 && explicitTierLevel <= 3) {
      // Use explicitly provided tier level
      tierLevel = explicitTierLevel;
      
      // Fetch tier info for logging
      const { data: tier } = await supabase
        .from('subscription_tiers')
        .select('tier_level, tier_name, price')
        .eq('creator_id', creatorId)
        .eq('tier_level', tierLevel)
        .eq('is_active', true)
        .single();

      if (tier) {
        tierInfo = {
          tierLevel: tier.tier_level,
          tierName: tier.tier_name,
          tierPrice: Number(tier.price),
          matchedByAmount: false,
        };
      }
    } else {
      // Determine tier level from payment amount by checking subscription_tiers
      const { data: tiers, error: tiersError } = await supabase
        .from('subscription_tiers')
        .select('tier_level, tier_name, price')
        .eq('creator_id', creatorId)
        .eq('is_active', true)
        .order('tier_level', { ascending: true });

      if (tiersError || !tiers || tiers.length === 0) {
        logger.warn('No active tiers found for creator, defaulting to tier 1', 'SUBSCRIPTION_ENGINE', {
          creatorId,
          amount,
        });
        tierLevel = 1;
      } else {
        // Find the highest tier that the amount matches or exceeds
        // Match tier if amount is within 10% of tier price (to handle rounding)
        let matchedTier = tiers.find(tier => {
          const tierPrice = Number(tier.price);
          const difference = Math.abs(amount - tierPrice);
          const tolerance = tierPrice * 0.1; // 10% tolerance
          return difference <= tolerance || amount >= tierPrice;
        });

        // If no exact match, find the highest tier the amount can afford
        if (!matchedTier) {
          matchedTier = tiers
            .filter(tier => amount >= Number(tier.price))
            .sort((a, b) => Number(b.price) - Number(a.price))[0];
        }

        // Default to tier 1 if amount doesn't match any tier
        if (!matchedTier) {
          logger.warn('Amount does not match any tier, defaulting to tier 1', 'SUBSCRIPTION_ENGINE', {
            creatorId,
            amount,
            availableTiers: tiers.map(t => ({ level: t.tier_level, price: t.price })),
          });
          tierLevel = 1;
          matchedTier = tiers.find(t => t.tier_level === 1) || tiers[0];
        } else {
          tierLevel = matchedTier.tier_level;
        }

        tierInfo = {
          tierLevel: matchedTier.tier_level,
          tierName: matchedTier.tier_name,
          tierPrice: Number(matchedTier.price),
          matchedByAmount: true,
        };
      }
    }

    // Step 2: Check for existing supporter record
    const { data: existingSupporter, error: existingError } = await supabase
      .from('supporters')
      .select('id, tier_level, amount, is_active, subscription_id')
      .eq('supporter_id', supporterId)
      .eq('creator_id', creatorId)
      .single();

    // Step 3: Determine if this is an upgrade, downgrade, or same tier
    let isUpgrade = false;
    let isDowngrade = false;
    if (existingSupporter) {
      const existingTierLevel = existingSupporter.tier_level || 1;
      if (tierLevel > existingTierLevel) {
        isUpgrade = true;
      } else if (tierLevel < existingTierLevel) {
        isDowngrade = true;
      }
    }

    // Step 4: Calculate new amount
    let newAmount: number;
    if (cumulativeAmount && existingSupporter) {
      // Add to existing amount
      newAmount = Number(existingSupporter.amount || 0) + amount;
    } else {
      // Replace amount (default behavior)
      newAmount = amount;
    }

    // Step 5: Upsert supporter record
    // The unique constraint on (supporter_id, creator_id) prevents duplicates
    const supporterData: any = {
      supporter_id: supporterId,
      creator_id: creatorId,
      tier_level: tierLevel,
      amount: newAmount,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    // Set tier name (legacy field)
    if (tierInfo) {
      supporterData.tier = tierInfo.tierName.toLowerCase().replace(/\s+/g, '_');
    } else {
      supporterData.tier = 'basic';
    }

    // Link subscription if provided
    if (subscriptionId) {
      supporterData.subscription_id = subscriptionId;
    }

    let supporterRecord;
    if (existingSupporter) {
      // Update existing supporter
      const { data: updated, error: updateError } = await supabase
        .from('supporters')
        .update(supporterData)
        .eq('id', existingSupporter.id)
        .select()
        .single();

      if (updateError) {
        logger.error('Failed to update supporter', 'SUBSCRIPTION_ENGINE', {
          error: updateError.message,
          supporterId,
          creatorId,
          existingSupporterId: existingSupporter.id,
        });
        return {
          success: false,
          error: `Failed to update supporter: ${updateError.message}`,
        };
      }

      supporterRecord = updated;
      logger.info('Supporter updated', 'SUBSCRIPTION_ENGINE', {
        supporterId,
        creatorId,
        tierLevel,
        previousTierLevel: existingSupporter.tier_level,
        isUpgrade,
        isDowngrade,
        amount: newAmount,
        previousAmount: existingSupporter.amount,
      });
    } else {
      // Create new supporter
      supporterData.created_at = new Date().toISOString();
      
      const { data: created, error: createError } = await supabase
        .from('supporters')
        .insert(supporterData)
        .select()
        .single();

      if (createError) {
        // Check if it's a duplicate constraint error (race condition)
        if (createError.code === '23505' || createError.message.includes('duplicate')) {
          logger.warn('Duplicate supporter detected (race condition), fetching existing', 'SUBSCRIPTION_ENGINE', {
            supporterId,
            creatorId,
          });
          
          // Fetch the existing record
          const { data: existing } = await supabase
            .from('supporters')
            .select()
            .eq('supporter_id', supporterId)
            .eq('creator_id', creatorId)
            .single();

          if (existing) {
            // Update it instead
            const { data: updated, error: updateError } = await supabase
              .from('supporters')
              .update(supporterData)
              .eq('id', existing.id)
              .select()
              .single();

            if (updateError) {
              logger.error('Failed to update supporter after duplicate detection', 'SUBSCRIPTION_ENGINE', {
                error: updateError.message,
              });
              return {
                success: false,
                error: `Failed to update supporter: ${updateError.message}`,
              };
            }

            supporterRecord = updated;
          } else {
            return {
              success: false,
              error: 'Duplicate detected but existing record not found',
            };
          }
        } else {
          logger.error('Failed to create supporter', 'SUBSCRIPTION_ENGINE', {
            error: createError.message,
            supporterId,
            creatorId,
          });
          return {
            success: false,
            error: `Failed to create supporter: ${createError.message}`,
          };
        }
      } else {
        supporterRecord = created;
        logger.info('Supporter created', 'SUBSCRIPTION_ENGINE', {
          supporterId,
          creatorId,
          tierLevel,
          amount: newAmount,
        });
      }
    }

    // Step 6: Update channel_members based on new tier level
    // This handles both upgrades (add to new channels) and downgrades (remove from channels they no longer have access to)
    if (supporterRecord) {
      logger.info('Starting channel_members update process', 'SUBSCRIPTION_ENGINE', {
        supporterId,
        creatorId,
        tierLevel,
        previousTierLevel: existingSupporter?.tier_level,
        isUpgrade,
        isDowngrade,
        supporterRecordId: supporterRecord.id,
      });
      
      try {
        // Get all channels for this creator
        const { data: allChannels, error: allChannelsError } = await supabase
          .from('channels')
          .select('id, name, min_tier_required')
          .eq('creator_id', creatorId);

        if (allChannelsError) {
          logger.error('Failed to fetch channels', 'SUBSCRIPTION_ENGINE', {
            error: allChannelsError.message,
            supporterId,
            creatorId,
          });
        } else if (allChannels && allChannels.length > 0) {
          // Determine which channels the supporter should have access to
          const eligibleChannels = allChannels.filter((channel: any) => 
            channel.min_tier_required <= tierLevel
          );
          
          // Determine which channels they should NOT have access to (for downgrades)
          const ineligibleChannels = allChannels.filter((channel: any) => 
            channel.min_tier_required > tierLevel
          );

          logger.info('Channel access analysis', 'SUBSCRIPTION_ENGINE', {
            supporterId,
            creatorId,
            tierLevel,
            totalChannels: allChannels.length,
            eligibleChannelsCount: eligibleChannels.length,
            ineligibleChannelsCount: ineligibleChannels.length,
            eligibleChannels: eligibleChannels.map((c: any) => ({
              id: c.id,
              name: c.name,
              min_tier_required: c.min_tier_required,
            })),
            ineligibleChannels: ineligibleChannels.map((c: any) => ({
              id: c.id,
              name: c.name,
              min_tier_required: c.min_tier_required,
            })),
          });

          // Add supporter to eligible channels
          if (eligibleChannels.length > 0) {
            const channelMembers = eligibleChannels.map((channel: { id: string }) => ({
              channel_id: channel.id,
              user_id: supporterId,
            }));

            const { data: upsertedMembers, error: membersError } = await supabase
              .from('channel_members')
              .upsert(channelMembers, {
                onConflict: 'channel_id,user_id',
              })
              .select();

            if (membersError) {
              logger.error('Failed to add supporter to channel_members', 'SUBSCRIPTION_ENGINE', {
                error: membersError.message,
                errorCode: membersError.code,
                supporterId,
                creatorId,
                channelCount: eligibleChannels.length,
              });
            } else {
              logger.info('Supporter added to eligible channels', 'SUBSCRIPTION_ENGINE', {
                supporterId,
                creatorId,
                tierLevel,
                channelCount: eligibleChannels.length,
                upsertedCount: upsertedMembers?.length || 0,
              });
            }
          }

          // Remove supporter from ineligible channels (for downgrades)
          if (isDowngrade && ineligibleChannels.length > 0) {
            const ineligibleChannelIds = ineligibleChannels.map((c: any) => c.id);
            
            // Remove from database
            const { error: removeError } = await supabase
              .from('channel_members')
              .delete()
              .eq('user_id', supporterId)
              .in('channel_id', ineligibleChannelIds);

            if (removeError) {
              logger.error('Failed to remove supporter from ineligible channels', 'SUBSCRIPTION_ENGINE', {
                error: removeError.message,
                supporterId,
                creatorId,
                channelCount: ineligibleChannels.length,
              });
            } else {
              logger.info('Supporter removed from ineligible channels database (downgrade)', 'SUBSCRIPTION_ENGINE', {
                supporterId,
                creatorId,
                previousTierLevel: existingSupporter?.tier_level,
                newTierLevel: tierLevel,
                removedChannelsCount: ineligibleChannels.length,
                removedChannelIds: ineligibleChannelIds,
              });
              
              // Also remove from Stream Chat for each channel
              const { removeMemberFromChannel } = await import('./stream-channel-engine');
              for (const channel of ineligibleChannels) {
                try {
                  await removeMemberFromChannel({
                    channelId: channel.id,
                    userId: supporterId,
                  });
                  logger.info('Supporter removed from Stream Chat channel (downgrade)', 'SUBSCRIPTION_ENGINE', {
                    supporterId,
                    channelId: channel.id,
                    channelName: channel.name,
                  });
                } catch (streamError) {
                  logger.warn('Failed to remove supporter from Stream Chat channel', 'SUBSCRIPTION_ENGINE', {
                    error: streamError instanceof Error ? streamError.message : 'Unknown',
                    supporterId,
                    channelId: channel.id,
                  });
                  // Don't fail the subscription if Stream removal fails
                }
              }
            }
          }
        } else {
          logger.warn('No channels found for creator', 'SUBSCRIPTION_ENGINE', {
            supporterId,
            creatorId,
            tierLevel,
          });
        }
      } catch (channelError) {
        logger.error('Exception updating channel_members', 'SUBSCRIPTION_ENGINE', {
          error: channelError instanceof Error ? channelError.message : 'Unknown',
          errorStack: channelError instanceof Error ? channelError.stack : undefined,
          supporterId,
          creatorId,
        });
        // Don't fail the subscription if channel member update fails
      }
    } else {
      logger.warn('Supporter record not available, skipping channel_members update', 'SUBSCRIPTION_ENGINE', {
        supporterId,
        creatorId,
      });
    }

    // Step 7: Handle subscription record for eSewa/Khalti/Dodo (with expiry tracking)
    // For eSewa/Khalti, we need to track expiry dates even though they're "one-time" payments
    // For Dodo, subscription is managed externally but we track locally for consistency
    if (paymentGateway === 'esewa' || paymentGateway === 'khalti' || paymentGateway === 'dodo' || (isRecurring && subscriptionId)) {
      try {
        // Check for existing subscription record by supporter + creator
        const { data: existingSubscription } = await supabase
          .from('subscriptions')
          .select('id, tier_level, renewal_count, status')
          .eq('supporter_id', supporterId)
          .eq('creator_id', creatorId)
          .maybeSingle();

        // Get tier_id from subscription_tiers
        const { data: tier } = await supabase
          .from('subscription_tiers')
          .select('id')
          .eq('creator_id', creatorId)
          .eq('tier_level', tierLevel)
          .single();

        if (tier) {
          const currentDate = new Date();
          const periodEnd = new Date(currentDate);
          periodEnd.setDate(periodEnd.getDate() + 30); // 30 days from now

          const subscriptionData: any = {
            supporter_id: supporterId,
            creator_id: creatorId,
            tier_id: tier.id,
            tier_level: tierLevel,
            amount: amount,
            payment_gateway: paymentGateway,
            status: 'active',
            billing_cycle: 'monthly',
            current_period_start: currentDate.toISOString(),
            current_period_end: periodEnd.toISOString(),
          };

          if (existingSubscription) {
            // Update existing subscription (tier change or renewal)
            const isTierChange = existingSubscription.tier_level !== tierLevel;
            const isRenewal = !isTierChange && (existingSubscription.status === 'expired' || existingSubscription.status === 'cancelled');

            // For eSewa/Khalti, reset reminder tracking and increment renewal count on renewals
            if (paymentGateway === 'esewa' || paymentGateway === 'khalti') {
              subscriptionData.reminder_sent_at = {}; // Reset reminders
              if (isRenewal) {
                subscriptionData.renewal_count = (existingSubscription.renewal_count || 0) + 1;
              } else if (isTierChange) {
                // Tier change: keep renewal count but reset reminders
                subscriptionData.renewal_count = existingSubscription.renewal_count || 0;
              }

              logger.info('Updating eSewa/Khalti subscription with expiry tracking', 'SUBSCRIPTION_ENGINE', {
                subscriptionId: existingSubscription.id,
                paymentGateway,
                previousTierLevel: existingSubscription.tier_level,
                newTierLevel: tierLevel,
                isTierChange,
                isRenewal,
                expiryDate: subscriptionData.current_period_end,
                renewalCount: subscriptionData.renewal_count,
              });
            }

            const { error: updateError } = await supabase
              .from('subscriptions')
              .update(subscriptionData)
              .eq('id', existingSubscription.id);

            if (updateError) {
              logger.error('Failed to update subscription record', 'SUBSCRIPTION_ENGINE', {
                error: updateError.message,
                subscriptionId: existingSubscription.id,
                paymentGateway,
              });
            } else {
              logger.info('Subscription record updated successfully', 'SUBSCRIPTION_ENGINE', {
                subscriptionId: existingSubscription.id,
                tierLevel,
                expiryDate: subscriptionData.current_period_end,
              });
            }
          } else {
            // Create new subscription
            // For eSewa/Khalti, initialize reminder tracking
            if (paymentGateway === 'esewa' || paymentGateway === 'khalti') {
              subscriptionData.reminder_sent_at = {};
              subscriptionData.renewal_count = 0;

              logger.info('Creating eSewa/Khalti subscription with expiry tracking', 'SUBSCRIPTION_ENGINE', {
                paymentGateway,
                tierLevel,
                expiryDate: subscriptionData.current_period_end,
              });
            }

            // Use provided subscriptionId if available, otherwise let DB generate
            if (subscriptionId) {
              subscriptionData.id = subscriptionId;
            }

            const { data: newSubscription, error: insertError } = await supabase
              .from('subscriptions')
              .insert(subscriptionData)
              .select('id')
              .single();

            if (insertError) {
              logger.error('Failed to create subscription record', 'SUBSCRIPTION_ENGINE', {
                error: insertError.message,
                paymentGateway,
                tierLevel,
              });
            } else {
              logger.info('Subscription record created successfully', 'SUBSCRIPTION_ENGINE', {
                subscriptionId: newSubscription?.id,
                paymentGateway,
                tierLevel,
                expiryDate: subscriptionData.current_period_end,
              });
              // Keep supporter and subscription in sync: link supporter.subscription_id
              if (newSubscription?.id && supporterRecord?.id) {
                const { error: linkError } = await supabase
                  .from('supporters')
                  .update({
                    subscription_id: newSubscription.id,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', supporterRecord.id);
                if (linkError) {
                  logger.warn('Failed to link supporter to new subscription', 'SUBSCRIPTION_ENGINE', {
                    supporterRecordId: supporterRecord.id,
                    subscriptionId: newSubscription.id,
                    error: linkError.message,
                  });
                }
              }
            }
          }
        } else {
          logger.warn('Tier not found for subscription creation', 'SUBSCRIPTION_ENGINE', {
            creatorId,
            tierLevel,
          });
        }
      } catch (subError: any) {
        logger.error('Error managing subscription record', 'SUBSCRIPTION_ENGINE', {
          error: subError.message,
          paymentGateway,
          supporterId,
          creatorId,
        });
        // Don't fail the whole operation if subscription record management fails
      }
    }

    // Step 8: Send confirmation emails (only for new subscriptions or upgrades)
    const isNewSubscription = !existingSupporter || isUpgrade;
    if (isNewSubscription && supporterRecord && tierInfo) {
      try {
        // Get supporter and creator email addresses
        const [supporterResult, creatorResult] = await Promise.all([
          supabase
            .from('users')
            .select('email, display_name')
            .eq('id', supporterId)
            .single(),
          supabase
            .from('users')
            .select('email, display_name')
            .eq('id', creatorId)
            .single(),
        ]);

        const supporterUser = supporterResult.data;
        const creatorUser = creatorResult.data;

        // Send email to supporter
        if (supporterUser?.email) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://merocircle.app';
          await sendSubscriptionConfirmationEmail({
            supporterEmail: supporterUser.email,
            supporterName: supporterUser.display_name || 'Supporter',
            creatorName: creatorUser?.display_name || 'Creator',
            tierLevel,
            tierName: tierInfo.tierName,
            amount: newAmount,
            currency: 'NPR',
            creatorProfileUrl: getCreatorProfileUrl(creatorUser?.display_name || ''),
            chatUrl: `${appUrl}/chat`,
          }).catch((emailError: unknown) => {
            logger.warn('Failed to send subscription confirmation email', 'SUBSCRIPTION_ENGINE', {
              error: emailError instanceof Error ? emailError.message : 'Unknown',
              supporterEmail: supporterUser.email,
            });
          });
        }

        // Send email to creator
        if (creatorUser?.email) {
          // Get supporter message from transaction if available
          let supporterMessage: string | null = null;
          if (transactionId) {
            const { data: transaction } = await supabase
              .from('supporter_transactions')
              .select('supporter_message')
              .eq('id', transactionId)
              .single();
            supporterMessage = transaction?.supporter_message || null;
          }

          await sendNewSupporterNotificationEmail({
            creatorEmail: creatorUser.email,
            creatorName: creatorUser.display_name || 'Creator',
            supporterName: supporterUser?.display_name || 'Supporter',
            tierLevel,
            tierName: tierInfo.tierName,
            amount: newAmount,
            currency: 'NPR',
            supporterMessage,
          }).catch((emailError: unknown) => {
            logger.warn('Failed to send new supporter notification email', 'SUBSCRIPTION_ENGINE', {
              error: emailError instanceof Error ? emailError.message : 'Unknown',
              creatorEmail: creatorUser.email,
            });
          });
        }
      } catch (emailError) {
        logger.warn('Error sending subscription emails', 'SUBSCRIPTION_ENGINE', {
          error: emailError instanceof Error ? emailError.message : 'Unknown',
        });
        // Don't fail the subscription if email sending fails
      }
    }

    // Step 9: Create support notification for creator (only for new subscriptions or upgrades)
    if (isNewSubscription && supporterRecord) {
      try {
        // Get supporter's display name for notification
        const { data: supporterUser } = await supabase
          .from('users')
          .select('display_name')
          .eq('id', supporterId)
          .single();

        const supporterName = supporterUser?.display_name || undefined;

        // Create support notification
        await createSupportNotification(
          creatorId,
          supporterId,
          tierLevel,
          newAmount,
          supporterName
        ).catch((notifError) => {
          logger.warn('Failed to create support notification', 'SUBSCRIPTION_ENGINE', {
            error: notifError instanceof Error ? notifError.message : 'Unknown',
            supporterId,
            creatorId,
          });
        });
      } catch (notifError) {
        logger.warn('Error creating support notification', 'SUBSCRIPTION_ENGINE', {
          error: notifError instanceof Error ? notifError.message : 'Unknown',
          supporterId,
          creatorId,
        });
        // Don't fail the subscription if notification fails
      }
    }

    // Step 10: Log support activity (only for new subscriptions or upgrades)
    if (isNewSubscription && transactionId) {
      try {
        await logSupportGiven(
          supporterId,
          transactionId,
          creatorId,
          newAmount
        ).catch((activityError) => {
          logger.warn('Failed to log support activity', 'SUBSCRIPTION_ENGINE', {
            error: activityError instanceof Error ? activityError.message : 'Unknown',
            supporterId,
            transactionId,
          });
          // Don't fail the subscription if activity logging fails
        });
      } catch (activityError) {
        logger.warn('Error logging support activity', 'SUBSCRIPTION_ENGINE', {
          error: activityError instanceof Error ? activityError.message : 'Unknown',
          supporterId,
          transactionId,
        });
        // Don't fail the subscription if activity logging fails
      }
    }

    logger.info('Subscription managed successfully', 'SUBSCRIPTION_ENGINE', {
      supporterId,
      creatorId,
      tierLevel,
      amount: newAmount,
      isNew: !existingSupporter,
      isUpgrade,
      isDowngrade,
      emailsSent: isNewSubscription,
    });

    return {
      success: true,
      supporter: supporterRecord ? {
        id: supporterRecord.id,
        supporterId: supporterRecord.supporter_id,
        creatorId: supporterRecord.creator_id,
        tierLevel: supporterRecord.tier_level,
        amount: Number(supporterRecord.amount),
        isActive: supporterRecord.is_active,
        subscriptionId: supporterRecord.subscription_id,
      } : undefined,
      tierInfo,
    };
  } catch (error) {
    logger.error('Subscription management error', 'SUBSCRIPTION_ENGINE', {
      error: error instanceof Error ? error.message : 'Unknown',
      supporterId,
      creatorId,
      amount,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
