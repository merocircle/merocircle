import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, answer, user_id, display_name, is_creator, feedback_type = 'periodic' } = body;

    logger.info('Received feedback submission', 'FEEDBACK_API', {
      question,
      answerLength: answer?.length,
      user_id,
      display_name,
      is_creator,
    });

    if (!answer || !answer.trim()) {
      logger.warn('Validation failed: answer is empty', 'FEEDBACK_API');
      return NextResponse.json({ error: 'Answer is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const feedbackData = {
      question: question || null,
      answer: answer.trim(),
      user_id: user_id || null,
      display_name: display_name || 'Anonymous',
      is_creator: is_creator || false,
      feedback_type: feedback_type || 'periodic',
    };

    logger.debug('Inserting feedback', 'FEEDBACK_API', feedbackData);

    const { data, error: dbError } = await supabase
      .from('feedback')
      .insert(feedbackData)
      .select()
      .single();

    if (dbError) {
      logger.error('Failed to store feedback', 'FEEDBACK_API', { error: dbError.message });
      return NextResponse.json({ error: 'Failed to store feedback' }, { status: 500 });
    }

    logger.info('Feedback stored successfully', 'FEEDBACK_API', { id: data?.id });

    return NextResponse.json({ success: true, id: data?.id });
  } catch (error) {
    logger.error('Feedback submission error', 'FEEDBACK_API', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}

