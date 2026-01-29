import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { pollId } = await params;

    // Get poll details
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    // Get poll options
    const { data: options, error: optionsError } = await supabase
      .from('poll_options')
      .select('*')
      .eq('poll_id', pollId)
      .order('position', { ascending: true });

    if (optionsError) {
      return NextResponse.json({ error: 'Failed to fetch options' }, { status: 500 });
    }

    // Get all votes
    const { data: votes, error: votesError } = await supabase
      .from('poll_votes')
      .select('option_id, user_id')
      .eq('poll_id', pollId);

    if (votesError) {
      return NextResponse.json({ error: 'Failed to fetch votes' }, { status: 500 });
    }

    // Calculate vote counts
    const voteCounts: Record<string, number> = {};
    const totalVotes = votes?.length || 0;

    votes?.forEach((vote: any) => {
      voteCounts[vote.option_id] = (voteCounts[vote.option_id] || 0) + 1;
    });

    // Check if current user has voted
    const userVotes = user ? votes?.filter((v: any) => v.user_id === user.id).map((v: any) => v.option_id) : [];

    // Add vote counts and percentages to options
    const optionsWithStats = options?.map((option: any) => ({
      ...option,
      votes: voteCounts[option.id] || 0,
      percentage: totalVotes > 0 ? Math.round(((voteCounts[option.id] || 0) / totalVotes) * 100) : 0
    }));

    return NextResponse.json({
      poll,
      options: optionsWithStats,
      totalVotes,
      userVotes,
      hasExpired: poll.expires_at ? new Date(poll.expires_at) < new Date() : false
    });
  } catch (error) {
    return handleApiError(error, 'POLLS_API', 'Failed to fetch poll');
  }
}
