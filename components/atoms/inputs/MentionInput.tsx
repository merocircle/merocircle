'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';
import { useMentionTrigger } from '@/hooks/useMentionTrigger';
import { MentionDropdown } from './MentionDropdown';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

/**
 * Single-line input that supports @-mentioning supporters.
 * Typing '@' triggers a dropdown of the creator's supporters.
 */
export function MentionInput({
  value,
  onChange,
  placeholder,
  maxLength,
  className,
}: MentionInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    dropdownRef,
    filteredSupporters,
    showDropdown,
    mentionQuery,
    selectedIndex,
    handleTextChange,
    handleKeyDown,
    insertMention,
  } = useMentionTrigger(value, onChange, inputRef);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => handleTextChange(e.target.value, e.target.selectionStart ?? e.target.value.length)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={maxLength}
        className={cn(
          'flex h-10 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
      />

      <MentionDropdown
        dropdownRef={dropdownRef}
        supporters={filteredSupporters}
        selectedIndex={selectedIndex}
        mentionQuery={mentionQuery}
        showDropdown={showDropdown}
        onSelect={insertMention}
        position="below"
      />
    </div>
  );
}
