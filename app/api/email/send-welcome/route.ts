import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { sendWelcomeEmail } from '@/lib/email';

/**
 * Queue welcome email (sent via Hostinger SMTP by process-queue, not Supabase).
 * POST /api/email/send-welcome
 *
 * Body: { userId: string } or { email: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const { userId, email } = body;
    
    if (!userId && !email) {
      return NextResponse.json({
        error: 'Either userId or email is required',
      }, { status: 400 });
    }
    
    // Get user info
    let query = supabase.from('users').select('id, email, display_name, role');
    
    if (userId) {
      query = query.eq('id', userId);
    } else {
      query = query.eq('email', email);
    }
    
    const { data: user, error: userError } = await query.single();
    
    if (userError || !user) {
      logger.warn('User not found for welcome email', 'EMAIL', { userId, email });
      return NextResponse.json({
        error: 'User not found',
      }, { status: 404 });
    }
    
    // Check if welcome email was already sent successfully
    const { data: existingEmail } = await supabase
      .from('email_queue')
      .select('id, status, created_at')
      .eq('email_type', 'welcome')
      .eq('recipient_email', user.email)
      .eq('status', 'sent')
      .single();
    
    if (existingEmail) {
      logger.info('Welcome email already sent', 'EMAIL', {
        userId: user.id,
        sentAt: existingEmail.created_at,
      });
      
      return NextResponse.json({
        message: 'Welcome email was already sent',
        sentAt: existingEmail.created_at,
        action: 'skipped',
      });
    }
    
    // Queue new welcome email
    const { data: queuedEmail, error: queueError } = await supabase
      .from('email_queue')
      .insert({
        email_type: 'welcome',
        recipient_email: user.email,
        payload: {
          userId: user.id,
          userName: user.display_name || user.email.split('@')[0],
          userRole: user.role || 'supporter',
          userEmail: user.email,
        },
        scheduled_for: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (queueError) {
      logger.warn('Queue insert failed, sending welcome email directly', 'EMAIL', {
        error: queueError.message,
        userId: user.id,
        email: user.email,
      });
      const sent = await sendWelcomeEmail({
        userEmail: user.email,
        userName: user.display_name || user.email.split('@')[0],
        userRole: (user.role as 'creator' | 'supporter') || 'supporter',
      });
      return NextResponse.json({
        success: sent,
        message: sent ? 'Welcome email sent directly (queue unavailable)' : 'Failed to send welcome email',
        action: 'sent_direct',
      });
    }
    
    logger.info('Welcome email queued manually', 'EMAIL', {
      userId: user.id,
      email: user.email,
      queueId: queuedEmail.id,
    });
    
    // Trigger processor immediately
    const processorUrl = `${process.env.NEXTAUTH_URL}/api/email/process-queue`;
    fetch(processorUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET || ''}`,
        'Content-Type': 'application/json',
      },
    }).catch(err => {
      logger.warn('Failed to trigger email processor', 'EMAIL', { error: err.message });
    });
    
    return NextResponse.json({
      success: true,
      message: 'Welcome email queued successfully',
      queueId: queuedEmail.id,
      recipient: user.email,
      action: 'queued',
    });
    
  } catch (error: any) {
    logger.error('Failed to send welcome email', 'EMAIL', {
      error: error.message,
    });
    
    return NextResponse.json({
      error: 'Failed to queue welcome email',
      message: error.message,
    }, { status: 500 });
  }
}
