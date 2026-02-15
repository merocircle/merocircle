"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Channel as StreamChannel, UserResponse, OwnUserResponse } from 'stream-chat';
import { useSession } from 'next-auth/react';
import { useAuth } from './auth-context';

// Stream Chat client type — use `any` at runtime to avoid importing the heavy module at top level
type StreamChatClient = any;

interface StreamChatContextType {
  chatClient: StreamChatClient | null;
  streamUser: UserResponse | OwnUserResponse | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
  reconnect: () => Promise<void>;
}

const StreamChatContext = createContext<StreamChatContextType | undefined>(undefined);

// Get API key from environment
const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;

export function StreamChatProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { userProfile, isAuthenticated, loading: authLoading } = useAuth();
  const [chatClient, setChatClient] = useState<StreamChatClient | null>(null);
  const [streamUser, setStreamUser] = useState<UserResponse | OwnUserResponse | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to connect to Stream
  const connectToStream = useCallback(async () => {
    if (!apiKey) {
      console.warn('Stream API key not configured');
      return;
    }

    if (!session?.user || !userProfile) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Fetch token from our API
      const response = await fetch('/api/stream/token');

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to get Stream token');
      }

      const { token, userId, userName, userImage } = await response.json();

      // Dynamically import the heavy stream-chat SDK only when needed
      const { StreamChat } = await import('stream-chat');
      // Create or get Stream client instance
      const client = StreamChat.getInstance(apiKey);

      // Disconnect existing connection if any
      if (client.userID) {
        await client.disconnectUser();
      }

      // Connect user to Stream
      await client.connectUser(
        {
          id: userId,
          name: userName,
          image: userImage || undefined,
        },
        token
      );

      setChatClient(client);
      setStreamUser(client.user || null);
      setIsConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to chat');
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, [session?.user, userProfile]);

  // Function to disconnect from Stream
  const disconnectFromStream = useCallback(async () => {
    if (chatClient) {
      await chatClient.disconnectUser().catch(() => {});
      setChatClient(null);
      setStreamUser(null);
      setIsConnected(false);
    }
  }, [chatClient]);

  // Connect when authenticated
  useEffect(() => {
    if (status !== 'loading' && !authLoading && isAuthenticated && !isConnected && !isConnecting) {
      connectToStream();
    }
  }, [status, authLoading, isAuthenticated, isConnected, isConnecting, connectToStream]);

  // Disconnect when user signs out
  useEffect(() => {
    if (!isAuthenticated && isConnected) {
      disconnectFromStream();
    }
  }, [isAuthenticated, isConnected, disconnectFromStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chatClient) {
        chatClient.disconnectUser().catch(console.error);
      }
    };
  }, [chatClient]);

  const value: StreamChatContextType = {
    chatClient,
    streamUser,
    isConnecting,
    isConnected,
    error,
    reconnect: connectToStream,
  };

  return (
    <StreamChatContext.Provider value={value}>
      {children}
    </StreamChatContext.Provider>
  );
}

export function useStreamChat() {
  const context = useContext(StreamChatContext);
  if (context === undefined) {
    throw new Error('useStreamChat must be used within a StreamChatProvider');
  }
  return context;
}

// Hook to get a specific channel
export function useStreamChannel(channelId: string | null) {
  const { chatClient } = useStreamChat();
  const [channel, setChannel] = useState<StreamChannel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chatClient || !channelId) {
      setChannel(null);
      return;
    }

    const initChannel = async () => {
      setLoading(true);
      setError(null);

      try {
        const ch = chatClient.channel('messaging', channelId);
        await ch.watch();
        setChannel(ch);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load channel');
      } finally {
        setLoading(false);
      }
    };

    initChannel();

    return () => {
      if (channel) {
        channel.stopWatching().catch(() => {});
      }
    };
  }, [chatClient, channelId]);

  return { channel, loading, error };
}
