"use client";

import React, { useMemo, useState } from 'react';
import type { Channel as StreamChannelType } from 'stream-chat';
import { X, Image as ImageIcon, FileText, Users, Hash, Crown } from 'lucide-react';

interface ChannelInfoPanelProps {
  channel: StreamChannelType;
  onClose: () => void;
}

type Tab = 'members' | 'media' | 'files';

export function ChannelInfoPanel({ channel, onClose }: ChannelInfoPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('members');

  const channelData = channel.data as any;
  const channelName = channelData?.name || 'Channel';
  const channelImage = channelData?.image;
  const creatorId = channelData?.created_by?.id || channelData?.created_by_id;

  const members = useMemo(() => {
    return Object.values(channel.state.members || {}) as any[];
  }, [channel.state.members]);

  const onlineMembers = useMemo(() => members.filter(m => m.user?.online), [members]);
  const offlineMembers = useMemo(() => members.filter(m => !m.user?.online), [members]);

  // Extract shared media and files from messages
  const { sharedImages, sharedFiles } = useMemo(() => {
    const images: { url: string; name: string; sentBy: string; date: string }[] = [];
    const files: { url: string; name: string; size: number; sentBy: string; date: string }[] = [];

    const msgs = channel.state.messages || [];
    for (const msg of msgs) {
      if (msg.attachments) {
        for (const att of msg.attachments) {
          if (att.type === 'image' && att.image_url) {
            images.push({
              url: att.image_url,
              name: att.fallback || 'Image',
              sentBy: msg.user?.name || 'Unknown',
              date: msg.created_at ? (typeof msg.created_at === 'string' ? msg.created_at : msg.created_at.toISOString()) : '',
            });
          } else if (att.type === 'file' && att.asset_url) {
            files.push({
              url: att.asset_url,
              name: att.title || att.fallback || 'File',
              size: att.file_size || 0,
              sentBy: msg.user?.name || 'Unknown',
              date: msg.created_at ? (typeof msg.created_at === 'string' ? msg.created_at : msg.created_at.toISOString()) : '',
            });
          }
        }
      }
    }
    return { sharedImages: images.reverse(), sharedFiles: files.reverse() };
  }, [channel.state.messages]);

  const tabs: { id: Tab; label: string; count: number; icon: React.ReactNode }[] = [
    { id: 'members', label: 'Members', count: members.length, icon: <Users className="h-3.5 w-3.5" /> },
    { id: 'media', label: 'Media', count: sharedImages.length, icon: <ImageIcon className="h-3.5 w-3.5" /> },
    { id: 'files', label: 'Files', count: sharedFiles.length, icon: <FileText className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="w-72 flex-shrink-0 bg-card/50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-shrink-0">
        <h3 className="text-sm font-semibold text-foreground">Details</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Channel info */}
      <div className="px-4 py-4 border-b border-border flex-shrink-0">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden ring-2 ring-border/30 mb-3">
            {channelImage ? (
              <img src={channelImage} alt={channelName} className="w-full h-full object-cover" />
            ) : (
              <Hash className="h-6 w-6 text-primary" />
            )}
          </div>
          <h4 className="font-semibold text-foreground text-sm">{channelName}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {members.length} member{members.length !== 1 ? 's' : ''} &middot; {onlineMembers.length} online
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border flex-shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-2 py-2.5 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === tab.id
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className="text-[10px] opacity-60">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === 'members' && (
          <div className="p-2">
            {onlineMembers.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1.5">
                  Online ({onlineMembers.length})
                </p>
                {onlineMembers.map((member: any) => (
                  <MemberRow key={member.user_id} member={member} isCreator={member.user_id === creatorId} />
                ))}
              </div>
            )}
            {offlineMembers.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1.5">
                  Offline ({offlineMembers.length})
                </p>
                {offlineMembers.map((member: any) => (
                  <MemberRow key={member.user_id} member={member} isCreator={member.user_id === creatorId} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'media' && (
          <div className="p-2">
            {sharedImages.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No shared media yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {sharedImages.map((img, i) => (
                  <a
                    key={i}
                    href={img.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square rounded-lg overflow-hidden bg-muted hover:opacity-80 transition-opacity"
                  >
                    <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'files' && (
          <div className="p-2">
            {sharedFiles.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No shared files yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {sharedFiles.map((file, i) => (
                  <a
                    key={i}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                      <p className="text-[10px] text-muted-foreground">{file.sentBy}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MemberRow({ member, isCreator }: { member: any; isCreator: boolean }) {
  const user = member.user;

  return (
    <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-muted/70 transition-colors">
      <div className="relative flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
          {user?.image ? (
            <img src={user.image} alt={user.name || 'User'} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-semibold text-primary">
              {(user?.name || 'U')[0].toUpperCase()}
            </span>
          )}
        </div>
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-[1.5px] border-card ${
            user?.online ? 'bg-green-500' : 'bg-muted-foreground/40'
          }`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-medium text-foreground truncate">{user?.name || 'Unknown'}</p>
          {isCreator && (
            <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-bold uppercase bg-primary/10 text-primary">
              <Crown className="h-2.5 w-2.5" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
