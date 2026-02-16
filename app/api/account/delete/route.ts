import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

export async function DELETE() {
  try {
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user) {
      return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const userId = user.id;

    logger.info('Account deletion requested', 'ACCOUNT_DELETE', { userId });

    // Follow the same order as delete_user.sql to respect foreign keys

    // 1. Notifications
    await supabase.from('notifications').delete().eq('user_id', userId);

    // 2. Subscription tiers (creator_id = user UUID)
    await supabase.from('subscription_tiers').delete().eq('creator_id', userId);

    // 3. Get all supporter_transaction IDs for this user, then delete platform_earnings referencing them
    const { data: userTxns } = await supabase
      .from('supporter_transactions')
      .select('id')
      .or(`supporter_id.eq.${userId},creator_id.eq.${userId}`);

    if (userTxns && userTxns.length > 0) {
      const txnIds = userTxns.map((t) => t.id);
      await supabase.from('platform_earnings').delete().in('transaction_id', txnIds);
    }

    // 4. Supporter transactions (both directions)
    await supabase.from('supporter_transactions').delete().or(`supporter_id.eq.${userId},creator_id.eq.${userId}`);

    // 5. Transactions table (if separate)
    await supabase.from('transactions').delete().or(`supporter_id.eq.${userId},creator_id.eq.${userId}`);

    // 6. Supporters (both as supporter and as creator)
    await supabase.from('supporters').delete().or(`supporter_id.eq.${userId},creator_id.eq.${userId}`);

    // 7. Subscriptions
    await supabase.from('subscriptions').delete().or(`supporter_id.eq.${userId},creator_id.eq.${userId}`);

    // 8. Creator payment methods
    await supabase.from('creator_payment_methods').delete().eq('creator_id', userId);

    // 9. Feedback & post views (user-level)
    await supabase.from('feedback').delete().eq('user_id', userId);
    await supabase.from('post_views').delete().eq('user_id', userId);

    // 10. Post interactions by user (likes, comments, poll votes)
    await supabase.from('post_likes').delete().eq('user_id', userId);
    await supabase.from('post_comments').delete().eq('user_id', userId);
    await supabase.from('poll_votes').delete().eq('user_id', userId);

    // 11. If creator: delete interactions on their posts, polls, then posts
    const { data: creatorPosts } = await supabase
      .from('posts')
      .select('id')
      .eq('creator_id', userId);

    if (creatorPosts && creatorPosts.length > 0) {
      const postIds = creatorPosts.map((p) => p.id);

      await supabase.from('post_likes').delete().in('post_id', postIds);
      await supabase.from('post_comments').delete().in('post_id', postIds);
      await supabase.from('post_views').delete().in('post_id', postIds);

      const { data: polls } = await supabase.from('polls').select('id').in('post_id', postIds);
      if (polls && polls.length > 0) {
        const pollIds = polls.map((p) => p.id);
        await supabase.from('poll_votes').delete().in('poll_id', pollIds);
        await supabase.from('poll_options').delete().in('poll_id', pollIds);
        await supabase.from('polls').delete().in('post_id', postIds);
      }

      await supabase.from('posts').delete().eq('creator_id', userId);
    }

    // 12. Creator profile
    await supabase.from('creator_profiles').delete().eq('user_id', userId);

    // 13. Delete user record (cascades remaining)
    const { error: userDeleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (userDeleteError) {
      logger.error('Failed to delete user record', 'ACCOUNT_DELETE', { userId, error: userDeleteError.message });
      return NextResponse.json({ error: 'Failed to delete account. Some data may remain.' }, { status: 500 });
    }

    logger.info('Account deleted successfully', 'ACCOUNT_DELETE', { userId });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Account deletion error', 'ACCOUNT_DELETE', { error: String(error) });
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
