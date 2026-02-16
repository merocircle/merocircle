import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleApiError, getOptionalUser } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: creatorId } = await params;
    const supabase = await createClient();
    const user = await getOptionalUser();

    const { data: creatorProfile, error: profileError } = await supabase
      .from('creator_profiles')
      .select(`
        user_id,
        vanity_username,
        bio,
        category,
        is_verified,
        supporters_count,
        posts_count,
        likes_count,
        total_earnings,
        created_at,
        updated_at,
        social_links,
        cover_image_url,
        onboarding_completed,
        users!inner(id, display_name, email, photo_url, role, username)
      `)
      .eq('user_id', creatorId)
      .single();

    if (profileError || !creatorProfile) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    const creatorUser = Array.isArray(creatorProfile.users)
      ? creatorProfile.users[0]
      : (creatorProfile.users as { id: string; display_name: string; email: string; photo_url: string | null; role: string; username: string | null } | undefined);

    // Check if current user is a supporter and their tier level
    const { data: paymentMethods } = await supabase
      .from('creator_payment_methods')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('is_active', true);

    // Check supporter status if user is authenticated
    const { data: supporterData, error: supporterQueryError } = user ? await supabase
      .from('supporters')
      .select('tier_level, is_active, supporter_id, creator_id')
      .eq('supporter_id', user.id)
      .eq('creator_id', creatorId)
      .eq('is_active', true)
      .maybeSingle() : { data: null, error: null };
    
    // Comprehensive logging for debugging
    if (user) {
      logger.info('Checking supporter status', 'CREATOR_API', {
        userId: user.id,
        creatorId,
        supporterFound: !!supporterData,
        supporterData: supporterData ? {
          tier_level: supporterData.tier_level,
          is_active: supporterData.is_active,
        } : null,
        queryError: supporterQueryError?.message,
      });
    }
    
    const isSupporter = !!supporterData;
    const supporterTierLevel = supporterData?.tier_level || 0;
    
    logger.info('Supporter status determined', 'CREATOR_API', {
      userId: user?.id,
      creatorId,
      isSupporter,
      supporterTierLevel,
    });

    // Get subscription tiers for this creator
    const { data: tiers } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('is_active', true)
      .order('tier_level', { ascending: true });

    // Fetch ALL posts (both public and supporter-only) so non-supporters can see they exist
    const { data: posts } = await supabase
      .from('posts')
      .select(`
        *,
        post_likes(id, user_id),
        post_comments(id, content, created_at, user_id, users(id, display_name, photo_url)),
        users!posts_creator_id_fkey(id, display_name, photo_url, role),
        polls(id, question, allows_multiple_answers, expires_at)
      `)
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false })
      .limit(20);

    const { count: actualPostsCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', creatorId);

    // Use supporters_count from creator_profiles (updated by trigger)
    const supporterCount = creatorProfile.supporters_count || 0;
    
    const postsCount = creatorProfile.posts_count > 0 
      ? creatorProfile.posts_count 
      : (actualPostsCount || 0);


    const formattedPosts = (posts || []).map((post: {
      id: string;
      title: string;
      content: string;
      image_url: string | null;
      image_urls?: string[];
      media_url: string | null;
      is_public: boolean;
      tier_required: string | null;
      post_type?: string;
      created_at: string;
      updated_at: string;
      creator_id: string;
      users?: { id: string; display_name: string; photo_url: string | null; role: string };
      post_likes?: Array<{ id: string; user_id: string }>;
      post_comments?: Array<{ id: string; content: string; created_at: string }>;
      polls?: { id: string; question: string; allows_multiple_answers: boolean; expires_at: string | null };
    }) => {
      // Check if this is a supporter-only post
      const isSupporterOnly = !post.is_public || (post.tier_required && post.tier_required !== 'free');
      // Allow access if: user is the creator themselves, or user is a supporter
      const shouldHideContent = isSupporterOnly && !isSupporter && user?.id !== creatorId;

      return {
        id: post.id,
        title: post.title,
        // For non-supporters viewing supporter-only posts: hide text content only
        content: shouldHideContent ? null : post.content,
        // Send image URLs so the UI can show a blurred preview and "Subscribe to access"
        image_url: post.image_url,
        image_urls: post.image_urls || [],
        media_url: post.media_url,
        is_public: post.is_public,
        tier_required: post.tier_required || 'free',
        post_type: post.post_type || 'post',
        created_at: post.created_at,
        updated_at: post.updated_at,
        creator_id: post.creator_id,
        creator: {
          id: post.users?.id || creatorId,
          display_name: post.users?.display_name || creatorUser?.display_name,
          photo_url: post.users?.photo_url ?? creatorUser?.photo_url,
          role: post.users?.role || 'creator'
        },
        creator_profile: {
          category: creatorProfile.category,
          is_verified: creatorProfile.is_verified
        },
        // Hide poll data for non-supporters viewing supporter-only posts
        poll: shouldHideContent ? null : (post.polls || null),
        likes: post.post_likes || [],
        comments: post.post_comments || [],
        likes_count: post.post_likes?.length || 0,
        comments_count: post.post_comments?.length || 0,
        is_liked: !!user && (post.post_likes || []).some((like) => like.user_id === user.id)
      };
    });

    const responseData = {
      success: true,
      creatorDetails: {
        user_id: creatorProfile.user_id,
        display_name: creatorUser?.display_name ?? '',
        email: creatorUser?.email ?? '',
        avatar_url: creatorUser?.photo_url ?? null,
        username: (creatorProfile.vanity_username?.trim() || creatorUser?.username) ?? null,
        bio: creatorProfile.bio,
        category: creatorProfile.category,
        is_verified: creatorProfile.is_verified,
        supporter_count: supporterCount,
        supporters_count: supporterCount,
        posts_count: postsCount,
        total_earnings: creatorProfile.total_earnings || 0,
        created_at: creatorProfile.created_at,
        is_supporter: isSupporter,
        supporter_tier_level: supporterTierLevel,
        social_links: creatorProfile.social_links || {},
        cover_image_url: creatorProfile.cover_image_url || null
      },
      tiers: (tiers || []).map((tier: any) => {
        const extraPerks = Array.isArray(tier.extra_perks) ? tier.extra_perks : [];
        const legacyExtra = tier.tier3_extra_perks ? [String(tier.tier3_extra_perks)] : [];

        return {
          id: tier.id,
          tier_level: tier.tier_level,
          tier_name: tier.tier_name,
          price: Number(tier.price),
          description: tier.description,
          benefits: tier.benefits || [],
          extra_perks: [...extraPerks, ...legacyExtra].filter((perk: string) => perk.trim() !== '')
        };
      }),
      paymentMethods: (paymentMethods || []).map((m: {
        id: string;
        payment_type: string;
        phone_number: string | null;
        qr_code_url: string | null;
        account_number: string | null;
        merchant_id: string | null;
        is_active: boolean;
        is_verified: boolean;
      }) => ({
        id: m.id,
        payment_type: m.payment_type,
        details: {
          phone_number: m.phone_number,
          qr_code_url: m.qr_code_url,
          account_number: m.account_number,
          merchant_id: m.merchant_id
        },
        is_active: m.is_active,
        is_verified: m.is_verified
      })),
      posts: formattedPosts
    };
    
    // Log response data for debugging
    logger.info('Creator API response prepared', 'CREATOR_API', {
      creatorId,
      userId: user?.id,
      isSupporter: responseData.creatorDetails.is_supporter,
      supporterTierLevel: responseData.creatorDetails.supporter_tier_level,
      postsCount: responseData.posts.length,
      publicPostsCount: responseData.posts.filter((p: any) => !p.shouldHideContent).length,
      hiddenPostsCount: responseData.posts.filter((p: any) => p.shouldHideContent).length,
    });
    
    return NextResponse.json(responseData, {
      headers: {
        // No caching for supporter status - always fetch fresh to reflect recent payments/tier changes
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    return handleApiError(error, 'CREATOR_API', 'Failed to fetch creator details');
  }
} 
