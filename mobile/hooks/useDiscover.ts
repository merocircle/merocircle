import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

export interface DiscoverCreator {
  user_id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  vanity_username: string | null;
  category: string | null;
  is_verified: boolean;
  supporter_count: number;
  posts_count: number;
  total_earned?: number;
}

export interface DiscoverPost {
  id: string;
  creator_id: string;
  content: string;
  image_url: string | null;
  image_urls?: string[];
  created_at: string;
  creator: { user_id: string; display_name: string; avatar_url: string | null };
}

export interface DiscoverResponse {
  trending_creators: DiscoverCreator[];
  recent_posts: DiscoverPost[];
  suggested_creators: DiscoverCreator[];
}

async function fetchDiscover(): Promise<DiscoverResponse> {
  return apiFetch<DiscoverResponse>('/api/social/discover');
}

export function useDiscover() {
  return useQuery({
    queryKey: ['discover'],
    queryFn: fetchDiscover,
  });
}
