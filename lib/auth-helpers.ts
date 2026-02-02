import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Get the current session in Server Components
 * Usage: const session = await getSession();
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Get the current user in Server Components
 * Usage: const user = await getCurrentUser();
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

/**
 * Require authentication in Server Components
 * Throws an error if not authenticated
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  return session;
}
