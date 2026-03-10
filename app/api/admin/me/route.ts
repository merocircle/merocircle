import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-utils';
import { isAdmin } from '@/lib/admin-middleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/me
 * Returns whether the current user is an admin (for UI to show/hide admin actions).
 */
export async function GET() {
  const { user, errorResponse } = await getAuthenticatedUser();
  if (errorResponse || !user) {
    return errorResponse ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ isAdmin: isAdmin(user.id) });
}
