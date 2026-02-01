import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { logger } from './logger';
import { render } from '@react-email/render';
import { PostNotification, PollNotification, WelcomeEmail } from '@/emails/templates';
import { EMAIL_CONFIG, EMAIL_SUBJECTS, getCreatorProfileUrl } from '@/emails/config';

const createTransporter = () => {
  const smtpHost = process.env.SMTP_HOST || 'smtp.hostinger.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const smtpSecure = process.env.SMTP_SECURE !== 'false'; // Default to true (SSL)

  if (!smtpUser || !smtpPassword) {
    logger.warn('SMTP credentials not configured', 'EMAIL');
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
};

interface PostNotificationEmailData {
  supporterEmail: string;
  supporterName: string;
  supporterId: string;
  creatorId: string;
  creatorName: string;
  postTitle: string;
  postContent: string;
  postImageUrl?: string | null;
  postUrl: string;
  isPoll?: boolean;
}

function generateUnsubscribeToken(supporterId: string, creatorId: string, email: string): string {
  const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET || 'default-secret-change-in-production';
  
  const payload = {
    supporterId,
    creatorId,
    email,
    exp: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', UNSUBSCRIBE_SECRET)
    .update(payloadBase64)
    .digest('base64url');

  return `${payloadBase64}.${signature}`;
}

/**
 * Sends an email notification to a supporter when their creator posts something
 */
export async function sendPostNotificationEmail(data: PostNotificationEmailData): Promise<boolean> {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      logger.warn('Email transporter not configured, skipping email', 'EMAIL');
      return false;
    }

    const appUrl = EMAIL_CONFIG.urls.app;
    const creatorProfileUrl = getCreatorProfileUrl(data.creatorName);

    // Render email using appropriate template
    const EmailTemplate = data.isPoll ? PollNotification : PostNotification;
    
    const emailHtml = await render(
      EmailTemplate({
        supporterName: data.supporterName,
        creatorName: data.creatorName,
        ...(data.isPoll
          ? {
              pollQuestion: data.postTitle,
              pollDescription: data.postContent,
              pollUrl: data.postUrl,
            }
          : {
              postTitle: data.postTitle,
              postContent: data.postContent,
              postImageUrl: data.postImageUrl,
              postUrl: data.postUrl,
            }),
        creatorProfileUrl,
        settingsUrl: EMAIL_CONFIG.urls.settings,
        helpUrl: EMAIL_CONFIG.urls.help,
      })
    );

    const unsubscribeToken = generateUnsubscribeToken(data.supporterId, data.creatorId, data.supporterEmail);
    const unsubscribeUrl = `${appUrl}/api/supporter/unsubscribe?token=${unsubscribeToken}`;

    const emailText = createPostNotificationEmailText(data, appUrl, unsubscribeUrl);

    const subject = data.isPoll 
      ? EMAIL_SUBJECTS.pollNotification(data.creatorName)
      : EMAIL_SUBJECTS.postNotification(data.creatorName);

    const mailOptions = {
      from: {
        name: EMAIL_CONFIG.from.name,
        address: EMAIL_CONFIG.from.email,
      },
      to: data.supporterEmail,
      subject,
      text: emailText,
      html: emailHtml,
    };

    const info = await transporter.sendMail(mailOptions);
    
    logger.info('Post notification email sent successfully', 'EMAIL', {
      to: data.supporterEmail,
      creatorName: data.creatorName,
      postId: data.postUrl.split('/').pop(),
      messageId: info.messageId,
    });

    return true;
  } catch (error: any) {
    logger.error('Failed to send post notification email', 'EMAIL', {
      error: error.message,
      supporterEmail: data.supporterEmail,
      stack: error.stack,
    });
    return false;
  }
}

/**
 * Sends email notifications to multiple supporters
 */
export async function sendBulkPostNotifications(
  supporters: Array<{ email: string; name: string; id: string }>,
  postData: Omit<PostNotificationEmailData, 'supporterEmail' | 'supporterName' | 'supporterId'>
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  const batchSize = 10;
  for (let i = 0; i < supporters.length; i += batchSize) {
    const batch = supporters.slice(i, i + batchSize);
    
    const results = await Promise.allSettled(
      batch.map(supporter =>
        sendPostNotificationEmail({
          ...postData,
          supporterEmail: supporter.email,
          supporterName: supporter.name,
          supporterId: supporter.id,
        })
      )
    );

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        sent++;
      } else {
        failed++;
        if (result.status === 'rejected') {
          logger.error('Email send failed in batch', 'EMAIL', {
            error: result.reason?.message || 'Unknown error',
          });
        }
      }
    });

    if (i + batchSize < supporters.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return { sent, failed };
}

/**
 * Creates plain text email template for post notifications
 */
function createPostNotificationEmailText(
  data: PostNotificationEmailData,
  appUrl: string,
  unsubscribeUrl: string
): string {
  const postPreview = data.postContent.length > 150 
    ? data.postContent.substring(0, 150) + '...' 
    : data.postContent;
  
  const contentType = data.isPoll ? 'poll' : 'post';

  return `
Hey ${data.supporterName} 👋

${data.creatorName} just shared a new ${contentType}

${data.postTitle && data.postTitle !== 'Untitled' ? `${data.postTitle}\n\n` : ''}${postPreview}

${data.isPoll ? 'Vote Now' : 'Read & React'}: ${data.postUrl}

---
Your support helps ${data.creatorName} create more amazing content.
You're part of a community that matters.

Notification Settings: ${appUrl}/settings
View Profile: ${appUrl}/${data.creatorName}

MeroCircle © ${new Date().getFullYear()}
  `.trim();
}

/**
 * Creates HTML email template for post notifications
 */
function createPostNotificationEmailHtml(
  data: PostNotificationEmailData,
  unsubscribeUrl: string
): string {
  const safeCreatorName = escapeHtml(data.creatorName);
  const safeSupporterName = escapeHtml(data.supporterName);
  const safePostTitle = escapeHtml(data.postTitle || 'New Post');
  const postPreview = data.postContent.length > 300 
    ? data.postContent.substring(0, 300) + '...' 
    : data.postContent;
  const safePostPreview = escapeHtml(postPreview);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Post from ${safeCreatorName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px; text-align: center;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 30px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">New Post from ${safeCreatorName}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hi ${safeSupporterName},
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                ${safeCreatorName} just posted something new that you might be interested in!
              </p>
              
              ${data.postImageUrl ? `
              <div style="margin: 20px 0; text-align: center;">
                <img src="${escapeHtml(data.postImageUrl)}" alt="Post image" style="max-width: 100%; height: auto; border-radius: 8px;" />
              </div>
              ` : ''}
              
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px; color: #333333; font-size: 16px; font-weight: 600;">
                  ${safePostTitle}
                </p>
                <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
                  ${safePostPreview}
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${escapeHtml(data.postUrl)}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  View Post
                </a>
              </div>
              
              <p style="margin: 20px 0 0; color: #999999; font-size: 12px; line-height: 1.6;">
                You're receiving this email because you're supporting ${safeCreatorName} on MeroCircle.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f8f9fa; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0 0 10px; color: #999999; font-size: 12px;">
                © ${new Date().getFullYear()} MeroCircle. All rights reserved.
              </p>
              <p style="margin: 0; color: #999999; font-size: 11px;">
                <a href="${escapeHtml(unsubscribeUrl)}" style="color: #999999; text-decoration: underline;">
                  Unsubscribe from email notifications
                </a>
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

interface WelcomeEmailData {
  userEmail: string;
  userName: string;
  userRole: 'creator' | 'supporter';
}

/**
 * Sends a welcome email to a new user
 * Triggered by database webhook when a new user signs up
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      logger.warn('Email transporter not configured, skipping welcome email', 'EMAIL');
      return false;
    }

    const appUrl = EMAIL_CONFIG.urls.app;
    const profileUrl = data.userRole === 'creator' 
      ? `${appUrl}/creator-studio` 
      : `${appUrl}/profile`;
    const exploreUrl = `${appUrl}/explore`;
    const settingsUrl = EMAIL_CONFIG.urls.settings;
    const helpUrl = EMAIL_CONFIG.urls.help;

    // Render welcome email template
    const html = await render(
      WelcomeEmail({
        userName: data.userName,
        userRole: data.userRole,
        profileUrl,
        exploreUrl,
        settingsUrl,
        helpUrl,
      })
    );

    const mailOptions = {
      from: `${EMAIL_CONFIG.from.name} <${EMAIL_CONFIG.from.email}>`,
      to: data.userEmail,
      subject: EMAIL_SUBJECTS.welcome(data.userName),
      html,
    };

    await transporter.sendMail(mailOptions);

    logger.info('Welcome email sent successfully', 'EMAIL', {
      recipient: data.userEmail,
      userName: data.userName,
      userRole: data.userRole,
    });

    return true;
  } catch (error: any) {
    logger.error('Failed to send welcome email', 'EMAIL', {
      error: error.message,
      recipient: data.userEmail,
    });
    return false;
  }
}
