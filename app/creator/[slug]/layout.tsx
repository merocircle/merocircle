import { Metadata } from 'next';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { resolveCreatorSlug } from '@/lib/creator-resolve';

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ post?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const postId = resolvedSearchParams?.post;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://merocircle.app';
  const resolved = await resolveCreatorSlug(slug);
  if (!resolved) {
    return {
      title: 'Creator Not Found | MeroCircle',
      description: 'Discover and support amazing creators from Nepal',
    };
  }
  const { creatorId, username } = resolved;
  const canonicalPath = username ? `/creator/${username}` : `/creator/${creatorId}`;

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: creator } = await supabase
      .from('users')
      .select(`
        id,
        display_name,
        photo_url,
        creator_profiles (
          bio,
          category,
          is_verified
        )
      `)
      .eq('id', creatorId)
      .single();

    if (!creator) {
      return {
        title: 'Creator Not Found | MeroCircle',
        description: 'Discover and support amazing creators from Nepal',
      };
    }

    if (postId) {
      const { data: post } = await supabase
        .from('posts')
        .select('id, title, content, image_url, image_urls')
        .eq('id', postId)
        .eq('creator_id', creator.id)
        .single();

      if (post) {
        const postImage = post.image_urls?.[0] || post.image_url;
        const postDescription = post.content.substring(0, 160) + (post.content.length > 160 ? '...' : '');
        const postUrl = `${appUrl}${canonicalPath}?post=${postId}`;
        return {
          title: `${post.title} by ${creator.display_name} | MeroCircle`,
          description: postDescription,
          openGraph: {
            title: post.title,
            description: postDescription,
            images: postImage ? [postImage] : creator.photo_url ? [creator.photo_url] : [],
            url: postUrl,
            siteName: 'MeroCircle',
            type: 'article',
          },
          twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: postDescription,
            images: postImage ? [postImage] : creator.photo_url ? [creator.photo_url] : [],
          },
        };
      }
    }

    const creatorProfile = Array.isArray(creator.creator_profiles)
      ? creator.creator_profiles[0]
      : creator.creator_profiles;
    const bio = creatorProfile?.bio || `Support ${creator.display_name} on MeroCircle`;
    const category = creatorProfile?.category;

    return {
      title: `${creator.display_name}${category ? ` - ${category}` : ''} | MeroCircle`,
      description: bio.substring(0, 160),
      openGraph: {
        title: `Support ${creator.display_name} on MeroCircle`,
        description: bio.substring(0, 160),
        images: creator.photo_url ? [creator.photo_url] : [],
        url: `${appUrl}${canonicalPath}`,
        siteName: 'MeroCircle',
        type: 'profile',
      },
      twitter: {
        card: 'summary_large_image',
        title: `Support ${creator.display_name}`,
        description: bio.substring(0, 160),
        images: creator.photo_url ? [creator.photo_url] : [],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'MeroCircle - Support Local Creators',
      description: 'Discover and support amazing creators from Nepal',
    };
  }
}

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
