import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Delete User - DEV ONLY
 * DELETE /api/dev/delete-user?email=test@example.com
 * 
 * WARNING: Remove this in production!
 * 
 * Usage:
 * 1. Open in browser: http://localhost:3000/api/dev/delete-user?email=YOUR_EMAIL@gmail.com
 * 2. Sign up again - will be treated as new user
 */
export async function DELETE(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ 
      error: 'Email required',
      usage: 'DELETE /api/dev/delete-user?email=test@example.com'
    }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const session = await getServerSession(authOptions);

    // Check if deleting current user
    const isDeletingSelf = session?.user?.email === email;

    // Delete from email queue first (if exists)
    await supabase
      .from('email_queue')
      .delete()
      .eq('recipient_email', email)
      .then(() => {
        console.log('Email queue cleaned for:', email);
      })
      .catch(() => {
        // Table might not exist, ignore error
      });

    // Delete user's creator profile if exists
    const { data: userToDelete } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userToDelete) {
      await supabase
        .from('creator_profiles')
        .delete()
        .eq('user_id', userToDelete.id);
    }

    // Delete user
    const { data: deletedUser, error: userError } = await supabase
      .from('users')
      .delete()
      .eq('email', email)
      .select();

    if (userError) {
      throw userError;
    }

    const response = NextResponse.json({
      success: true,
      message: `User ${email} deleted successfully`,
      deletedUser,
      note: isDeletingSelf 
        ? '⚠️ You deleted yourself! Sign out and sign up again to test welcome email.'
        : '✅ User deleted. They can sign up again and will be treated as new user.',
    });

    // If deleting self, clear the session cookie
    if (isDeletingSelf) {
      response.cookies.delete('next-auth.session-token');
      response.cookies.delete('__Secure-next-auth.session-token');
    }

    return response;
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      hint: 'Make sure the user exists in the database'
    }, { status: 500 });
  }
}

// Also support GET for easier testing in browser
export async function GET(request: NextRequest) {
  return DELETE(request);
}
