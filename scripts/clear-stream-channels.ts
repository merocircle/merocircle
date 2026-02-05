/**
 * Script to clear all channels from Stream Chat dashboard
 * 
 * Usage:
 *   npx tsx scripts/clear-stream-channels.ts
 * 
 * This script will:
 * 1. Connect to Stream Chat
 * 2. Query all channels
 * 3. Delete all channels
 * 4. Report the results
 */

// Load environment variables from .env.local
// Try to load dotenv if available, otherwise use Node's built-in fs
let envLoaded = false;
try {
  // Try using dotenv package if installed
  const dotenv = require('dotenv');
  const { resolve } = require('path');
  dotenv.config({ path: resolve(process.cwd(), '.env.local') });
  envLoaded = true;
} catch (e) {
  // If dotenv is not available, try to manually load .env.local
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envFile = fs.readFileSync(envPath, 'utf8');
      envFile.split('\n').forEach((line: string) => {
        const match = line.match(/^([^=:#]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
      envLoaded = true;
    }
  } catch (err) {
    console.warn('Could not load .env.local automatically. Make sure environment variables are set.');
  }
}

import { StreamChat } from 'stream-chat';
import { logger } from '../lib/logger';

// Initialize Stream Chat client
// Check for environment variables
const streamApiKey = process.env.STREAM_API_KEY;
const streamApiSecret = process.env.STREAM_API_SECRET;

if (!streamApiKey) {
  console.error('❌ Missing STREAM_API_KEY environment variable');
  console.error('   Make sure .env.local exists in the project root and contains:');
  console.error('   STREAM_API_KEY=your_api_key');
  console.error('   STREAM_API_SECRET=your_api_secret');
  throw new Error('Missing STREAM_API_KEY environment variable');
}

if (!streamApiSecret) {
  console.error('❌ Missing STREAM_API_SECRET environment variable');
  console.error('   Make sure .env.local exists in the project root and contains:');
  console.error('   STREAM_API_KEY=your_api_key');
  console.error('   STREAM_API_SECRET=your_api_secret');
  throw new Error('Missing STREAM_API_SECRET environment variable');
}

if (envLoaded) {
  console.log('✅ Loaded environment variables from .env.local\n');
}

const streamClient = StreamChat.getInstance(
  streamApiKey,
  streamApiSecret
);

interface ChannelInfo {
  id: string;
  type: string;
  name?: string;
  memberCount?: number;
}

/**
 * Get all channels from Stream Chat
 * Note: Stream Chat doesn't have a direct "list all channels" API.
 * We'll query channels by type and try to get as many as possible.
 */
async function getAllChannels(): Promise<ChannelInfo[]> {
  const channels: ChannelInfo[] = [];

  try {
    // Stream Chat queryChannels requires at least one filter
    // We'll query for messaging channels (which is what we use)
    // Note: This may not get ALL channels, but will get most of them
    
    // Query messaging channels (our main channel type)
    const messagingChannels = await streamClient.queryChannels(
      { type: 'messaging' }, // Filter by messaging type
      { last_message_at: -1 }, // Sort by most recent
      {
        limit: 100, // Maximum per page
      }
    );

    // Extract channel information
    for (const channel of messagingChannels) {
      const state = channel.state;
      channels.push({
        id: channel.id || '',
        type: channel.type || 'messaging',
        name: (state as any)?.name || (state as any)?.data?.name || undefined,
        memberCount: state?.members ? Object.keys(state.members).length : 0,
      });
    }

    // Note: If you have other channel types, query them separately
    // For example: livestream, team, etc.

    return channels;
  } catch (error) {
    logger.error('Failed to query channels', 'CLEAR_STREAM_CHANNELS', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Delete a single channel
 */
async function deleteChannel(channelId: string, channelType: string = 'messaging'): Promise<boolean> {
  try {
    const channel = streamClient.channel(channelType, channelId);
    
    // Delete the channel
    await channel.delete();
    
    return true;
  } catch (error) {
    logger.error('Failed to delete channel', 'CLEAR_STREAM_CHANNELS', {
      error: error instanceof Error ? error.message : 'Unknown error',
      channelId,
      channelType,
    });
    return false;
  }
}

/**
 * Main function to clear all Stream Chat channels
 */
async function clearAllStreamChannels(): Promise<void> {
  console.log('🚀 Starting Stream Chat channel cleanup...\n');

  try {
    // Step 1: Get all channels
    console.log('📋 Fetching all channels from Stream Chat...');
    const channels = await getAllChannels();
    console.log(`✅ Found ${channels.length} channels\n`);

    if (channels.length === 0) {
      console.log('✨ No channels to delete. Stream Chat is already clean!\n');
      return;
    }

    // Step 2: Display channels to be deleted
    console.log('📊 Channels to be deleted:');
    channels.forEach((channel, index) => {
      console.log(
        `  ${index + 1}. ${channel.name || channel.id} (ID: ${channel.id}, Type: ${channel.type}, Members: ${channel.memberCount || 0})`
      );
    });
    console.log('');

    // Step 3: Delete all channels
    console.log('🗑️  Deleting channels...');
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ channelId: string; error: string }>,
    };

    for (const channel of channels) {
      const success = await deleteChannel(channel.id, channel.type);
      if (success) {
        results.success++;
        console.log(`  ✅ Deleted: ${channel.name || channel.id}`);
      } else {
        results.failed++;
        results.errors.push({
          channelId: channel.id,
          error: 'Delete failed',
        });
        console.log(`  ❌ Failed: ${channel.name || channel.id}`);
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Step 4: Report results
    console.log('\n📈 Results:');
    console.log(`  ✅ Successfully deleted: ${results.success}`);
    console.log(`  ❌ Failed to delete: ${results.failed}`);

    if (results.errors.length > 0) {
      console.log('\n❌ Errors:');
      results.errors.forEach((error) => {
        console.log(`  - Channel ${error.channelId}: ${error.error}`);
      });
    }

    console.log('\n✨ Stream Chat channel cleanup completed!\n');
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    logger.error('Stream Chat channel cleanup failed', 'CLEAR_STREAM_CHANNELS', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  } finally {
    // Disconnect from Stream Chat
    await streamClient.disconnect();
  }
}

// Run the script
if (require.main === module) {
  clearAllStreamChannels()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { clearAllStreamChannels, getAllChannels, deleteChannel };
