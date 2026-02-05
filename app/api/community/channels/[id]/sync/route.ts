import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-utils';
import { syncChannelToStream } from '@/lib/stream-channel-engine';

export const dynamic = 'force-dynamic';

/**
 * POST /api/community/channels/[id]/sync
 * Syncs a single channel from Supabase to Stream Chat
 * This endpoint wraps the syncChannelToStream function for HTTP access
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await syncChannelToStream(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to sync channel' },
        { status: result.error === 'Channel not found' || result.error === 'Creator not found' ? 404 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      channelId: id,
      streamChannelId: result.streamChannelId,
      memberCount: result.memberCount
    });
  } catch (error) {
    return handleApiError(error, 'SYNC_CHANNEL', 'Failed to sync channel');
  }
}
