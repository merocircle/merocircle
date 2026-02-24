import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * Debug endpoint to verify NextAuth env vars are loaded.
 * Only works in development. Does NOT expose actual secret values.
 */
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  logger.debug('Auth debug config requested', 'AUTH_DEBUG_CONFIG');
  const checks = {
    NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
  };

  const allOk = Object.values(checks).every(Boolean);
  const missing = Object.entries(checks)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  return NextResponse.json({
    ok: allOk,
    checks,
    ...(missing.length > 0 && { missing, hint: "Add these to .env.local and restart the dev server" }),
  });
}
