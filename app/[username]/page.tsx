import { redirect } from 'next/navigation';

/**
 * Legacy vanity URL: /username → /creator/username
 * So shared links like site.com/meandnishar go to site.com/creator/meandnishar.
 */
export default async function LegacyUsernamePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  redirect(`/creator/${encodeURIComponent(username)}`);
}
