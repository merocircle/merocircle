import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateAmount, validateUUID, sanitizeString } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { serverStreamClient, upsertStreamUser } from '@/lib/stream-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, creatorId, supporterId, supporterMessage, tier_level } = body;

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
    const transactionUuid = `DIRECT-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const amountStr = amountValidation.value!.toString();
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
    const transactionAmount = Number(amountStr);

    const { data: existingSupporter } = await supabase
      .from('supporters')
      .select('id')
      .eq('supporter_id', supporterId)
      .eq('creator_id', creatorId)
      .single();

    if (!existingSupporter) {
      await supabase
        .from('supporters')
        .insert({
          supporter_id: supporterId,
          creator_id: creatorId,
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
    const { data: countResult } = await supabase
      .from('supporters')
      .select('supporter_id')
      .eq('creator_id', creatorId)
      .eq('is_active', true);

    if (countResult) {
      const uniqueSupporters = new Set(countResult.map(r => r.supporter_id)).size;
      await supabase
        .from('creator_profiles')
        .update({ supporters_count: uniqueSupporters })
        .eq('user_id', creatorId);

      logger.info('Updated supporter count', 'DIRECT_PAYMENT', {
        creatorId,
        supportersCount: uniqueSupporters
      });
    }

    logger.info('Direct payment completed successfully', 'DIRECT_PAYMENT', {
      transactionId: transaction.id,
      creatorId,
      supporterId,
      amount: transactionAmount
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
    logger.error('Direct payment failed', 'DIRECT_PAYMENT', {
      error: error instanceof Error ? error.message : 'Unknown'
    });
    return NextResponse.json(
      { error: 'Direct payment failed' },
      { status: 500 }
    );
  }
}
