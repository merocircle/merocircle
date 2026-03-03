import { NextResponse } from 'next/server';

/**
 * Admin user IDs - only these users can access admin dashboard
 */
const ADMIN_USER_IDS = [
  'a03d3820-5a68-4ab4-8b0c-d6b48762841e',
  'a22c3394-947b-4d8f-afe8-a6ad1d6d0c18',
  'ba1f0a86-1f84-48ef-8aea-123761c7e781',
  'fba91bcb-b57d-4230-956f-c3ec1c39d76b',
  'fb8f6a9b-7921-4c2f-b675-59d949f9282a'
];

/**
 * Check if a user ID is an admin
 */
export function isAdmin(userId: string): boolean {
  return ADMIN_USER_IDS.includes(userId);
}

/**
 * Middleware to require admin access
 * Returns error response if user is not admin
 */
export async function requireAdmin(userId?: string) {
  if (!userId || !isAdmin(userId)) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      ),
      isAdmin: false
    };
  }
  return { isAdmin: true, error: null };
}

/**
 * Get admin user IDs (for display purposes only)
 */
export function getAdminUserIds(): string[] {
  return [...ADMIN_USER_IDS];
}
