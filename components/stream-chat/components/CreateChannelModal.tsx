"use client";

import React, { useState, useEffect } from 'react';
import { X, Check, Search, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Supporter {
  id: string;
  supporter_id: string;
  tier_level: number;
  user: {
    id: string;
    display_name: string;
    photo_url: string | null;
  };
}

interface CreateChannelModalProps {
  onClose: () => void;
  onCreate: (name: string, selectedSupporterIds: string[]) => void;
}

export function CreateChannelModal({ onClose, onCreate }: CreateChannelModalProps) {
  const [name, setName] = useState('');
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [selectedSupporters, setSelectedSupporters] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSupporters = async () => {
      try {
        const response = await fetch('/api/creator/supporters');
        if (response.ok) {
          const data = await response.json();
          setSupporters(data.supporters || []);
        }
      } catch (err) {
        // Silent fail
      } finally {
        setIsLoading(false);
      }
    };
    fetchSupporters();
  }, []);

  const filteredSupporters = supporters.filter(s =>
    s.user.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSupporter = (supporterId: string) => {
    setSelectedSupporters(prev => {
      const next = new Set(prev);
      if (next.has(supporterId)) {
        next.delete(supporterId);
      } else {
        next.add(supporterId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedSupporters(new Set(filteredSupporters.map(s => s.supporter_id)));
  };

  const deselectAll = () => {
    setSelectedSupporters(new Set());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    onCreate(name.trim(), Array.from(selectedSupporters));
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-card rounded-t-2xl sm:rounded-lg w-full sm:max-w-lg sm:mx-4 max-h-[85vh] flex flex-col border border-border">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Create Channel</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Channel Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., announcements"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-foreground">
                  Select Supporters ({selectedSupporters.size} selected)
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-xs text-primary hover:underline"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search supporters..."
                  className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-2 min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredSupporters.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No supporters found</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredSupporters.map(supporter => (
                  <button
                    key={supporter.supporter_id}
                    type="button"
                    onClick={() => toggleSupporter(supporter.supporter_id)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      selectedSupporters.has(supporter.supporter_id)
                        ? 'bg-primary/10 border border-primary/30'
                        : 'hover:bg-muted border border-transparent'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                      selectedSupporters.has(supporter.supporter_id)
                        ? 'bg-primary border-primary'
                        : 'border-border'
                    }`}>
                      {selectedSupporters.has(supporter.supporter_id) && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {supporter.user.photo_url ? (
                        <img src={supporter.user.photo_url} alt={supporter.user.display_name || 'User Avatar'} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-foreground text-sm">
                        {supporter.user.display_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {supporter.tier_level} Star Supporter
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 pb-[calc(3.5rem+env(safe-area-inset-bottom))] sm:pb-4 border-t border-border flex gap-3 bg-card">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || selectedSupporters.size === 0 || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Create'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
