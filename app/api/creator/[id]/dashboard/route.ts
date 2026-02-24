import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateMonthlyTotal, calculateTotalAmount } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { getAuthenticatedUser, requireCreatorRole, handleApiError } from '@/lib/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: creatorId } = await params;
    
    // Authenticate and verify creator role
    const { user, errorResponse: authError } = await getAuthenticatedUser(request);
    if (authError || !user) return authError || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    if (user.id !== creatorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { isCreator, errorResponse: roleError } = await requireCreatorRole(creatorId);
    if (roleError) return roleError;

    const supabase = await createClient();

    let creatorProfile = null;
    const { data: profileData, error: profileError } = await supabase
      .from('creator_profiles')
      .select(`
        user_id,
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
        vanity_username
      `)
      .eq('user_id', creatorId)
      .single();

    creatorProfile = profileData;

    if (!creatorProfile && profileError?.code === 'PGRST116') {
      const { data: newProfile } = await supabase
        .from('creator_profiles')
        .insert({
          user_id: creatorId,
          bio: null,
          category: null,
          is_verified: false,
          total_earnings: 0,
          supporters_count: 0
        })
        .select()
        .single();

      if (newProfile) {
        creatorProfile = newProfile;
        // Channels will be automatically created by database trigger
        logger.info('Creator profile created, channels will be auto-created by trigger', 'CREATOR_DASHBOARD_API', {
          creatorId
        });
      }
    }

    const profileToUse = creatorProfile || {
      id: creatorId,
      user_id: creatorId,
      bio: null,
      category: null,
      is_verified: false,
      total_earnings: 0,
      supporters_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: posts } = await supabase
      .from('posts')
      .select(`
        *,
        post_likes(id, user_id),
        post_comments(
          id,
          content,
          created_at,
          user:users(id, display_name, photo_url)
        ),
        users!posts_creator_id_fkey(id, display_name, photo_url, role),
        polls(
          id,
          question,
          allows_multiple_answers,
          expires_at
        )
      `)
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false })
      .limit(20);

    const { data: supporters } = await supabase
      .from('supporters')
      .select('*, users!supporters_supporter_id_fkey(id, display_name, photo_url)')
      .eq('creator_id', creatorId)
      .eq('is_active', true);

    const { data: transactions } = await supabase
      .from('supporter_transactions')
      .select('amount, created_at')
      .eq('creator_id', creatorId)
      .eq('status', 'completed');

    const totalEarnings = calculateTotalAmount(transactions || []);
    const monthlyEarnings = calculateMonthlyTotal(transactions || []);

    const { data: tiersData } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('creator_id', creatorId)
      .order('tier_level', { ascending: true });

    return NextResponse.json({
      profile: {
        bio: profileToUse.bio,
        category: profileToUse.category,
        social_links: profileToUse.social_links || {},
        vanity_username: profileToUse.vanity_username ?? null,
        cover_image_url: profileToUse.cover_image_url ?? null,
      },
      tiers: (tiersData || []).map((t: { tier_level: number; price: number; tier_name: string; description: string | null; benefits: string[]; extra_perks: string[] }) => ({
        tier_level: t.tier_level,
        price: t.price,
        tier_name: t.tier_name,
        description: t.description,
        benefits: t.benefits || [],
        extra_perks: t.extra_perks || [],
      })),
      stats: {
        monthlyEarnings,
        totalEarnings,
        supporters: supporters?.length || 0,
        posts: posts?.length || 0
      },
      onboardingCompleted: profileToUse.onboarding_completed || false,
      posts: (posts || []).map((p: {
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
        post_comments?: Array<{ id: string; content: string; created_at: string; user?: { id: string; display_name: string; photo_url: string | null } }>;
        polls?: Array<{ id: string; question: string; allows_multiple_answers: boolean; expires_at: string | null }>;
      }) => ({
        id: p.id,
        title: p.title,
        content: p.content,
        image_url: p.image_url,
        image_urls: p.image_urls || [],
        media_url: p.media_url,
        is_public: p.is_public,
        tier_required: p.tier_required || 'free',
        post_type: p.post_type || 'post',
        created_at: p.created_at,
        updated_at: p.updated_at,
        creator_id: p.creator_id,
        creator: {
          id: p.users?.id || p.creator_id,
          display_name: p.users?.display_name || 'Creator',
          photo_url: p.users?.photo_url || null,
          role: p.users?.role || 'creator'
        },
        creator_profile: {
          category: profileToUse.category || null,
          is_verified: profileToUse.is_verified || false
        },
        // polls is an object (one-to-one relationship), not an array
        poll: p.polls || null,
        likes: p.post_likes || [],
        comments: (p.post_comments || []).map((c: { id: string; content: string; created_at: string; user?: { id: string; display_name: string; photo_url: string | null } }) => ({
          id: c.id,
          content: c.content,
          created_at: c.created_at,
          user: c.user || { id: null, display_name: 'Unknown', photo_url: null }
        })),
        likes_count: p.post_likes?.length || 0,
        comments_count: p.post_comments?.length || 0
      })),
      supporters: (supporters || []).map((s: { supporter_id: string; amount: number | string; created_at: string; users?: { display_name: string; photo_url: string | null } }) => ({
        id: s.supporter_id,
        name: s.users?.display_name || 'Supporter',
        amount: Number(s.amount) || 0,
        joined: s.created_at,
        avatar: s.users?.photo_url
      }))
    });
  } catch (error) {
    return handleApiError(error, 'CREATOR_DASHBOARD_API', 'Failed to fetch creator dashboard');
  }
}

