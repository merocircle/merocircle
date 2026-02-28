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
          is_verified,
          supporters_count
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

    const creatorProfile = Array.isArray(creator.creator_profiles)
      ? creator.creator_profiles[0]
      : creator.creator_profiles;
    const bio = creatorProfile?.bio || `Support ${creator.display_name} on MeroCircle`;
    const category = creatorProfile?.category;
    const supporterCount = creatorProfile?.supporters_count || 0;

    // Build a richer description for SEO
    const seoDescription = `${bio.substring(0, 120)}${bio.length > 120 ? '...' : ''}${category ? ` | ${category} creator` : ''} on MeroCircle${supporterCount > 0 ? ` | ${supporterCount} supporters` : ''}`;

    // Post-specific metadata
    if (postId) {
      const { data: post } = await supabase
        .from('posts')
        .select('id, title, content, image_url, image_urls')
        .eq('id', postId)
        .eq('creator_id', creator.id)
        .single();

      if (post) {
        const postImage = post.image_urls?.[0] || post.image_url;
        const postDescription = post.content
          ? post.content.substring(0, 160) + (post.content.length > 160 ? '...' : '')
          : `A post by ${creator.display_name} on MeroCircle`;
        const postUrl = `${appUrl}${canonicalPath}?post=${postId}`;
        const ogImages = postImage
          ? [{ url: postImage, width: 1200, height: 630, alt: post.title }]
          : creator.photo_url
            ? [{ url: creator.photo_url, width: 400, height: 400, alt: creator.display_name }]
            : [];

        return {
          title: `${post.title} by ${creator.display_name} | MeroCircle`,
          description: postDescription,
          alternates: { canonical: postUrl },
          openGraph: {
            title: `${post.title} by ${creator.display_name}`,
            description: postDescription,
            images: ogImages,
            url: postUrl,
            siteName: 'MeroCircle',
            type: 'article',
          },
          twitter: {
            card: postImage ? 'summary_large_image' : 'summary',
            title: `${post.title} by ${creator.display_name}`,
            description: postDescription,
            images: ogImages.map(img => img.url),
          },
        };
      }
    }

    // Profile-level metadata
    const profileUrl = `${appUrl}${canonicalPath}`;
    const profileTitle = `${creator.display_name}${category ? ` - ${category}` : ''} | MeroCircle`;
    // Use "summary" card for profiles so the profile picture appears as a square icon on WhatsApp/Twitter
    const ogImages = creator.photo_url
      ? [{ url: creator.photo_url, width: 400, height: 400, alt: creator.display_name }]
      : [];

    return {
      title: profileTitle,
      description: seoDescription.substring(0, 160),
      alternates: { canonical: profileUrl },
      keywords: [
        creator.display_name,
        ...(category ? [category, `${category} Nepal`, `${category} creator`] : []),
        'MeroCircle',
        'Nepal creator',
        'support creator Nepal',
      ],
      openGraph: {
        title: profileTitle,
        description: seoDescription.substring(0, 160),
        images: ogImages,
        url: profileUrl,
        siteName: 'MeroCircle',
        type: 'profile',
      },
      twitter: {
        card: 'summary',
        title: profileTitle,
        description: seoDescription.substring(0, 160),
        images: ogImages.map(img => img.url),
      },
      other: {
        // WhatsApp and messaging apps use these
        'og:image:width': '400',
        'og:image:height': '400',
      },
    };
  } catch (error) {
    const { logger } = await import('@/lib/logger');
    logger.error('Error generating metadata', 'CREATOR_LAYOUT', { error: error instanceof Error ? error.message : String(error) });
    return {
      title: 'Creator | MeroCircle',
      description: 'Discover and support amazing creators from Nepal',
    };
  }
}

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
