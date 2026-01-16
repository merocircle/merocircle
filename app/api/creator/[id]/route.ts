import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: creatorId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: creatorProfile, error: profileError } = await supabase
      .from('creator_profiles')
      .select('*, users!inner(id, display_name, email, photo_url, role)')
      .eq('user_id', creatorId)
      .single();

    if (profileError || !creatorProfile) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Check if current user is a supporter

    const { data: paymentMethods } = await supabase
      .from('creator_payment_methods')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('is_active', true);

    let isSupporter = false;
    if (user) {
      const { data: supporterData } = await supabase
        .from('supporters')
        .select('id')
        .eq('supporter_id', user.id)
        .eq('creator_id', creatorId)
        .eq('is_active', true)
        .single();
      isSupporter = !!supporterData;
    }

    let postsQuery = supabase
      .from('posts')
      .select(`
        *,
        post_likes(id, user_id),
        post_comments(id, content, created_at, user_id, users(id, display_name, photo_url)),
        users!posts_creator_id_fkey(id, display_name, photo_url, role),
        polls(id, question, allows_multiple_answers, expires_at)
      `)
      .eq('creator_id', creatorId);

    if (!isSupporter) {
      postsQuery = postsQuery.eq('is_public', true);
    }

    const { data: posts } = await postsQuery
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

    let subscriptionTiers: Array<Record<string, unknown>> = [];
    try {
      const { data: tiers } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('creator_id', creatorId)
        .eq('is_active', true)
        .order('price', { ascending: true });
      subscriptionTiers = tiers || [];
    } catch {
      subscriptionTiers = [];
    }

    const formattedPosts = (posts || []).map((post: {
      id: string;
      title: string;
      content: string;
      image_url: string | null;
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
    }) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      image_url: post.image_url,
      media_url: post.media_url || null,
      is_public: post.is_public,
      tier_required: post.tier_required || 'free',
      post_type: post.post_type || 'post',
      created_at: post.created_at,
      updated_at: post.updated_at,
      creator_id: post.creator_id,
      creator: {
        id: post.users?.id || creatorId,
        display_name: post.users?.display_name || creatorProfile.users.display_name,
        photo_url: post.users?.photo_url || creatorProfile.users.photo_url,
        role: post.users?.role || 'creator'
      },
      creator_profile: {
        category: creatorProfile.category,
        is_verified: creatorProfile.is_verified
      },
      // polls is an object (one-to-one relationship), not an array
      poll: post.polls || null,
      likes: post.post_likes || [],
      comments: post.post_comments || [],
      likes_count: post.post_likes?.length || 0,
      comments_count: post.post_comments?.length || 0
    }));

    return NextResponse.json({
      success: true,
      creatorDetails: {
        user_id: creatorProfile.user_id,
        display_name: creatorProfile.users.display_name,
        email: creatorProfile.users.email,
        avatar_url: creatorProfile.users.photo_url,
        bio: creatorProfile.bio,
        category: creatorProfile.category,
        is_verified: creatorProfile.is_verified,
        supporter_count: supporterCount,
        supporters_count: supporterCount,
        posts_count: postsCount,
        total_earnings: creatorProfile.total_earnings || 0,
        created_at: creatorProfile.created_at,
        is_supporter: isSupporter
      },
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
      subscriptionTiers: (subscriptionTiers || []).map((tier: Record<string, unknown>) => ({
        id: tier.id,
        tier_name: tier.tier_name || tier.name,
        price: Number(tier.price || 0),
        description: tier.description,
        benefits: tier.benefits || [],
        max_subscribers: tier.max_subscribers,
        current_subscribers: tier.current_subscribers || 0
      })),
      posts: formattedPosts
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 