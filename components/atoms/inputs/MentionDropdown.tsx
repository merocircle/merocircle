'use client';

import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Supporter } from '@/hooks/useMentionTrigger';

interface MentionDropdownProps {
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  supporters: Supporter[];
  selectedIndex: number;
  mentionQuery: string;
  showDropdown: boolean;
  onSelect: (supporter: Supporter) => void;
  /** 'above' — renders above the field (default); 'below' — renders below */
  position?: 'above' | 'below';
}

/**
 * Shared floating dropdown used by both MentionInput and MentionTextarea.
 * Shows supporters and other creators for @-mention autocomplete.
 */
export function MentionDropdown({
  dropdownRef,
  supporters,
  selectedIndex,
  mentionQuery,
  showDropdown,
  onSelect,
  position = 'above',
}: MentionDropdownProps) {
  const positionStyle =
    position === 'above'
      ? { bottom: '100%', marginBottom: 4 }
      : { top: '100%', marginTop: 4 };

  if (!showDropdown) return null;

  if (supporters.length === 0 && mentionQuery.length > 0) {
    return (
      <div
        className="absolute z-50 left-0 w-72 rounded-xl border border-border bg-popover shadow-lg"
        style={positionStyle}
      >
        <p className="p-3 text-sm text-muted-foreground text-center">
          No supporters or creators found for &quot;{mentionQuery}&quot;
        </p>
      </div>
    );
  }

  if (supporters.length === 0) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute z-50 left-0 w-72 max-h-64 overflow-y-auto rounded-xl border border-border bg-popover shadow-lg"
      style={positionStyle}
    >
      <div className="p-2 space-y-0.5">
        <p className="text-[11px] text-muted-foreground px-2 py-1 font-medium uppercase tracking-wide">
          Mention a supporter or creator
        </p>
        {supporters.map((s, idx) => (
          <button
            key={s.supporter_id}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(s);
            }}
            className={cn(
              'w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left transition-colors',
              idx === selectedIndex
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-muted/50',
            )}
          >
            <div className="w-7 h-7 rounded-full overflow-hidden bg-muted flex-shrink-0">
              {s.user.photo_url ? (
                <img
                  src={s.user.photo_url}
                  alt={s.user.display_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary text-xs font-bold">
                  {s.user.display_name[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <span className="text-sm font-medium truncate flex-1 min-w-0">{s.user.display_name}</span>
            {s.is_creator && (
              <span className="flex items-center gap-0.5 text-[10px] text-violet-500 font-medium shrink-0">
                <User className="w-3 h-3" />
                Creator
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
