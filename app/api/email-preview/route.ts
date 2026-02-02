import { NextRequest, NextResponse } from 'next/server';
import { render } from '@react-email/render';
import {
  PostNotification,
  PollNotification,
  WelcomeEmail,
  PaymentSuccess,
  PaymentFailed,
} from '@/emails/templates';

/**
 * Email preview route - view emails in browser during development
 * 
 * Usage:
 * - /api/email-preview?type=post
 * - /api/email-preview?type=poll
 * - /api/email-preview?type=welcome
 * - /api/email-preview?type=payment-success
 * - /api/email-preview?type=payment-failed
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'post';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    let html: string;

    switch (type) {
      case 'post':
        html = await render(
          PostNotification({
            supporterName: 'Bhuwan Joshi',
            creatorName: 'Bhuwan',
            postTitle: 'Exciting New Project Launch',
            postContent:
              "Hey everyone! I'm thrilled to announce that I'm launching something special that I've been working on for months. This project combines everything I love about creative storytelling with cutting-edge technology.",
            postImageUrl:
              'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=800&h=400&fit=crop',
            postUrl: `${appUrl}/bhuwan/posts/123`,
            appUrl,
          })
        );
        break;

      case 'poll':
        html = await render(
          PollNotification({
            supporterName: 'Bhuwan Joshi',
            creatorName: 'Bhuwan',
            postTitle: 'What content would you like to see next?',
            postContent:
              "I'm planning my content for next month and would love your input! Should I focus on tutorials, behind-the-scenes content, or community Q&A sessions?",
            postUrl: `${appUrl}/bhuwan/posts/456`,
            appUrl,
          })
        );
        break;

      case 'welcome':
        html = await render(
          WelcomeEmail({
            userName: 'Bhuwan Joshi',
            userType: 'creator',
            appUrl,
          })
        );
        break;

      case 'payment-success':
        html = await render(
          PaymentSuccess({
            userName: 'Bhuwan Joshi',
            creatorName: 'Bhuwan',
            amount: 500,
            transactionId: 'TXN-2024-001234',
            appUrl,
          })
        );
        break;

      case 'payment-failed':
        html = await render(
          PaymentFailed({
            userName: 'Bhuwan Joshi',
            creatorName: 'Bhuwan',
            amount: 500,
            reason:
              'Your card was declined. Please check your payment details and try again.',
            appUrl,
          })
        );
        break;

      default:
        return NextResponse.json(
          {
            error: 'Invalid email type',
            availableTypes: [
              'post',
              'poll',
              'welcome',
              'payment-success',
              'payment-failed',
            ],
          },
          { status: 400 }
        );
    }

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to render email',
        message: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
