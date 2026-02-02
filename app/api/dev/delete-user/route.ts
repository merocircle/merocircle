import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Delete User - DEV ONLY
 * DELETE /api/dev/delete-user?email=test@example.com
 * 
 * WARNING: Remove this in production!
 */
export async function DELETE(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    // Delete from email queue first
    const { error: emailQueueError } = await supabase
      .from('email_queue')
      .delete()
      .eq('recipient_email', email);

    // Delete user
    const { data: deletedUser, error: userError } = await supabase
      .from('users')
      .delete()
      .eq('email', email)
      .select();

    if (userError) {
      throw userError;
    }

    return NextResponse.json({
      success: true,
      message: `User ${email} deleted successfully`,
      deletedUser,
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
    }, { status: 500 });
  }
}

// Also support GET for easier testing in browser
export async function GET(request: NextRequest) {
  return DELETE(request);
}
