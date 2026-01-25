"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Hash, Users, Settings, Phone, Video, MoreVertical, Smile } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageInput } from "@/components/atoms/inputs/MessageInput";
import { AvatarGroup } from "@/components/atoms/avatars/AvatarGroup";
import { MessageList } from "./MessageList";
import { fadeInUp } from "@/components/animations/variants";

interface Message {
  id: string;
  content: string;
  user_id: string;
  user: {
    id: string;
    display_name: string;
    photo_url?: string | null;
  };
  created_at: string;
  status?: "sending" | "sent" | "delivered" | "read";
  reactions?: Array<{ emoji: string; count: number }>;
}

interface ChatPanelProps {
  channelId: string;
  channelName: string;
  channelType?: "text" | "voice" | "private";
  messages: Message[];
  members?: Array<{
    id: string;
    name: string;
    avatar?: string | null;
  }>;
  currentUserId: string;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  isSending?: boolean;
  typingUsers?: Array<{
    id: string;
    name: string;
    avatar?: string | null;
  }>;
  onSendMessage: (content: string) => void;
  onLoadMore?: () => void;
  onReact?: (messageId: string, emoji: string) => void;
  onSettingsClick?: () => void;
  className?: string;
}

export function ChatPanel({
  channelId,
  channelName,
  channelType = "text",
  messages,
  members = [],
  currentUserId,
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  isSending = false,
  typingUsers = [],
  onSendMessage,
  onLoadMore,
  onReact,
  onSettingsClick,
  className,
}: ChatPanelProps) {
  const [messageText, setMessageText] = React.useState("");

  const handleSend = () => {
    if (!messageText.trim()) return;
    onSendMessage(messageText);
    setMessageText("");
  };

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className={cn("flex flex-col h-full bg-background", className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">{channelName}</h2>
          </div>

          {members.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{members.length} members</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Member avatars */}
          {members.length > 0 && (
            <div className="hidden md:block mr-2">
              <AvatarGroup
                users={members.map((m) => ({
                  src: m.avatar,
                  alt: m.name,
                  fallback: m.name,
                }))}
                max={3}
                size="xs"
              />
            </div>
          )}

          {/* Action buttons */}
          <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:flex">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:flex">
            <Video className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onSettingsClick}>
                <Settings className="h-4 w-4 mr-2" />
                Channel settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Users className="h-4 w-4 mr-2" />
                View members
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        typingUsers={typingUsers}
        onLoadMore={onLoadMore}
        onReact={onReact}
        className="flex-1"
      />

      {/* Message input */}
      <div className="p-4 border-t bg-card/30">
        <MessageInput
          value={messageText}
          onChange={setMessageText}
          onSend={handleSend}
          isSending={isSending}
          placeholder={`Message #${channelName}`}
          showEmoji
        />
      </div>
    </motion.div>
  );
}
