import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  sendWelcomeEmail,
  sendSubscriptionExpiringEmail,
  sendSubscriptionExpiredEmail,
  sendPostNotificationEmail,
  sendSubscriptionConfirmationEmail,
  sendNewSupporterNotificationEmail,
  sendChannelMentionEmail,
} from '@/lib/email';
import { logger } from '@/lib/logger';

/** Shape of a row from email_queue for processing */
interface EmailQueueRow {
  id: string;
  email_type: string;
  recipient_email: string;
  payload: Record<string, unknown>;
  status: string;
  attempts: number;
  max_attempts: number;
}

/**
 * Email Queue Processor
 * Processes pending emails from the email_queue table.
 * All sending is done via Hostinger SMTP (lib/email.ts); Supabase is only used for queue storage.
 *
 * Can be called:
 * 1. Via cron job (recommended): Vercel Cron or similar
 * 2. Manually: POST /api/email/process-queue
 * 3. After specific actions (e.g. send-welcome API triggers this)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verify cron secret in production
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('Unauthorized queue processor request', 'EMAIL_QUEUE');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const batchSize = 10; // Process 10 emails at a time
    const now = new Date().toISOString();

    // Fetch pending emails that are scheduled to be sent
    const { data: rawPending, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .in('status', ['pending', 'failed'])
      .lte('scheduled_for', now)
      .lt('attempts', 3)
      .order('created_at', { ascending: true })
      .limit(batchSize);

    if (fetchError) {
      logger.error('Failed to fetch email queue', 'EMAIL_QUEUE', { error: fetchError.message });
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const pendingEmails = (rawPending ?? []) as EmailQueueRow[];
    if (pendingEmails.length === 0) {
      logger.info('No pending emails to process', 'EMAIL_QUEUE');
      return NextResponse.json({ 
        message: 'No pending emails',
        processed: 0,
        duration: Date.now() - startTime,
      });
    }

    logger.info(`Processing ${pendingEmails.length} emails`, 'EMAIL_QUEUE');

    let sent = 0;
    let failed = 0;

    // Process each email
    for (const emailJob of pendingEmails) {
      // Mark as processing
      await (supabase as any)
        .from('email_queue')
        .update({ 
          status: 'processing',
          attempts: emailJob.attempts + 1 
        })
        .eq('id', emailJob.id);

      try {
        let success = false;

        // Route to appropriate email sender based on type
        switch (emailJob.email_type) {
          case 'welcome':
            success = await sendWelcomeEmail({
              userEmail: emailJob.payload.userEmail as string,
              userName: emailJob.payload.userName as string,
              userRole: emailJob.payload.userRole as 'creator' | 'supporter',
            });
            break;

          case 'subscription_expiring_reminder':
            success = await sendSubscriptionExpiringEmail({
              supporterEmail: emailJob.recipient_email,
              supporterName: emailJob.payload.supporterName as string,
              creatorName: emailJob.payload.creatorName as string,
              creatorUsername: emailJob.payload.creatorUsername as string | undefined,
              creatorId: emailJob.payload.creatorId as string,
              tierLevel: emailJob.payload.tierLevel as number,
              expiryDate: emailJob.payload.expiryDate as string,
              daysUntilExpiry: emailJob.payload.daysUntilExpiry as number,
              renewUrl: emailJob.payload.renewUrl as string,
            });
            break;

          case 'subscription_expired':
            success = await sendSubscriptionExpiredEmail({
              supporterEmail: emailJob.recipient_email,
              supporterName: emailJob.payload.supporterName as string,
              creatorName: emailJob.payload.creatorName as string,
              creatorUsername: emailJob.payload.creatorUsername as string | undefined,
              creatorId: emailJob.payload.creatorId as string,
              renewUrl: emailJob.payload.renewUrl as string,
            });
            break;

          case 'post_notification':
          case 'poll_notification':
            success = await sendPostNotificationEmail({
              supporterEmail: emailJob.recipient_email,
              supporterName: emailJob.payload.supporterName as string,
              supporterId: emailJob.payload.supporterId as string,
              creatorId: emailJob.payload.creatorId as string,
              creatorName: emailJob.payload.creatorName as string,
              creatorUsername: emailJob.payload.creatorUsername as string | undefined,
              postTitle: emailJob.payload.postTitle as string,
              postContent: emailJob.payload.postContent as string,
              postImageUrl: emailJob.payload.postImageUrl as string | null | undefined,
              postUrl: emailJob.payload.postUrl as string,
              isPoll: emailJob.email_type === 'poll_notification' || (emailJob.payload.isPoll as boolean | undefined),
            });
            break;

          case 'subscription_confirmation':
            success = await sendSubscriptionConfirmationEmail({
              supporterEmail: emailJob.recipient_email,
              supporterName: emailJob.payload.supporterName as string,
              creatorName: emailJob.payload.creatorName as string,
              tierLevel: emailJob.payload.tierLevel as number,
              tierName: emailJob.payload.tierName as string,
              amount: emailJob.payload.amount as number,
              currency: emailJob.payload.currency as string,
              creatorProfileUrl: emailJob.payload.creatorProfileUrl as string,
              chatUrl: emailJob.payload.chatUrl as string,
            });
            break;

          case 'new_supporter_notification':
            success = await sendNewSupporterNotificationEmail({
              creatorEmail: emailJob.recipient_email,
              creatorName: emailJob.payload.creatorName as string,
              supporterName: emailJob.payload.supporterName as string,
              tierLevel: emailJob.payload.tierLevel as number,
              tierName: emailJob.payload.tierName as string,
              amount: emailJob.payload.amount as number,
              currency: emailJob.payload.currency as string,
              supporterMessage: emailJob.payload.supporterMessage as string | null | undefined,
            });
            break;

          case 'channel_mention':
            success = await sendChannelMentionEmail({
              memberEmail: emailJob.recipient_email,
              memberName: emailJob.payload.memberName as string,
              memberId: emailJob.payload.memberId as string,
              creatorId: emailJob.payload.creatorId as string,
              creatorName: emailJob.payload.creatorName as string,
              creatorUsername: emailJob.payload.creatorUsername as string | undefined,
              channelName: emailJob.payload.channelName as string,
              channelId: emailJob.payload.channelId as string,
              messageText: emailJob.payload.messageText as string,
              senderName: emailJob.payload.senderName as string,
              senderId: emailJob.payload.senderId as string,
              mentionType: emailJob.payload.mentionType as 'you' | 'everyone' | undefined,
            });
            break;

          case 'payment_success':
          case 'payment_failed':
            logger.warn(`Email type ${emailJob.email_type} not implemented yet`, 'EMAIL_QUEUE');
            success = false;
            break;

          default:
            logger.error(`Unknown email type: ${emailJob.email_type}`, 'EMAIL_QUEUE');
            success = false;
        }

        if (success) {
          // Mark as sent
          await (supabase as any)
            .from('email_queue')
            .update({ 
              status: 'sent',
              processed_at: new Date().toISOString(),
              last_error: null
            })
            .eq('id', emailJob.id);

          sent++;
          logger.info('Email sent successfully', 'EMAIL_QUEUE', {
            id: emailJob.id,
            type: emailJob.email_type,
            recipient: emailJob.recipient_email,
          });
        } else {
          throw new Error('Email sending returned false');
        }
      } catch (error: any) {
        failed++;
        const newAttempts = emailJob.attempts + 1;
        const maxedOut = newAttempts >= emailJob.max_attempts;

        // Update with error
        await (supabase as any)
          .from('email_queue')
          .update({ 
            status: maxedOut ? 'failed' : 'pending',
            last_error: error.message,
            // Exponential backoff: retry after 1min, 5min, 15min
            scheduled_for: new Date(Date.now() + Math.pow(5, newAttempts) * 60 * 1000).toISOString(),
          })
          .eq('id', emailJob.id);

        logger.error('Failed to send email', 'EMAIL_QUEUE', {
          id: emailJob.id,
          type: emailJob.email_type,
          recipient: emailJob.recipient_email,
          attempts: newAttempts,
          maxedOut,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: pendingEmails.length,
      sent,
      failed,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Queue processor failed', 'EMAIL_QUEUE', {
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime,
    });
    
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message,
      duration: Date.now() - startTime,
    }, { status: 500 });
  }
}

// Allow GET for manual testing
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Get queue stats
  const { data: rows } = await supabase.from('email_queue' as any).select('status');
  const stats = Array.isArray(rows)
    ? (rows as Array<{ status: string }>).reduce(
        (acc, email) => {
          acc[email.status] = (acc[email.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      )
    : null;

  return NextResponse.json({
    message: 'Email queue processor',
    stats,
    usage: {
      manual: 'POST /api/email/process-queue',
      cron: 'Set up Vercel Cron to POST this endpoint every minute',
    }
  });
}
