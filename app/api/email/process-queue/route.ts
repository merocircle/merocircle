import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendWelcomeEmail } from '@/lib/email';
import { logger } from '@/lib/logger';

/**
 * Email Queue Processor
 * Processes pending emails from the email_queue table
 * 
 * Can be called:
 * 1. Via cron job (recommended): Vercel Cron or similar
 * 2. Manually: POST /api/email/process-queue
 * 3. After specific actions (like user signup)
 * 
 * Senior dev approach: Queue-based with retry logic
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
    const { data: pendingEmails, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .in('status', ['pending', 'failed'])
      .lte('scheduled_for', now)
      .lt('attempts', 'max_attempts')
      .order('created_at', { ascending: true })
      .limit(batchSize);

    if (fetchError) {
      logger.error('Failed to fetch email queue', 'EMAIL_QUEUE', { error: fetchError.message });
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!pendingEmails || pendingEmails.length === 0) {
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
      await supabase
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
              userEmail: emailJob.payload.userEmail,
              userName: emailJob.payload.userName,
              userRole: emailJob.payload.userRole,
            });
            break;

          // Add other email types here
          case 'post_notification':
          case 'poll_notification':
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
          await supabase
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
        await supabase
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
  const { data: stats } = await supabase
    .from('email_queue')
    .select('status')
    .then(res => {
      if (!res.data) return { data: null };
      
      const counts = res.data.reduce((acc, email) => {
        acc[email.status] = (acc[email.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return { data: counts };
    });

  return NextResponse.json({
    message: 'Email queue processor',
    stats,
    usage: {
      manual: 'POST /api/email/process-queue',
      cron: 'Set up Vercel Cron to POST this endpoint every minute',
    }
  });
}
