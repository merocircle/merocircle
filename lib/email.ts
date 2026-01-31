import nodemailer from 'nodemailer';
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

    const emailText = createPostNotificationEmailText(data, appUrl);

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
  supporters: Array<{ email: string; name: string }>,
  postData: Omit<PostNotificationEmailData, 'supporterEmail' | 'supporterName'>
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
  appUrl: string
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
