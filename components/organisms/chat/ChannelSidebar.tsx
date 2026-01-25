"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Settings, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/atoms/inputs/SearchInput";
import { ChannelItem, ChannelCategory } from "@/components/molecules/lists/ChannelItem";
import { staggerContainer, fadeInUp } from "@/components/animations/variants";

interface Channel {
  id: string;
  name: string;
  type?: "text" | "voice" | "private";
  category?: string;
  unread_count?: number;
  is_muted?: boolean;
}

interface ChannelSidebarProps {
  channels: Channel[];
  activeChannelId?: string;
  onChannelSelect: (channelId: string) => void;
  onCreateChannel?: () => void;
  onSettingsClick?: (channelId: string) => void;
  showSearch?: boolean;
  showCreateButton?: boolean;
  title?: string;
  className?: string;
}

export function ChannelSidebar({
  channels,
  activeChannelId,
  onChannelSelect,
  onCreateChannel,
  onSettingsClick,
  showSearch = true,
  showCreateButton = true,
  title = "Channels",
  className,
}: ChannelSidebarProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  // Group channels by category
  const groupedChannels = React.useMemo(() => {
    const filtered = channels.filter((channel) =>
      channel.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groups: Record<string, Channel[]> = {};

    filtered.forEach((channel) => {
      const category = channel.category || "General";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(channel);
    });

    return groups;
  }, [channels, searchQuery]);

  const categoryOrder = ["General", "Supporters", "Premium", "Custom"];

  return (
    <div
      className={cn(
        "flex flex-col h-full w-60 border-r bg-card/50",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold">{title}</h2>
        {showCreateButton && onCreateChannel && (
          <motion.button
            onClick={onCreateChannel}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Plus className="h-4 w-4" />
          </motion.button>
        )}
      </div>

      {/* Search */}
      {showSearch && (
        <div className="p-3 border-b">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search channels..."
            size="sm"
          />
        </div>
      )}

      {/* Channels list */}
      <div className="flex-1 overflow-y-auto p-2">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {categoryOrder
            .filter((cat) => groupedChannels[cat]?.length > 0)
            .map((category) => (
              <motion.div key={category} variants={fadeInUp}>
                <ChannelCategory
                  name={category}
                  channels={groupedChannels[category].map((channel) => ({
                    id: channel.id,
                    name: channel.name,
                    type: channel.type || "text",
                    unreadCount: channel.unread_count,
                    isActive: channel.id === activeChannelId,
                    isMuted: channel.is_muted,
                    onClick: () => onChannelSelect(channel.id),
                    onSettingsClick: onSettingsClick
                      ? () => onSettingsClick(channel.id)
                      : undefined,
                  }))}
                />
              </motion.div>
            ))}

          {/* Handle uncategorized or other categories */}
          {Object.entries(groupedChannels)
            .filter(([cat]) => !categoryOrder.includes(cat))
            .map(([category, categoryChannels]) => (
              <motion.div key={category} variants={fadeInUp}>
                <ChannelCategory
                  name={category}
                  channels={categoryChannels.map((channel) => ({
                    id: channel.id,
                    name: channel.name,
                    type: channel.type || "text",
                    unreadCount: channel.unread_count,
                    isActive: channel.id === activeChannelId,
                    isMuted: channel.is_muted,
                    onClick: () => onChannelSelect(channel.id),
                    onSettingsClick: onSettingsClick
                      ? () => onSettingsClick(channel.id)
                      : undefined,
                  }))}
                />
              </motion.div>
            ))}
        </motion.div>

        {/* Empty state */}
        {channels.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-8 px-4 text-center"
          >
            <div className="p-3 rounded-full bg-muted mb-3">
              <Hash className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No channels yet</p>
            {showCreateButton && onCreateChannel && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCreateChannel}
                className="mt-3"
              >
                <Plus className="h-4 w-4 mr-1" />
                Create channel
              </Button>
            )}
          </motion.div>
        )}

        {/* No search results */}
        {channels.length > 0 &&
          Object.keys(groupedChannels).length === 0 &&
          searchQuery && (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No channels match &quot;{searchQuery}&quot;
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
