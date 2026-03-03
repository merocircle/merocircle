import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser, handleApiError } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user) return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = await createClient();

    const { pollId, optionId } = await request.json();
    logger.info('Poll vote', 'POLLS_VOTE_API', { pollId, optionId, userId: user.id });

    if (!pollId || !optionId) {
      return NextResponse.json({ error: 'Missing pollId or optionId' }, { status: 400 });
    }

    // Check if poll allows multiple answers
    const { data: poll } = await supabase
      .from('polls')
      .select('allows_multiple_answers, expires_at')
      .eq('id', pollId)
      .single();

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    // Check if poll has expired
    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Poll has expired' }, { status: 400 });
    }

    // If poll doesn't allow multiple answers, check if user has already voted
    if (!poll.allows_multiple_answers) {
      const { data: existingVote } = await supabase
        .from('poll_votes')
        .select('id')
        .eq('poll_id', pollId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingVote) {
        // Remove previous vote if changing answer
        await supabase
          .from('poll_votes')
          .delete()
          .eq('poll_id', pollId)
          .eq('user_id', user.id);
      }
    }

    // Add the vote
    const { data: vote, error } = await supabase
      .from('poll_votes')
      .insert({
        poll_id: pollId,
        option_id: optionId,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
    }

    // Get updated vote counts
    const { data: results } = await supabase
      .from('poll_votes')
      .select('option_id')
      .eq('poll_id', pollId);

    const voteCounts: Record<string, number> = {};
    results?.forEach((v: any) => {
      voteCounts[v.option_id] = (voteCounts[v.option_id] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      vote,
      voteCounts
    });
  } catch (error) {
    return handleApiError(error, 'POLLS_VOTE_API', 'Failed to vote');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user) return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const pollId = searchParams.get('pollId');
    const optionId = searchParams.get('optionId');

    if (!pollId || !optionId) {
      return NextResponse.json({ error: 'Missing pollId or optionId' }, { status: 400 });
    }

    const { error } = await supabase
      .from('poll_votes')
      .delete()
      .eq('poll_id', pollId)
      .eq('option_id', optionId)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to remove vote' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'POLLS_VOTE_API', 'Failed to remove vote');
  }
}
