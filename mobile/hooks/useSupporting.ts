import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/auth-context';
import { apiFetch } from '../lib/api';

export interface SupportedCreator {
  id: string;
  display_name: string;
  photo_url: string | null;
  bio?: string | null;
  vanity_username?: string | null;
  category?: string | null;
}

export interface SupportersResponse {
  creators: SupportedCreator[];
}

export function useSupportedCreators() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['supporting', session?.user?.id],
    queryFn: () => apiFetch<SupportersResponse>('/api/supporter/creators', { accessToken: session?.access_token ?? undefined }),
    enabled: !!session?.user?.id,
    staleTime: 2 * 60 * 1000,
  });
}
