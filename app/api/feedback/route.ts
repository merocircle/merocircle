import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, answer, user_id, display_name, is_creator } = body;

    if (!answer || !answer.trim()) {
      return NextResponse.json({ error: 'Answer is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Store feedback in database
    const { error: dbError } = await supabase.from('feedback').insert({
      question,
      answer: answer.trim(),
      user_id: user_id || null,
      display_name: display_name || 'Anonymous',
      is_creator: is_creator || false,
    });

    if (dbError) {
      console.error('Failed to store feedback:', dbError);
      // Don't fail the request if DB insert fails - still try email
    }

    // Send email to team
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.hostinger.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      const roleLabel = is_creator ? 'Creator' : 'Supporter';
      const nameLabel = display_name || 'Anonymous';

      await transporter.sendMail({
        from: process.env.SMTP_FROM_EMAIL || 'noreply@merocircle.app',
        to: 'team@merocircle.app',
        subject: `[Feedback] ${roleLabel}: ${nameLabel}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; margin-bottom: 4px;">New Feedback</h2>
            <p style="color: #888; font-size: 13px; margin-top: 0;">From ${nameLabel} (${roleLabel})</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
            <p style="color: #666; font-size: 14px; margin-bottom: 4px;"><strong>Question:</strong></p>
            <p style="color: #333; font-size: 15px; margin-top: 0;">${question}</p>
            <p style="color: #666; font-size: 14px; margin-bottom: 4px; margin-top: 16px;"><strong>Answer:</strong></p>
            <p style="color: #333; font-size: 15px; margin-top: 0; background: #f9f9f9; padding: 12px 16px; border-radius: 8px;">${answer.trim()}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
            <p style="color: #999; font-size: 12px;">User ID: ${user_id || 'Not logged in'}</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send feedback email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}
