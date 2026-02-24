import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/auth-context';
import { apiFetch } from '../lib/api';

export interface FeedPost {
  id: string;
  title: string | null;
  content: string | null;
  image_url: string | null;
  image_urls?: string[];
  created_at: string;
  creator_id: string;
  creator: { id: string; display_name: string; photo_url: string | null; vanity_username?: string | null };
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

export interface UnifiedFeedResponse {
  creators: unknown[];
  posts: FeedPost[];
  has_following: boolean;
}

async function fetchFeed(accessToken: string | undefined): Promise<UnifiedFeedResponse> {
  return apiFetch<UnifiedFeedResponse>('/api/dashboard/unified-feed?limit=20', {
    accessToken: accessToken ?? null,
  });
}

export function useFeed() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['feed', session?.user?.id ?? 'anon'],
    queryFn: () => fetchFeed(session?.access_token),
  });
}
