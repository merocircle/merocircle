'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';
import { AtSign } from 'lucide-react';
import { useMentionTrigger } from '@/hooks/useMentionTrigger';
import { MentionDropdown } from './MentionDropdown';

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  className?: string;
}

/**
 * Multi-line textarea that supports @-mentioning supporters.
 * Typing '@' triggers a dropdown of the creator's supporters.
 * Selecting a supporter inserts @[display_name](userId) into the text.
 */
export function MentionTextarea({
  value,
  onChange,
  placeholder,
  rows = 6,
  maxLength,
  className,
}: MentionTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    dropdownRef,
    filteredSupporters,
    showDropdown,
    mentionQuery,
    selectedIndex,
    handleTextChange,
    handleKeyDown,
    insertMention,
  } = useMentionTrigger(
    value,
    onChange,
    textareaRef as React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
  );

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) =>
          handleTextChange(
            e.target.value,
            e.target.selectionStart ?? e.target.value.length,
          )
        }
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className={cn(
          'flex min-h-[80px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none',
          className,
        )}
      />

      {/* Subtle @mention hint */}
      <div className="absolute bottom-2.5 right-3 flex items-center gap-1 pointer-events-none">
        <AtSign className="w-3.5 h-3.5 text-muted-foreground/40" />
        <span className="text-[11px] text-muted-foreground/40">mention</span>
      </div>

      <MentionDropdown
        dropdownRef={dropdownRef}
        supporters={filteredSupporters}
        selectedIndex={selectedIndex}
        mentionQuery={mentionQuery}
        showDropdown={showDropdown}
        onSelect={insertMention}
        position="above"
      />
    </div>
  );
}
