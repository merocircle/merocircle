import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

export type QueuedEmailType =
  | 'welcome'
  | 'post_notification'
  | 'poll_notification'
  | 'subscription_confirmation'
  | 'new_supporter_notification'
  | 'channel_mention'
  | 'subscription_expiring_reminder'
  | 'subscription_expired'
  | 'payment_success'
  | 'payment_failed';

export interface QueueEmailParams {
  email_type: QueuedEmailType;
  recipient_email: string;
  payload: Record<string, unknown>;
  scheduled_for?: string;
}

export interface QueueResult {
  ok: boolean;
  id?: string;
  error?: string;
}

/**
 * Insert a single email job into email_queue.
 * Caller should trigger process-queue after (e.g. via triggerProcessQueue()).
 */
export async function queueEmail(
  supabase: SupabaseClient,
  params: QueueEmailParams
): Promise<QueueResult> {
  const { email_type, recipient_email, payload, scheduled_for } = params;
  const { data, error } = await supabase
    .from('email_queue')
    .insert({
      email_type,
      recipient_email,
      payload,
      scheduled_for: scheduled_for ?? new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    logger.warn('Email queue insert failed', 'EMAIL_QUEUE', {
      email_type,
      recipient_email,
      error: error.message,
    });
    return { ok: false, error: error.message };
  }
  return { ok: true, id: data?.id };
}

/**
 * Fire-and-forget trigger for the email queue processor.
 * Safe to call after one or more queueEmail() calls.
 *
 * Sync: We only call this after a successful insert. So the order is guaranteed:
 * 1. Row is written to email_queue (we await queueEmail).
 * 2. Then we trigger process-queue. It runs in a separate request and reads pending rows.
 * If queue insert fails, callers use queueOrSend and send directly inline instead.
 */
export function triggerProcessQueue(): void {
  const url = `${process.env.NEXTAUTH_URL}/api/email/process-queue`;
  const secret = process.env.CRON_SECRET || '';
  fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
  }).catch((err) => {
    logger.warn('Failed to trigger email processor', 'EMAIL_QUEUE', { error: err.message });
  });
}

export type QueueOrSendResult = 'queued' | 'sent_direct' | 'failed';

export interface QueueOrSendOptions {
  /** If false, do not trigger process-queue (caller will trigger once after a bulk loop). Default true. */
  trigger?: boolean;
}

/**
 * Queue by default; if queue insert fails, send directly via the provided function.
 * For bulk (e.g. 30 post notifications): pass { trigger: false } in the loop, then call triggerProcessQueue() once after.
 */
export async function queueOrSend(
  supabase: SupabaseClient,
  params: QueueEmailParams,
  sendDirect: () => Promise<boolean>,
  options?: QueueOrSendOptions
): Promise<QueueOrSendResult> {
  const result = await queueEmail(supabase, params);
  if (result.ok) {
    if (options?.trigger !== false) {
      triggerProcessQueue();
    }
    return 'queued';
  }
  const sent = await sendDirect();
  return sent ? 'sent_direct' : 'failed';
}
