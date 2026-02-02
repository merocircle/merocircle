import { NextRequest, NextResponse } from 'next/server';
import { triggerEmailProcessor } from '@/lib/email-trigger';

/**
 * Public endpoint to trigger email processing
 * Called from client-side when users are active
 * 
 * No auth required - rate limited internally
 * GET /api/email/trigger
 */
export async function GET(request: NextRequest) {
  try {
    // Trigger processor (rate-limited automatically)
    await triggerEmailProcessor('client-trigger');
    
    return NextResponse.json({ 
      success: true,
      message: 'Email processor triggered',
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
