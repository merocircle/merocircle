import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/auth-context';
import { apiFetch } from '../lib/api';

export interface CreatorDashboardResponse {
  profile: { bio: string | null; category: string | null; social_links: Record<string, string>; vanity_username: string | null; cover_image_url: string | null };
  tiers: Array<{ tier_level: number; price: number; tier_name: string; description: string | null; benefits: string[]; extra_perks: string[] }>;
  stats: { monthlyEarnings: number; totalEarnings: number; supporters: number; posts: number };
  onboardingCompleted: boolean;
  posts: Array<{
    id: string;
    title: string;
    content: string;
    image_url: string | null;
    image_urls?: string[];
    created_at: string;
    likes_count: number;
    comments_count: number;
    creator: { id: string; display_name: string; photo_url: string | null };
  }>;
  supporters: Array<{ id: string; name: string; amount: number; joined: string; avatar: string | null }>;
}

export function useCreatorDashboard() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  return useQuery({
    queryKey: ['creator-dashboard', userId],
    queryFn: () => apiFetch<CreatorDashboardResponse>(`/api/creator/${userId}/dashboard`, { accessToken: session?.access_token ?? undefined }),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

export interface CreatorAnalyticsResponse {
  stats: {
    totalEarnings: number;
    supporters: number;
    posts: number;
    likes: number;
    currentMonthEarnings: number;
    earningsGrowth: number;
  };
  charts: {
    earnings: Array<{ month: string; earnings: number }>;
    supporterFlow: Array<{ date: string; supporters: number }>;
    engagement: Array<{ date: string; likes: number; comments: number }>;
  };
  topSupporters: Array<{ id: string; name: string; photo_url: string | null; total_amount: number }>;
}

export function useCreatorAnalytics() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['creator-analytics', session?.user?.id],
    queryFn: () => apiFetch<CreatorAnalyticsResponse>('/api/creator/analytics', { accessToken: session?.access_token ?? undefined }),
    enabled: !!session?.user?.id,
    staleTime: 5 * 60 * 1000,
  });
}
