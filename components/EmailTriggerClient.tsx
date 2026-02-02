'use client';

import { useEmailTrigger } from '@/hooks/useEmailTrigger';

/**
 * Client component that triggers email processing in background
 * This ensures emails get sent even without cron jobs
 */
export function EmailTriggerClient() {
  useEmailTrigger();
  return null;
}
