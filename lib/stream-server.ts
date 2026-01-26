import { StreamChat } from 'stream-chat';

if (!process.env.STREAM_API_KEY) {
  throw new Error('Missing STREAM_API_KEY environment variable');
}

if (!process.env.STREAM_API_SECRET) {
  throw new Error('Missing STREAM_API_SECRET environment variable');
}

// Server-side Stream Chat client instance
export const serverStreamClient = StreamChat.getInstance(
  process.env.STREAM_API_KEY,
  process.env.STREAM_API_SECRET
);

// Generate a short channel ID (max 64 chars for Stream)
export function generateStreamChannelId(creatorId: string, channelId: string): string {
  const shortCreatorId = creatorId.replace(/-/g, '').substring(0, 12);
  const shortChannelId = channelId.replace(/-/g, '').substring(0, 12);
  return `ch_${shortCreatorId}_${shortChannelId}`;
}

// Generate a user token for client-side authentication
export function generateStreamToken(userId: string): string {
  return serverStreamClient.createToken(userId);
}

// Upsert a user in Stream Chat
export async function upsertStreamUser(
  userId: string,
  name: string,
  image?: string | null
): Promise<void> {
  await serverStreamClient.upsertUser({
    id: userId,
    name,
    image: image || undefined,
  });
}

// Add members to a Stream channel
export async function addMembersToStreamChannel(
  streamChannelId: string,
  memberIds: string[]
): Promise<void> {
  if (memberIds.length === 0) return;
  const channel = serverStreamClient.channel('messaging', streamChannelId);
  await channel.addMembers(memberIds);
}

// Remove a member from a Stream channel
export async function removeMemberFromStreamChannel(
  streamChannelId: string,
  userId: string
): Promise<void> {
  const channel = serverStreamClient.channel('messaging', streamChannelId);
  await channel.removeMembers([userId]);
}
