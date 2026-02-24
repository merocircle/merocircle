import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/auth-context';
import { apiFetch } from '../lib/api';

export interface CreatorDetails {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  username: string | null;
  bio: string | null;
  category: string | null;
  is_verified: boolean;
  supporter_count: number;
  supporters_count: number;
  posts_count: number;
  is_supporter: boolean;
}

export interface CreatorPost {
  id: string;
  content: string | null;
  image_url: string | null;
  image_urls?: string[];
  creator: { id: string; display_name: string; photo_url: string | null };
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

export interface CreatorResponse {
  success: boolean;
  creatorDetails: CreatorDetails;
  posts: CreatorPost[];
  tiers?: unknown[];
  paymentMethods?: unknown[];
}

async function fetchCreator(identifier: string, accessToken: string | undefined): Promise<CreatorResponse> {
  const path = `/api/creator/${encodeURIComponent(identifier)}`;
  return apiFetch<CreatorResponse>(path, {
    accessToken: accessToken ?? null,
  });
}

/** Fetches creator profile and posts. identifier can be creator user_id (UUID) or vanity slug. Same API route handles both. */
export function useCreator(identifier: string | null) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['creator', identifier, session?.user?.id ?? 'anon'],
    queryFn: () => fetchCreator(identifier!, session?.access_token),
    enabled: !!identifier,
  });
}
