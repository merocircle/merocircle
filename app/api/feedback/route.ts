import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, answer, user_id, display_name, is_creator, feedback_type = 'periodic' } = body;

    console.log('[FEEDBACK_API] Received feedback submission:', {
      question,
      answerLength: answer?.length,
      user_id,
      display_name,
      is_creator,
    });

    if (!answer || !answer.trim()) {
      console.log('[FEEDBACK_API] Validation failed: answer is empty');
      return NextResponse.json({ error: 'Answer is required' }, { status: 400 });
    }

    // Store feedback in database (use admin client to bypass RLS)
    const supabase = createAdminClient();
    const feedbackData = {
      question: question || null, // Can be null for user_initiated feedback
      answer: answer.trim(),
      user_id: user_id || null,
      display_name: display_name || 'Anonymous',
      is_creator: is_creator || false,
      feedback_type: feedback_type || 'periodic',
    };

    console.log('[FEEDBACK_API] Inserting feedback:', feedbackData);

    const { data, error: dbError } = await supabase
      .from('feedback')
      .insert(feedbackData)
      .select()
      .single();

    if (dbError) {
      console.error('[FEEDBACK_API] Failed to store feedback:', dbError);
      return NextResponse.json({ error: 'Failed to store feedback' }, { status: 500 });
    }

    console.log('[FEEDBACK_API] Feedback stored successfully:', { id: data?.id });

    return NextResponse.json({ success: true, id: data?.id });
  } catch (error) {
    console.error('[FEEDBACK_API] Error:', error);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}

