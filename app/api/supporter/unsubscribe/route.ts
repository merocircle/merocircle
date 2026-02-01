import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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
    console.error('Token verification error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

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

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update email_notifications_enabled to false for this supporter-creator relationship
    const { error } = await supabase
      .from('supporter_transactions')
      .update({ email_notifications_enabled: false })
      .eq('supporter_id', supporterId)
      .eq('creator_id', creatorId)
      .eq('status', 'completed');

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to unsubscribe' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from email notifications',
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
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
