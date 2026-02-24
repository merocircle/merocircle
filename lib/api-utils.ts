import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { verifySupabaseAccessToken } from '@/lib/supabase-jwt';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

/**
 * Resolve authenticated user from either:
 * - Authorization: Bearer <supabase_access_token> (mobile app), or
 * - NextAuth session (web).
 * When request is provided, Bearer token is checked first.
 */
async function resolveUser(request?: NextRequest): Promise<AuthUser | null> {
  if (request) {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (token) {
      const payload = await verifySupabaseAccessToken(token);
      if (payload) {
        const supabase = await createClient();
        const { data: row } = await supabase
          .from('users')
          .select('id, email, display_name, photo_url')
          .eq('id', payload.sub)
          .single();
        const userRow = row as { id: string; email: string | null; display_name: string | null; photo_url: string | null } | null;
        if (userRow) {
          return {
            id: userRow.id,
            email: userRow.email ?? payload.email ?? '',
            name: userRow.display_name ?? undefined,
            image: userRow.photo_url ?? undefined,
          };
        }
        return {
          id: payload.sub,
          email: payload.email ?? '',
        };
      }
    }
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  return {
    id: session.user.id,
    email: session.user.email || '',
    name: session.user.name || undefined,
    image: session.user.image || undefined,
  };
}

/**
 * Get authenticated user from NextAuth session or Supabase Bearer token (mobile).
 * Pass the request so mobile can send Authorization: Bearer <supabase_access_token>.
 */
export async function getAuthenticatedUser(request?: NextRequest): Promise<{
  user: AuthUser | null;
  errorResponse: NextResponse | null;
}> {
  const user = await resolveUser(request);
  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  return { user, errorResponse: null };
}

/**
 * Get optional authenticated user (returns null if not authenticated).
 * Pass the request so mobile can send Authorization: Bearer <supabase_access_token>.
 */
export async function getOptionalUser(request?: NextRequest): Promise<AuthUser | null> {
  return resolveUser(request);
}

/**
 * Check if user has creator role
 */
export async function requireCreatorRole(userId: string): Promise<{
  isCreator: boolean;
  errorResponse: NextResponse | null;
}> {
  const supabase = await createClient();
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  const profile = userProfile as { role: string } | null;
  if (profile?.role !== 'creator') {
    return {
      isCreator: false,
      errorResponse: NextResponse.json(
        { error: 'Only creators can perform this action' },
        { status: 403 }
      ),
    };
  }

  return { isCreator: true, errorResponse: null };
}

/**
 * Check if user owns a resource
 */
export async function checkResourceOwnership(
  table: string,
  resourceId: string,
  userId: string,
  ownerIdColumn: string = 'creator_id'
): Promise<{
  owns: boolean;
  exists: boolean;
  errorResponse: NextResponse | null;
}> {
  const supabase = await createClient();
  const { data: resource, error } = await supabase
    .from(table)
    .select(ownerIdColumn)
    .eq('id', resourceId)
    .single();

  if (error || !resource) {
    return {
      owns: false,
      exists: false,
      errorResponse: NextResponse.json({ error: 'Resource not found' }, { status: 404 }),
    };
  }

  const ownerId = resource[ownerIdColumn as keyof typeof resource] as string;
  if (ownerId !== userId) {
    return {
      owns: false,
      exists: true,
      errorResponse: NextResponse.json(
        { error: 'You can only modify your own resources' },
        { status: 403 }
      ),
    };
  }

  return { owns: true, exists: true, errorResponse: null };
}

/**
 * Standard error response handler
 */
export function handleApiError(
  error: unknown,
  context: string,
  defaultMessage: string = 'Internal server error'
): NextResponse {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  logger.error(`Error in ${context}`, context, { error: errorMessage });
  
  return NextResponse.json(
    { error: defaultMessage },
    { status: 500 }
  );
}

/**
 * Parse pagination parameters from request
 */
export function parsePaginationParams(searchParams: URLSearchParams): {
  page: number;
  limit: number;
  offset: number;
} {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10', 10)));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}
