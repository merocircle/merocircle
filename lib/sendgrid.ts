import sgMail from '@sendgrid/mail';
import { logger } from './logger';

// Initialize SendGrid with API key from environment
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  logger.warn('SENDGRID_API_KEY not found in environment variables', 'SENDGRID');
}

interface PostNotificationEmailData {
  supporterEmail: string;
  supporterName: string;
  creatorName: string;
  postTitle: string;
  postContent: string;
  postImageUrl?: string | null;
  postUrl: string;
  isPoll?: boolean;
}

/**
 * Sends an email notification to a supporter when their creator posts something
 */
export async function sendPostNotificationEmail(data: PostNotificationEmailData): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      logger.warn('SendGrid API key not configured, skipping email', 'SENDGRID');
      return false;
    }

    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@merocircle.com';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://merocircle.com';

    // Create email HTML content
    const emailHtml = createPostNotificationEmailHtml(data, appUrl);

    // Create email text content
    const emailText = createPostNotificationEmailText(data, appUrl);

    const msg = {
      to: data.supporterEmail,
      from: {
        email: fromEmail,
        name: 'MeroCircle'
      },
      subject: `${data.creatorName} just posted something new!`,
      text: emailText,
      html: emailHtml,
    };

    await sgMail.send(msg);
    
    logger.info('Post notification email sent successfully', 'SENDGRID', {
      to: data.supporterEmail,
      creatorName: data.creatorName,
      postId: data.postUrl.split('/').pop()
    });

    return true;
  } catch (error: any) {
    logger.error('Failed to send post notification email', 'SENDGRID', {
      error: error.message,
      supporterEmail: data.supporterEmail,
      response: error.response?.body
    });
    return false;
  }
}

/**
 * Sends email notifications to multiple supporters
 */
export async function sendBulkPostNotifications(
  supporters: Array<{ email: string; name: string }>,
  postData: Omit<PostNotificationEmailData, 'supporterEmail' | 'supporterName'>
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  // Send emails in parallel batches to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < supporters.length; i += batchSize) {
    const batch = supporters.slice(i, i + batchSize);
    
    const results = await Promise.allSettled(
      batch.map(supporter =>
        sendPostNotificationEmail({
          ...postData,
          supporterEmail: supporter.email,
          supporterName: supporter.name,
        })
      )
    );

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        sent++;
      } else {
        failed++;
      }
    });

    if (i + batchSize < supporters.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return { sent, failed };
}

/**
 * Creates HTML email template for post notifications
 */
function createPostNotificationEmailHtml(
  data: PostNotificationEmailData,
  appUrl: string
): string {
  const postPreview = data.postContent.length > 200 
    ? data.postContent.substring(0, 200) + '...' 
    : data.postContent;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Post from ${data.creatorName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px; text-align: center;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 30px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">New Post from ${data.creatorName}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hi ${data.supporterName},
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                ${data.creatorName} just posted something new that you might be interested in!
              </p>
              
              ${data.postImageUrl ? `
              <div style="margin: 20px 0; text-align: center;">
                <img src="${data.postImageUrl}" alt="Post image" style="max-width: 100%; height: auto; border-radius: 8px;" />
              </div>
              ` : ''}
              
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <h2 style="margin: 0 0 10px; color: #333333; font-size: 18px; font-weight: 600;">
                  ${data.postTitle}
                </h2>
                <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
                  ${postPreview}
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.postUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  View Post
                </a>
              </div>
              
              <p style="margin: 20px 0 0; color: #999999; font-size: 12px; line-height: 1.6;">
                You're receiving this email because you're supporting ${data.creatorName} on MeroCircle.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f8f9fa; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © ${new Date().getFullYear()} MeroCircle. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}


function createPostNotificationEmailText(
  data: PostNotificationEmailData,
  appUrl: string
): string {
  const postPreview = data.postContent.length > 200 
    ? data.postContent.substring(0, 200) + '...' 
    : data.postContent;

  return `
Hi ${data.supporterName},

${data.creatorName} just posted something new that you might be interested in!

${data.postTitle}

${postPreview}

View the full post: ${data.postUrl}

You're receiving this email because you're supporting ${data.creatorName} on MeroCircle.

© ${new Date().getFullYear()} MeroCircle. All rights reserved.
  `.trim();
}
