"use client";

import React, { useState, useCallback } from 'react';
import { Video, X, Mic, MicOff, VideoOff, PhoneOff, Users, Loader2 } from 'lucide-react';
import { useStreamChat } from '@/contexts/stream-chat-context';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

interface VideoCallButtonProps {
  channelId: string;
}

export function VideoCallButton({ channelId }: VideoCallButtonProps) {
  const { chatClient, streamUser } = useStreamChat();
  const { toast } = useToast();
  const [isCallActive, setIsCallActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCall = useCallback(async () => {
    if (!chatClient || !streamUser) {
      setError('Not connected to chat');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setIsCallActive(true);
      logger.info('Video call initiated', 'VIDEO_CALL_BUTTON', { channelId });
    } catch (err) {
      logger.error('Failed to start video call', 'VIDEO_CALL_BUTTON', { channelId, error: err instanceof Error ? err.message : String(err) });
      setError(err instanceof Error ? err.message : 'Failed to start call');
      toast({ title: 'Failed to start call', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [chatClient, streamUser, channelId]);

  const endCall = useCallback(() => {
    setIsCallActive(false);
    setIsMuted(false);
    setIsVideoOff(false);
  }, []);

  if (isLoading) {
    return (
      <button
        className="p-2 rounded-lg bg-gray-100 text-gray-400 cursor-wait"
        disabled
      >
        <Loader2 className="h-5 w-5 animate-spin" />
      </button>
    );
  }

  return (
    <>
      <button
        onClick={startCall}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-purple-600"
        title="Start Video Call"
      >
        <Video className="h-5 w-5" />
      </button>

      {/* Video Call Modal */}
      {isCallActive && (
        <VideoCallModal
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          onToggleMute={() => setIsMuted(!isMuted)}
          onToggleVideo={() => setIsVideoOff(!isVideoOff)}
          onEndCall={endCall}
        />
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50">
          <p className="text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="absolute top-1 right-1 text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}

// Video Call Modal Component
interface VideoCallModalProps {
  isMuted: boolean;
  isVideoOff: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
}

function VideoCallModal({
  isMuted,
  isVideoOff,
  onToggleMute,
  onToggleVideo,
  onEndCall,
}: VideoCallModalProps) {
  const [participants] = useState(1);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <span>{participants} participant{participants !== 1 ? 's' : ''}</span>
        </div>
        <button
          onClick={onEndCall}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Video Grid Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <div className="w-32 h-32 rounded-full bg-purple-600 flex items-center justify-center mx-auto mb-4">
            {isVideoOff ? (
              <VideoOff className="h-16 w-16" />
            ) : (
              <Video className="h-16 w-16" />
            )}
          </div>
          <h3 className="text-xl font-semibold mb-2">Video Call Active</h3>
          <p className="text-gray-400">
            Full video calling with Stream Video SDK
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Configure STREAM_API_KEY and STREAM_API_SECRET to enable video features
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 flex items-center justify-center gap-4">
        {/* Mute Button */}
        <button
          onClick={onToggleMute}
          className={`p-4 rounded-full transition-colors ${
            isMuted
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </button>

        {/* Toggle Video Button */}
        <button
          onClick={onToggleVideo}
          className={`p-4 rounded-full transition-colors ${
            isVideoOff
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
        >
          {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
        </button>

        {/* End Call Button */}
        <button
          onClick={onEndCall}
          className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
          title="End Call"
        >
          <PhoneOff className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}

export default VideoCallButton;
