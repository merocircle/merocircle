import { NextRequest, NextResponse } from 'next/server';
import { render } from '@react-email/render';
import {
  PostNotification,
  PollNotification,
  WelcomeEmail,
  PaymentSuccess,
  PaymentFailed,
  SubscriptionConfirmation,
  NewSupporterNotification,
  SubscriptionExpiringReminder,
  SubscriptionExpiredNotification,
  ChannelMentionNotification,
} from '@/emails/templates';

/**
 * Email preview route — view all email templates in the browser
 * 
 * Visit /api/email-preview to see the full index.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const allTypes = [
    'post',
    'poll',
    'welcome',
    'welcome-supporter',
    'payment-success',
    'payment-failed',
    'subscription-confirmation',
    'new-supporter',
    'subscription-expiring',
    'subscription-expired',
    'channel-mention',
  ];

  // If no type specified, show an index page
  if (!type) {
    const links = allTypes
      .map(t => `<li style="margin:8px 0"><a href="/api/email-preview?type=${t}" style="color:#c4382a;text-decoration:none;font-size:15px;font-weight:500">${t}</a></li>`)
      .join('');
    const indexHtml = `
      <!DOCTYPE html>
      <html><head><title>Email Previews — MeroCircle</title></head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:48px auto;padding:0 20px;color:#1c1917">
        <div style="height:3px;background:linear-gradient(90deg,#c4382a,#e76f51);border-radius:2px;margin-bottom:32px"></div>
        <h1 style="font-size:22px;font-weight:700;margin-bottom:4px">Email Templates</h1>
        <p style="color:#78716c;font-size:14px;margin-bottom:28px">Click a template to preview</p>
        <ul style="list-style:none;padding:0">${links}</ul>
        <p style="color:#a8a29e;font-size:12px;margin-top:40px">Edit templates in <code>emails/templates/</code> and refresh.</p>
      </body></html>
    `;
    return new NextResponse(indexHtml, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  try {
    let html: string;

    switch (type) {
      case 'post':
        html = await render(
          PostNotification({
            supporterName: 'Sita Sharma',
            creatorName: 'Bhuwan',
            postTitle: 'Exciting New Project Launch',
            postContent:
              "Hey everyone! I'm thrilled to announce that I'm launching something special that I've been working on for months. This project combines everything I love about creative storytelling with cutting-edge technology.",
            postImageUrl:
              'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=800&h=400&fit=crop',
            postUrl: `${appUrl}/creator/bhuwan/posts/123`,
            creatorProfileUrl: `${appUrl}/creator/bhuwan`,
            settingsUrl: `${appUrl}/settings`,
            helpUrl: `${appUrl}/help`,
          })
        );
        break;

      case 'poll':
        html = await render(
          PollNotification({
            supporterName: 'Sita Sharma',
            creatorName: 'Bhuwan',
            pollQuestion: 'What content would you like to see next?',
            pollDescription:
              "I'm planning my content for next month and would love your input! Should I focus on tutorials, behind-the-scenes content, or community Q&A sessions?",
            pollUrl: `${appUrl}/creator/bhuwan/posts/456`,
            creatorProfileUrl: `${appUrl}/creator/bhuwan`,
            settingsUrl: `${appUrl}/settings`,
            helpUrl: `${appUrl}/help`,
          })
        );
        break;

      case 'welcome':
        html = await render(
          WelcomeEmail({
            userName: 'Bhuwan Joshi',
            userRole: 'creator',
            profileUrl: `${appUrl}/profile`,
            exploreUrl: `${appUrl}/explore`,
            settingsUrl: `${appUrl}/settings`,
            helpUrl: `${appUrl}/help`,
            appUrl,
          })
        );
        break;

      case 'welcome-supporter':
        html = await render(
          WelcomeEmail({
            userName: 'Sita Sharma',
            userRole: 'supporter',
            profileUrl: `${appUrl}/profile`,
            exploreUrl: `${appUrl}/explore`,
            settingsUrl: `${appUrl}/settings`,
            helpUrl: `${appUrl}/help`,
            appUrl,
          })
        );
        break;

      case 'payment-success':
        html = await render(
          PaymentSuccess({
            supporterName: 'Sita Sharma',
            creatorName: 'Bhuwan',
            amount: 500,
            currency: 'NPR',
            transactionId: 'TXN-2024-001234',
            creatorProfileUrl: `${appUrl}/creator/bhuwan`,
            receiptUrl: `${appUrl}/payment/receipt/TXN-2024-001234`,
            settingsUrl: `${appUrl}/settings`,
            helpUrl: `${appUrl}/help`,
          })
        );
        break;

      case 'payment-failed':
        html = await render(
          PaymentFailed({
            supporterName: 'Sita Sharma',
            creatorName: 'Bhuwan',
            amount: 500,
            currency: 'NPR',
            errorMessage: 'Your card was declined. Please check your payment details and try again.',
            retryUrl: `${appUrl}/creator/bhuwan`,
            creatorProfileUrl: `${appUrl}/creator/bhuwan`,
            settingsUrl: `${appUrl}/settings`,
            helpUrl: `${appUrl}/help`,
          })
        );
        break;

      case 'subscription-confirmation':
        html = await render(
          SubscriptionConfirmation({
            supporterName: 'Sita Sharma',
            creatorName: 'Bhuwan',
            tierLevel: 2,
            tierName: 'Inner Circle',
            amount: 500,
            currency: 'NPR',
            creatorProfileUrl: `${appUrl}/creator/bhuwan`,
            chatUrl: `${appUrl}/chat`,
            settingsUrl: `${appUrl}/settings`,
            helpUrl: `${appUrl}/help`,
          })
        );
        break;

      case 'new-supporter':
        html = await render(
          NewSupporterNotification({
            creatorName: 'Bhuwan',
            supporterName: 'Sita Sharma',
            tierLevel: 2,
            tierName: 'Inner Circle',
            amount: 500,
            currency: 'NPR',
            supporterMessage: "I love your work! Can't wait to see what's next.",
            creatorStudioUrl: `${appUrl}/profile`,
            supportersUrl: `${appUrl}/profile/supporters`,
            settingsUrl: `${appUrl}/settings`,
            helpUrl: `${appUrl}/help`,
          })
        );
        break;

      case 'subscription-expiring':
        html = await render(
          SubscriptionExpiringReminder({
            supporterName: 'Sita Sharma',
            creatorName: 'Bhuwan',
            daysUntilExpiry: 3,
            expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            tierLevel: 2,
            renewUrl: `${appUrl}/creator/bhuwan?renew=true`,
            creatorProfileUrl: `${appUrl}/creator/bhuwan`,
            settingsUrl: `${appUrl}/settings`,
            helpUrl: `${appUrl}/help`,
          })
        );
        break;

      case 'subscription-expired':
        html = await render(
          SubscriptionExpiredNotification({
            supporterName: 'Sita Sharma',
            creatorName: 'Bhuwan',
            renewUrl: `${appUrl}/creator/bhuwan?renew=true`,
            creatorProfileUrl: `${appUrl}/creator/bhuwan`,
            settingsUrl: `${appUrl}/settings`,
            helpUrl: `${appUrl}/help`,
          })
        );
        break;

      case 'channel-mention':
        html = await render(
          ChannelMentionNotification({
            memberName: 'Sita Sharma',
            creatorName: 'Bhuwan',
            channelName: 'general',
            messageText: 'Hey @Sita, check out this new idea I had for the project!',
            senderName: 'Bhuwan',
            channelUrl: `${appUrl}/chat/general`,
            creatorProfileUrl: `${appUrl}/creator/bhuwan`,
            settingsUrl: `${appUrl}/settings`,
            helpUrl: `${appUrl}/help`,
            mentionType: 'you',
          })
        );
        break;

      default:
        return NextResponse.json(
          {
            error: 'Invalid email type',
            availableTypes: allTypes,
            hint: 'Visit /api/email-preview (no ?type=) to see the full index.',
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
