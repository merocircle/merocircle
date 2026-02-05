import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { processUnsubscribe } from '@/lib/unsubscribe-engine';
import { logger } from '@/lib/logger';

// Secret key for HMAC verification
const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET || 'default-secret-change-in-production';

function verifyUnsubscribeToken(token: string): { supporterId: string; creatorId: string; email: string } | null {
  try {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', UNSUBSCRIBE_SECRET)
      .update(payload)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    // Decode payload
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
    
    // Check expiration (30 days)
    if (decoded.exp && Date.now() > decoded.exp) return null;

    return {
      supporterId: decoded.supporterId,
      creatorId: decoded.creatorId,
      email: decoded.email,
    };
  } catch (error) {
    logger.error('Token verification error', 'UNSUBSCRIBE_API', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, unsubscribeType } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Verify token
    const verified = verifyUnsubscribeToken(token);
    if (!verified) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    const { supporterId, creatorId } = verified;

    // Determine unsubscribe type: 'email-only' (from email link) or 'full' (from dashboard)
    const isEmailOnly = unsubscribeType === 'email-only';

    // Use unified unsubscribe engine
    const result = await processUnsubscribe({
      supporterId,
      creatorId,
      cancelSubscription: !isEmailOnly, // Only cancel subscription if full unsubscribe
      removeFromChannels: !isEmailOnly, // Only remove from channels if full unsubscribe
      disableEmailNotifications: true, // Always disable email notifications
      reason: isEmailOnly ? 'email_unsubscribe' : 'user_requested',
    });

    if (!result.success) {
      logger.error('Unsubscribe processing failed', 'UNSUBSCRIBE_API', {
        error: result.error,
        supporterId,
        creatorId,
      });
      return NextResponse.json(
        { error: result.error || 'Failed to unsubscribe' },
        { status: 500 }
      );
    }

    const message = isEmailOnly
      ? 'Successfully unsubscribed from email notifications'
      : 'Successfully unsubscribed from creator support';

    return NextResponse.json({
      success: true,
      message,
      details: result,
    });
  } catch (error) {
    logger.error('Unsubscribe error', 'UNSUBSCRIBE_API', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Verify token
  const verified = verifyUnsubscribeToken(token);
  if (!verified) {
    return NextResponse.redirect(new URL('/home?error=invalid_token', request.url));
  }

  // Redirect to unsubscribe page with token
  return NextResponse.redirect(new URL(`/unsubscribe?token=${token}`, request.url));
}
