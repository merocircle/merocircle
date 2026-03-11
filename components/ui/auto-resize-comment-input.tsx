'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface AutoResizeCommentInputProps
  extends Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    'value' | 'onChange' | 'defaultValue'
  > {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
}

const baseInputClass =
  'w-full py-2 px-4 text-sm outline-none break-words whitespace-pre-wrap box-border';

/**
 * Auto-expanding textarea for comments. Uses a CSS grid + mirror so the
 * field grows and shrinks with content (min 24px, max 320px) without JS.
 */
export function AutoResizeCommentInput({
  value,
  onChange,
  className,
  ...rest
}: AutoResizeCommentInputProps) {
  return (
    <div className="grid min-w-0">
      {/* Mirror: same content/styling so grid cell height follows content */}
      <span
        aria-hidden
        className={cn(
          baseInputClass,
          'invisible col-start-1 row-start-1 min-h-[24px] max-h-[320px] overflow-hidden',
        )}
      >
        {value || '\u00A0'}
      </span>
      <textarea
        value={value}
        onChange={onChange}
        rows={1}
        className={cn(
          baseInputClass,
          'col-start-1 row-start-1 resize-none min-h-[24px] max-h-[320px] overflow-y-auto overflow-x-hidden',
          'transition-[height]',
          className,
        )}
        {...rest}
      />
    </div>
  );
}
