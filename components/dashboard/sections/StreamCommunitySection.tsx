'use client';

import { memo } from 'react';
import { StreamChatWrapper } from '@/components/stream-chat/StreamChatWrapper';
import { AlertTriangle } from 'lucide-react';

/**
 * Stream Chat powered Community Section
 *
 * This component replaces the custom Supabase-based CommunitySection with
 * Stream Chat SDK for better real-time performance, built-in features like
 * reactions, threads, and video calling.
 *
 * Features:
 * - Discord-like server structure with "My Channels" and "My Server" sections
 * - Creators can create custom channels with tier requirements
 * - Supporters are auto-added to channels based on their tier level
 */
const StreamCommunitySection = memo(function StreamCommunitySection() {
  // Show warning if Stream is not configured
  if (!process.env.NEXT_PUBLIC_STREAM_API_KEY) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
          <AlertTriangle className="h-8 w-8 text-amber-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Stream Chat Not Configured</h3>
        <p className="text-muted-foreground max-w-md mb-4">
          Stream Chat SDK requires API keys to be configured. Please add STREAM_API_KEY,
          STREAM_API_SECRET, and NEXT_PUBLIC_STREAM_API_KEY to your .env.local file.
        </p>
        <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg text-left font-mono">
          <p># .env.local</p>
          <p>STREAM_API_KEY=your_key</p>
          <p>STREAM_API_SECRET=your_secret</p>
          <p>NEXT_PUBLIC_STREAM_API_KEY=your_key</p>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Get your keys at <a href="https://getstream.io/dashboard/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">getstream.io/dashboard</a>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Stream Chat Wrapper with full Discord-like UI */}
      <div className="flex-1 min-h-0">
        <StreamChatWrapper className="h-full" />
      </div>
    </div>
  );
});

export default StreamCommunitySection;
