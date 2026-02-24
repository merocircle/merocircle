import * as jose from 'jose';

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

export interface SupabaseJwtPayload {
  sub: string;
  email?: string;
}

/**
 * Verify a Supabase access token (JWT) and return the payload.
 * Used so the Next.js API can accept mobile app requests with Authorization: Bearer <supabase_access_token>.
 * Supabase signs JWTs with the project's JWT Secret (Dashboard → Settings → API → JWT Secret).
 */
export async function verifySupabaseAccessToken(token: string): Promise<SupabaseJwtPayload | null> {
  if (!SUPABASE_JWT_SECRET || !token) return null;
  try {
    const secret = new TextEncoder().encode(SUPABASE_JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });
    const sub = payload.sub as string | undefined;
    if (!sub) return null;
    return {
      sub,
      email: (payload.email as string) ?? undefined,
    };
  } catch {
    return null;
  }
}
