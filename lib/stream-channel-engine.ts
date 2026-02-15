import { createClient } from '@/lib/supabase/server';
import { serverStreamClient, upsertStreamUser, generateStreamChannelId } from '@/lib/stream-server';
import { logger } from '@/lib/logger';

/**
 * Parameters for creating a Stream channel
 */
export interface CreateStreamChannelParams {
  /** Supabase channel ID */
  channelId: string;
  /** Creator ID who owns the channel */
  creatorId: string;
  /** Channel name */
  name: string;
  /** Channel category */
  category?: string;
  /** Minimum tier required */
  minTierRequired?: number;
  /** Whether to sync members from Supabase (default: true) */
  syncMembers?: boolean;
  /** Force re-sync even if channel already exists (default: false) */
  force?: boolean;
}

/**
 * Result of creating a Stream channel
 */
export interface CreateStreamChannelResult {
  success: boolean;
  streamChannelId?: string;
  memberCount?: number;
  error?: string;
}

/**
 * Parameters for syncing a channel to Stream
 */
export interface SyncChannelToStreamParams {
  /** Supabase channel ID */
  channelId: string;
  /** Whether to force re-sync even if already synced (default: false) */
  force?: boolean;
}

/**
 * Result of syncing a channel
 */
export interface SyncChannelToStreamResult {
  success: boolean;
  streamChannelId?: string;
  memberCount?: number;
  error?: string;
}

/**
 * Parameters for adding a member to a channel
 */
export interface AddMemberToChannelParams {
  /** Supabase channel ID */
  channelId: string;
  /** User ID to add */
  userId: string;
  /** Whether to send a system message (default: false) */
  sendSystemMessage?: boolean;
  /** System message text (if sendSystemMessage is true) */
  systemMessageText?: string;
}

/**
 * Result of adding a member
 */
export interface AddMemberToChannelResult {
  success: boolean;
  error?: string;
}

/**
 * Parameters for removing a member from a channel
 */
export interface RemoveMemberFromChannelParams {
  /** Supabase channel ID */
  channelId: string;
  /** User ID to remove */
  userId: string;
}

/**
 * Result of removing a member
 */
export interface RemoveMemberFromChannelResult {
  success: boolean;
  error?: string;
}

/**
 * Parameters for syncing a supporter to channels
 */
export interface SyncSupporterToChannelsParams {
  /** Supporter user ID */
  supporterId: string;
  /** Creator ID */
  creatorId: string;
  /** Tier level of the supporter */
  tierLevel: number;
  /** Whether to send system messages (default: false) */
  sendSystemMessages?: boolean;
}

/**
 * Result of syncing supporter to channels
 */
export interface SyncSupporterToChannelsResult {
  success: boolean;
  addedToChannels: Array<{ id: string; name: string; streamChannelId: string }>;
  error?: string;
}

/**
 * Unified Stream Channel Management Engine
 * 
 * This is the single source of truth for all Stream Chat channel operations.
 * Handles channel creation, syncing, member management, and supporter synchronization.
 */

/**
 * Creates a Stream channel from a Supabase channel
 * 
 * @param params - Channel creation parameters
 * @returns Result indicating success or failure
 */
export async function createStreamChannel(
  params: CreateStreamChannelParams
): Promise<CreateStreamChannelResult> {
  try {
    const {
      channelId,
      creatorId,
      name,
      category = 'custom',
      minTierRequired = 1,
      syncMembers = true,
    } = params;

    const supabase = await createClient();

    // Get channel from Supabase
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .select('*')
      .eq('id', channelId)
      .single();

    if (channelError || !channel) {
      logger.error('Channel not found', 'STREAM_CHANNEL_ENGINE', {
        channelId,
        error: channelError?.message,
      });
      return { success: false, error: 'Channel not found' };
    }

    // Check if already synced
    if (channel.stream_channel_id && !params.force) {
      logger.debug('Channel already synced to Stream', 'STREAM_CHANNEL_ENGINE', {
        channelId,
        streamChannelId: channel.stream_channel_id,
      });
      return {
        success: true,
        streamChannelId: channel.stream_channel_id,
        memberCount: 0,
      };
    }

    // Get creator info
    const { data: creatorUser, error: creatorError } = await supabase
      .from('users')
      .select('id, display_name, photo_url')
      .eq('id', creatorId)
      .single();

    if (creatorError || !creatorUser) {
      logger.error('Creator not found', 'STREAM_CHANNEL_ENGINE', {
        channelId,
        creatorId,
        error: creatorError?.message,
      });
      return { success: false, error: 'Creator not found' };
    }

    // Ensure creator exists in Stream
    await upsertStreamUser(creatorUser.id, creatorUser.display_name, creatorUser.photo_url);

    // Generate Stream channel ID
    const streamChannelId = generateStreamChannelId(creatorId, channelId);

    // Get members if syncing
    let memberIds: string[] = [];
    if (syncMembers) {
      const { data: members, error: membersError } = await supabase
        .from('channel_members')
        .select('user_id')
        .eq('channel_id', channelId);

      if (membersError) {
        logger.warn('Failed to fetch channel members', 'STREAM_CHANNEL_ENGINE', {
          error: membersError.message,
          channelId,
        });
      } else {
        memberIds = (members || []).map((m) => m.user_id);
      }

      // Ensure all members exist in Stream
      for (const memberId of memberIds) {
        const { data: memberUser } = await supabase
          .from('users')
          .select('id, display_name, photo_url')
          .eq('id', memberId)
          .single();

        if (memberUser) {
          await upsertStreamUser(memberUser.id, memberUser.display_name, memberUser.photo_url);
        }
      }
    }

    // Create or update Stream channel
    const streamChannel = serverStreamClient.channel('messaging', streamChannelId, {
      name: name || channel.name,
      created_by_id: creatorId,
      category: category || channel.category || 'custom',
      min_tier_required: minTierRequired || channel.min_tier_required || 1,
      supabase_channel_id: channelId,
      creator_name: creatorUser.display_name,
    } as any);

    // Check if channel already exists
    try {
      await streamChannel.query({});
      // Channel exists, just update members
      if (memberIds.length > 0) {
        await streamChannel.addMembers(memberIds);
      }
    } catch {
      // Channel doesn't exist, create it
      await streamChannel.create();
      if (memberIds.length > 0) {
        await streamChannel.addMembers(memberIds);
      }
    }

    // Update Supabase with Stream channel ID
    const { error: updateError } = await supabase
      .from('channels')
      .update({ stream_channel_id: streamChannelId })
      .eq('id', channelId);

    if (updateError) {
      logger.warn('Failed to update channel with Stream ID', 'STREAM_CHANNEL_ENGINE', {
        error: updateError.message,
        channelId,
        streamChannelId,
      });
    }

    logger.info('Stream channel created successfully', 'STREAM_CHANNEL_ENGINE', {
      channelId,
      streamChannelId,
      memberCount: memberIds.length,
    });

    return {
      success: true,
      streamChannelId,
      memberCount: memberIds.length,
    };
  } catch (error) {
    logger.error('Failed to create Stream channel', 'STREAM_CHANNEL_ENGINE', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      channelId: params.channelId,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Syncs a Supabase channel to Stream Chat
 * This is a wrapper around createStreamChannel for backward compatibility
 * 
 * @param params - Sync parameters
 * @returns Result indicating success or failure
 */
export async function syncChannelToStream(
  params: SyncChannelToStreamParams | string
): Promise<SyncChannelToStreamResult> {
  try {
    // Handle both string (channelId) and object (params) for backward compatibility
    const channelId = typeof params === 'string' ? params : params.channelId;
    const force = typeof params === 'object' ? params.force : false;

    const supabase = await createClient();

    // Get channel from Supabase
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .select('*')
      .eq('id', channelId)
      .single();

    if (channelError || !channel) {
      logger.error('Channel not found', 'STREAM_CHANNEL_ENGINE', {
        channelId,
        error: channelError?.message,
      });
      return { success: false, error: 'Channel not found' };
    }

    // If already synced and not forcing, return existing
    if (channel.stream_channel_id && !force) {
      return {
        success: true,
        streamChannelId: channel.stream_channel_id,
        memberCount: 0,
      };
    }

    // Use createStreamChannel to do the actual work
    const result = await createStreamChannel({
      channelId,
      creatorId: channel.creator_id,
      name: channel.name,
      category: channel.category || 'custom',
      minTierRequired: channel.min_tier_required || 1,
      syncMembers: true,
    });

    return result;
  } catch (error) {
    logger.error('Failed to sync channel to Stream', 'STREAM_CHANNEL_ENGINE', {
      error: error instanceof Error ? error.message : 'Unknown error',
      channelId: typeof params === 'string' ? params : params.channelId,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Adds a member to a Stream channel
 * 
 * @param params - Add member parameters
 * @returns Result indicating success or failure
 */
export async function addMemberToChannel(
  params: AddMemberToChannelParams
): Promise<AddMemberToChannelResult> {
  try {
    const {
      channelId,
      userId,
      sendSystemMessage = false,
      systemMessageText,
    } = params;

    const supabase = await createClient();

    // Get channel
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .select('stream_channel_id')
      .eq('id', channelId)
      .single();

    if (channelError || !channel) {
      logger.error('Channel not found', 'STREAM_CHANNEL_ENGINE', {
        channelId,
        error: channelError?.message,
      });
      return { success: false, error: 'Channel not found' };
    }

    if (!channel.stream_channel_id) {
      logger.error('Channel not synced to Stream', 'STREAM_CHANNEL_ENGINE', {
        channelId,
      });
      return { success: false, error: 'Channel not synced to Stream' };
    }

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, display_name, photo_url')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      logger.error('User not found', 'STREAM_CHANNEL_ENGINE', {
        userId,
        error: userError?.message,
      });
      return { success: false, error: 'User not found' };
    }

    // Ensure user exists in Stream
    await upsertStreamUser(user.id, user.display_name, user.photo_url);

    // Add member to Stream channel
    const streamChannel = serverStreamClient.channel('messaging', channel.stream_channel_id);
    await streamChannel.query({}); // Ensure channel exists
    await streamChannel.addMembers([userId]);

    // Send system message if requested
    if (sendSystemMessage) {
      const messageText =
        systemMessageText || `${user.display_name} has joined the channel`;
      await streamChannel.sendMessage({
        text: messageText,
        user_id: userId,
        type: 'system',
      });
    }

    logger.info('Member added to Stream channel', 'STREAM_CHANNEL_ENGINE', {
      channelId,
      userId,
      streamChannelId: channel.stream_channel_id,
    });

    return { success: true };
  } catch (error) {
    logger.error('Failed to add member to channel', 'STREAM_CHANNEL_ENGINE', {
      error: error instanceof Error ? error.message : 'Unknown error',
      channelId: params.channelId,
      userId: params.userId,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Removes a member from a Stream channel
 * 
 * @param params - Remove member parameters
 * @returns Result indicating success or failure
 */
export async function removeMemberFromChannel(
  params: RemoveMemberFromChannelParams
): Promise<RemoveMemberFromChannelResult> {
  try {
    const { channelId, userId } = params;

    const supabase = await createClient();

    // Get channel
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .select('stream_channel_id')
      .eq('id', channelId)
      .single();

    if (channelError || !channel) {
      logger.error('Channel not found', 'STREAM_CHANNEL_ENGINE', {
        channelId,
        error: channelError?.message,
      });
      return { success: false, error: 'Channel not found' };
    }

    if (!channel.stream_channel_id) {
      logger.error('Channel not synced to Stream', 'STREAM_CHANNEL_ENGINE', {
        channelId,
      });
      return { success: false, error: 'Channel not synced to Stream' };
    }

    // Remove member from Stream channel
    const streamChannel = serverStreamClient.channel('messaging', channel.stream_channel_id);
    await streamChannel.query({}); // Ensure channel exists
    await streamChannel.removeMembers([userId]);

    logger.info('Member removed from Stream channel', 'STREAM_CHANNEL_ENGINE', {
      channelId,
      userId,
      streamChannelId: channel.stream_channel_id,
    });

    return { success: true };
  } catch (error) {
    logger.error('Failed to remove member from channel', 'STREAM_CHANNEL_ENGINE', {
      error: error instanceof Error ? error.message : 'Unknown error',
      channelId: params.channelId,
      userId: params.userId,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Syncs a supporter to all eligible channels based on their tier
 * 
 * @param params - Sync supporter parameters
 * @returns Result with list of channels added to
 */
export async function syncSupporterToChannels(
  params: SyncSupporterToChannelsParams
): Promise<SyncSupporterToChannelsResult> {
  try {
    const {
      supporterId,
      creatorId,
      tierLevel,
      sendSystemMessages = false,
    } = params;

    const supabase = await createClient();

    // Get supporter's and creator's user info in parallel
    const [supporterResult, creatorResult] = await Promise.all([
      supabase
        .from('users')
        .select('id, display_name, photo_url')
        .eq('id', supporterId)
        .single(),
      supabase
        .from('users')
        .select('id, display_name, photo_url')
        .eq('id', creatorId)
        .single(),
    ]);

    const supporterUser = supporterResult.data;
    const supporterError = supporterResult.error;
    const creatorUser = creatorResult.data;

    if (supporterError || !supporterUser) {
      logger.error('Supporter not found', 'STREAM_CHANNEL_ENGINE', {
        supporterId,
        error: supporterError?.message,
      });
      return {
        success: false,
        addedToChannels: [],
        error: 'Supporter not found',
      };
    }

    // Ensure supporter exists in Stream
    await upsertStreamUser(
      supporterUser.id,
      supporterUser.display_name,
      supporterUser.photo_url
    );

    // Get all channels the supporter should have access to based on their tier
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select('id, name, stream_channel_id, min_tier_required')
      .eq('creator_id', creatorId)
      .lte('min_tier_required', tierLevel || 1);

    if (channelsError) {
      logger.error('Failed to fetch channels', 'STREAM_CHANNEL_ENGINE', {
        error: channelsError.message,
        creatorId,
        tierLevel,
      });
      return {
        success: false,
        addedToChannels: [],
        error: 'Failed to fetch channels',
      };
    }

    const addedToChannels: Array<{ id: string; name: string; streamChannelId: string }> = [];

    for (const channel of channels || []) {
      let streamChannelId = channel.stream_channel_id;

      // If channel is not synced to Stream yet, sync it first
      if (!streamChannelId) {
        logger.info('Channel not synced to Stream yet, syncing now', 'STREAM_CHANNEL_ENGINE', {
          channelId: channel.id,
          name: channel.name,
        });

        // Sync the channel to Stream
        const syncResult = await syncChannelToStream({
          channelId: channel.id,
          force: false,
        });

        if (!syncResult.success || !syncResult.streamChannelId) {
          logger.error('Failed to sync channel to Stream', 'STREAM_CHANNEL_ENGINE', {
            channelId: channel.id,
            name: channel.name,
            error: syncResult.error,
          });
          continue; // Skip this channel if sync failed
        }

        streamChannelId = syncResult.streamChannelId;
        logger.info('Channel synced to Stream successfully', 'STREAM_CHANNEL_ENGINE', {
          channelId: channel.id,
          streamChannelId,
        });
      }

      try {
        // Add to Stream Chat only
        // Note: channel_members is handled by the subscription engine when supporter record is created/updated
        const streamChannel = serverStreamClient.channel('messaging', streamChannelId);

        // Query channel first to ensure it exists
        await streamChannel.query({});

        // Add the supporter as a member
        await streamChannel.addMembers([supporterId]);

        // Send system join message and automated welcome message
        if (sendSystemMessages) {
          // System announcement that the user joined
          await streamChannel.sendMessage({
            text: `${supporterUser.display_name || 'A new supporter'} has joined the circle!`,
            user_id: supporterId,
            type: 'system',
          });

          // Send automated welcome message from the creator
          try {
            await streamChannel.sendMessage({
              text: `Welcome to the circle, ${supporterUser.display_name || 'friend'}! Thank you for joining. Feel free to say hello and connect with everyone here.`,
              user_id: creatorId,
              custom: { is_welcome_message: true },
            });
          } catch (welcomeErr) {
            logger.warn('Failed to send welcome message', 'STREAM_CHANNEL_ENGINE', {
              error: welcomeErr instanceof Error ? welcomeErr.message : 'Unknown',
              supporterId,
              creatorId,
            });
          }
        }

        addedToChannels.push({
          id: channel.id,
          name: channel.name,
          streamChannelId,
        });

        logger.info('Supporter added to Stream channel', 'STREAM_CHANNEL_ENGINE', {
          supporterId,
          channelId: channel.id,
          streamChannelId,
        });
      } catch (err) {
        logger.error('Failed to add supporter to Stream channel', 'STREAM_CHANNEL_ENGINE', {
          supporterId,
          channelId: channel.id,
          streamChannelId,
          error: err instanceof Error ? err.message : 'Unknown',
        });
        // Continue with other channels even if one fails
      }
    }

    return {
      success: true,
      addedToChannels,
    };
  } catch (error) {
    logger.error('Failed to sync supporter to channels', 'STREAM_CHANNEL_ENGINE', {
      error: error instanceof Error ? error.message : 'Unknown error',
      supporterId: params.supporterId,
      creatorId: params.creatorId,
    });
    return {
      success: false,
      addedToChannels: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
