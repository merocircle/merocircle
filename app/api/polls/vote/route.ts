import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pollId, optionId } = await request.json();

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
      console.error('Error voting:', error);
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
    console.error('Vote API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      console.error('Error removing vote:', error);
      return NextResponse.json({ error: 'Failed to remove vote' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete vote API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
