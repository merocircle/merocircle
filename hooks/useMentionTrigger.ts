'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface Supporter {
  id: string;
  supporter_id: string;
  user: {
    id: string;
    display_name: string;
    photo_url: string | null;
  };
}

/**
 * Shared hook that powers @-mention autocomplete for any text input.
 * Detects when the user types '@', filters the creator's supporters, and
 * provides helpers to insert the resulting mention token.
 */
export function useMentionTrigger(
  value: string,
  onChange: (v: string) => void,
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Fetch supporters once on mount
  useEffect(() => {
    fetch('/api/creator/supporters')
      .then((r) => (r.ok ? r.json() : { supporters: [] }))
      .then((data) => setSupporters(data.supporters || []))
      .catch(() => {});
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSupporters = supporters
    .filter(
      (s) =>
        !mentionQuery ||
        s.user.display_name.toLowerCase().includes(mentionQuery.toLowerCase()),
    )
    .slice(0, 8);

  /** Call this inside the input/textarea onChange handler */
  const handleTextChange = useCallback(
    (newValue: string, cursorPos: number) => {
      onChange(newValue);

      const textBeforeCursor = newValue.slice(0, cursorPos);
      // Match a bare @ not yet followed by [ (i.e., still being typed)
      const mentionMatch = textBeforeCursor.match(/@([^@[\s]*)$/);

      if (mentionMatch) {
        setMentionStart(cursorPos - mentionMatch[0].length);
        setMentionQuery(mentionMatch[1]);
        setSelectedIndex(0);
        setShowDropdown(true);
      } else {
        setShowDropdown(false);
        setMentionStart(-1);
      }
    },
    [onChange],
  );

  /** Inserts the mention token and closes the dropdown */
  const insertMention = useCallback(
    (supporter: Supporter) => {
      const el = inputRef.current;
      if (!el || mentionStart === -1) return;

      const cursorPos = (el as HTMLInputElement).selectionStart ?? value.length;
      const before = value.slice(0, mentionStart);
      const after = value.slice(cursorPos);
      // Store only the display name — no user ID in content
      const token = `@[${supporter.user.display_name}]`;
      const newValue = before + token + ' ' + after;

      onChange(newValue);
      setShowDropdown(false);
      setMentionStart(-1);

      setTimeout(() => {
        if (el) {
          const newPos = before.length + token.length + 1;
          (el as HTMLInputElement).setSelectionRange(newPos, newPos);
          el.focus();
        }
      }, 0);
    },
    [value, mentionStart, onChange, inputRef],
  );

  /** Call this inside the input/textarea onKeyDown handler */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showDropdown || filteredSupporters.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredSupporters.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (filteredSupporters[selectedIndex]) {
          e.preventDefault();
          insertMention(filteredSupporters[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowDropdown(false);
      }
    },
    [showDropdown, filteredSupporters, selectedIndex, insertMention],
  );

  return {
    dropdownRef,
    filteredSupporters,
    showDropdown,
    mentionQuery,
    selectedIndex,
    handleTextChange,
    handleKeyDown,
    insertMention,
  };
}
