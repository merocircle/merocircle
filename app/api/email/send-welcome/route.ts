import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { sendWelcomeEmail } from '@/lib/email';

/**
 * Send welcome email directly (no queue). Hostinger SMTP via lib/email.
 * POST /api/email/send-welcome
 *
 * Body: { userId: string } or { email: string }
 */
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { userId, email } = body;

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'Either userId or email is required' },
        { status: 400 }
      );
    }

    let query = supabase.from('users').select('id, email, display_name, role');
    if (userId) {
      query = query.eq('id', userId);
    } else {
      query = query.eq('email', email);
    }

    const { data: userData, error: userError } = await query.single();

    if (userError || !userData) {
      logger.warn('User not found for welcome email', 'EMAIL', { userId, email });
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userData as { id: string; email: string; display_name: string | null; role: string | null };
    const payload = {
      userEmail: user.email,
      userName: user.display_name || user.email.split('@')[0],
      userRole: (user.role as 'creator' | 'supporter') || 'supporter',
    };

    const maxAttempts = 3;
    let sent = false;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      sent = await sendWelcomeEmail(payload);
      if (sent) break;
      if (attempt < maxAttempts) {
        logger.warn('Welcome email attempt failed, retrying', 'EMAIL', {
          userId: user.id,
          email: user.email,
          attempt,
          maxAttempts,
        });
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    if (sent) {
      logger.info('Welcome email sent', 'EMAIL', { userId: user.id, email: user.email });
    } else {
      logger.warn('Welcome email send failed after retries', 'EMAIL', {
        userId: user.id,
        email: user.email,
        attempts: maxAttempts,
      });
    }

    return NextResponse.json({
      success: sent,
      message: sent ? 'Welcome email sent' : 'Failed to send welcome email after 3 attempts',
      recipient: user.email,
    });
  } catch (error: any) {
    logger.error('Failed to send welcome email', 'EMAIL', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to send welcome email', message: error.message },
      { status: 500 }
    );
  }
}
