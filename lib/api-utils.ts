import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

interface AuthUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

/**
 * Get authenticated user from NextAuth session
 * Returns user or null, and error response if unauthorized
 */
export async function getAuthenticatedUser(): Promise<{
  user: AuthUser | null;
  errorResponse: NextResponse | null;
}> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      user: null,
      errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { 
    user: {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.name || undefined,
      image: session.user.image || undefined,
    }, 
    errorResponse: null 
  };
}

/**
 * Get optional authenticated user (doesn't return error if not authenticated)
 * Useful for endpoints that work with or without authentication
 */
export async function getOptionalUser(): Promise<AuthUser | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email || '',
    name: session.user.name || undefined,
    image: session.user.image || undefined,
  };
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

  if (userProfile?.role !== 'creator') {
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

/**
 * Check if a user has access to a post based on visibility settings
 * @param post - Post object with is_public, required_tiers, tier_required, and creator_id
 * @param userId - User ID to check access for (null if not authenticated)
 * @param creatorId - Creator ID of the post
 * @param supporterTierLevel - User's tier level for this creator (0 if not a supporter)
 * @returns true if user has access, false otherwise
 */
export function checkPostAccess(
  post: {
    is_public: boolean;
    required_tiers?: string[] | null;
    tier_required?: string | null;
    creator_id: string;
  },
  userId: string | null,
  creatorId: string,
  supporterTierLevel: number
): boolean {
  // Creator always has access to their own posts
  if (userId === creatorId) {
    return true;
  }

  // Public posts are accessible to everyone
  if (post.is_public && (!post.required_tiers || post.required_tiers.length === 0)) {
    return true;
  }

  // If post has required_tiers, check if user's tier matches
  if (post.required_tiers && post.required_tiers.length > 0) {
    // Convert tier strings to numbers for comparison
    const requiredTierNumbers = post.required_tiers
      .map((t) => parseInt(t, 10))
      .filter((n) => !isNaN(n) && n >= 1 && n <= 3);
    
    // User must be a supporter with one of the required tiers
    return supporterTierLevel > 0 && requiredTierNumbers.includes(supporterTierLevel);
  }

  // Backward compatibility: check tier_required
  if (post.tier_required && post.tier_required !== 'free') {
    const requiredTier = parseInt(post.tier_required, 10);
    if (!isNaN(requiredTier) && requiredTier >= 1 && requiredTier <= 3) {
      return supporterTierLevel >= requiredTier;
    }
  }

  // If is_public=false and no tier requirements specified, default to tier 1+ (supporters only)
  if (!post.is_public) {
    return supporterTierLevel >= 1;
  }

  // Default: no access
  return false;
}
