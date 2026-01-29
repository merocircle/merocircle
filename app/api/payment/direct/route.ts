import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeString } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { serverStreamClient, upsertStreamUser } from '@/lib/stream-server';
import { validatePaymentRequest, verifyCreator, generateTransactionUuid, upsertSupporter, updateSupporterCount } from '@/lib/payment-utils';
import { handleApiError } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
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

    // Generate transaction UUID
    const transactionUuid = generateTransactionUuid('DIRECT');
    const amountStr = validation.validatedAmount.toString();
    const tierLevel = tier_level || 1;

    // Create transaction as completed (bypassing payment gateway)
    const insertData: any = {
      supporter_id: supporterId,
      creator_id: creatorId,
      amount: amountStr,
      payment_method: 'direct',
      status: 'completed',
      supporter_message: supporterMessage ? sanitizeString(supporterMessage) : null,
      transaction_uuid: transactionUuid,
      completed_at: new Date().toISOString(),
      esewa_data: {
        transaction_uuid: transactionUuid,
        payment_method: 'direct',
        bypassed: true,
        tier_level: tierLevel,
        created_at: new Date().toISOString(),
      }
    };

    const { data: transaction, error: transactionError } = await supabase
      .from('supporter_transactions')
      .insert(insertData)
      .select()
      .single();

    if (transactionError) {
      logger.error('Direct transaction creation failed', 'DIRECT_PAYMENT', { 
        error: transactionError.message 
      });
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }

    logger.info('Direct transaction created', 'DIRECT_PAYMENT', { 
      transactionId: transaction.id, 
      amount: amountStr 
    });

    // Ensure supporter record exists
    await upsertSupporter(supporterId, creatorId, validation.validatedAmount, tierLevel);

    // Sync supporter to Stream Chat channels directly
    try {
      // Get supporter's user info
      const { data: supporterUser } = await supabase
        .from('users')
        .select('id, display_name, photo_url')
        .eq('id', supporterId)
        .single();

      if (supporterUser) {
        // Ensure supporter exists in Stream
        await upsertStreamUser(supporterUser.id, supporterUser.display_name, supporterUser.photo_url);

        // Get all channels the supporter should have access to
        const { data: channels } = await supabase
          .from('channels')
          .select('id, name, stream_channel_id')
          .eq('creator_id', creatorId)
          .lte('min_tier_required', tierLevel);

        const addedToChannels = [];
        for (const channel of channels || []) {
          if (!channel.stream_channel_id) continue;

          try {
            const streamChannel = serverStreamClient.channel('messaging', channel.stream_channel_id);
            await streamChannel.query({});
            await streamChannel.addMembers([supporterId]);
            addedToChannels.push(channel.name);

            // Send system message that user has joined
            await streamChannel.sendMessage({
              text: `${supporterUser.display_name} has joined the channel`,
              user_id: supporterId,
              type: 'system',
            });
          } catch (err) {
            logger.warn('Failed to add supporter to channel', 'DIRECT_PAYMENT', {
              channelId: channel.id,
              error: err instanceof Error ? err.message : 'Unknown'
            });
          }
        }

        logger.info('Supporter synced to Stream channels', 'DIRECT_PAYMENT', {
          supporterId,
          creatorId,
          tierLevel,
          addedToChannels: addedToChannels.length
        });
      }
    } catch (streamError) {
      logger.warn('Failed to sync supporter to Stream', 'DIRECT_PAYMENT', {
        error: streamError instanceof Error ? streamError.message : 'Unknown',
      });
    }

    // Update supporters_count in creator_profiles
    await updateSupporterCount(creatorId);

    logger.info('Direct payment completed successfully', 'DIRECT_PAYMENT', {
      transactionId: transaction.id,
      creatorId,
      supporterId,
      amount: validation.validatedAmount
    });

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        transaction_uuid: transaction.transaction_uuid,
        created_at: transaction.created_at,
      },
      message: 'Support registered successfully'
    });
  } catch (error) {
    return handleApiError(error, 'DIRECT_PAYMENT', 'Direct payment failed');
  }
}
