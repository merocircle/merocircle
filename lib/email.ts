import nodemailer from 'nodemailer';
import path from 'path';
import crypto from 'crypto';
import { logger } from './logger';
import { render } from '@react-email/render';
import { PostNotification, PollNotification, WelcomeEmail, CreatorWelcomeEmail, ChannelMentionNotification, SubscriptionConfirmation, NewSupporterNotification, SubscriptionExpiringReminder, SubscriptionExpiredNotification } from '@/emails/templates';
import { EMAIL_CONFIG, EMAIL_SUBJECTS, getCreatorProfileUrl } from '@/emails/config';

/**
 * All transactional email is sent via Hostinger SMTP (or SMTP_* env).
 * Supabase is only used for the email_queue table (storage); no Supabase SMTP is used.
 */
const createTransporter = () => {
  const smtpHost = process.env.SMTP_HOST || 'smtp.hostinger.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10); // Changed to 587 (TLS)
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const smtpSecure = smtpPort === 465; // Only true for port 465

  if (!smtpUser || !smtpPassword) {
    logger.warn('SMTP credentials not configured', 'EMAIL');
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure, // false for 587, true for 465
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
    // Senior dev: Increase timeouts for reliability
    connectionTimeout: 30000, // 30 seconds (was 10)
    greetingTimeout: 30000,   // 30 seconds (was 10)
    socketTimeout: 30000,     // 30 seconds (was 10)
    // Add pool to reuse connections
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    // Retry on failure
    logger: false,
    debug: false,
    // TLS options for port 587
    tls: {
      rejectUnauthorized: false, // Allow self-signed certificates
      ciphers: 'SSLv3'
    }
  });
};

/** Unique Message-ID so each email is a new conversation (no reply threading). */
function generateMessageId(suffix: string): string {
  return `<${Date.now()}-${crypto.randomUUID()}-${suffix}@merocircle.app>`;
}

/** Headers so each email appears as a separate conversation, not a reply (Gmail + others). */
function getNoThreadHeaders(messageId: string): Record<string, string> {
  return {
    'Message-ID': messageId,
    'X-Entity-Ref-ID': messageId, // unique per message → Gmail shows separate conversations
    'Auto-Submitted': 'auto-generated',
    'X-Mailer': 'MeroCircle',
  };
}

interface PostNotificationEmailData {
  supporterEmail: string;
  supporterName: string;
  supporterId: string;
  creatorId: string;
  creatorName: string;
  creatorUsername?: string;
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
    const creatorProfileUrl = getCreatorProfileUrl(data.creatorUsername || data.creatorName);

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

    const messageId = generateMessageId(data.supporterId);

    const mailOptions = {
      from: {
        name: EMAIL_CONFIG.from.name,
        address: EMAIL_CONFIG.from.email,
      },
      to: data.supporterEmail,
      subject,
      text: emailText,
      html: emailHtml,
      messageId,
      headers: {
        ...getNoThreadHeaders(messageId),
        'X-Priority': '3',
        'Precedence': 'bulk',
      },
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
View Profile: ${appUrl}/${data.creatorUsername || data.creatorName}

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
 * Sends a personalized welcome letter to a new user
 * Triggered on account creation — a warm note from the team
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      logger.warn('Email transporter not configured, skipping welcome email', 'EMAIL');
      return false;
    }

    const appUrl = EMAIL_CONFIG.urls.app || 'https://merocircle.app';
    const exploreUrl = `${appUrl}/explore`;
    const settingsUrl = EMAIL_CONFIG.urls.settings || `${appUrl}/settings`;
    const helpUrl = EMAIL_CONFIG.urls.help || `${appUrl}/help`;

    // Extract first name for personalization
    const firstName = data.userName.split(' ')[0] || data.userName;

    // Embed images via Content-ID (CID) so they display in email clients that block external URLs
    const cidLogo = 'logo@merocircle.app';
    const cidTeam = 'team@merocircle.app';
    const publicDir = path.join(process.cwd(), 'public');
    const logoPath = path.join(publicDir, 'logo', 'logo-light.png');
    const teamPath = path.join(publicDir, 'team.jpg');


    const html = await render(
      WelcomeEmail({
        firstName,
        exploreUrl,
        settingsUrl,
        helpUrl,
        appUrl,
        logoSrc: `cid:${cidLogo}`,
        teamImageSrc: `cid:${cidTeam}`,
      })
    );

    const messageId = generateMessageId(data.userEmail.replace('@', '-at-'));

    const mailOptions = {
      from: `${EMAIL_CONFIG.from.name} <${EMAIL_CONFIG.from.email}>`,
      to: data.userEmail,
      subject: EMAIL_SUBJECTS.welcome(firstName),
      html,
      messageId,
      attachments: [
        { filename: 'logo-light.png', path: logoPath, cid: cidLogo },
        { filename: 'team.jpg', path: teamPath, cid: cidTeam },
      ],
      headers: {
        ...getNoThreadHeaders(messageId),
        'X-Priority': '3',
      },
    };

    await transporter.sendMail(mailOptions);

    logger.info('Welcome email sent successfully', 'EMAIL', {
      recipient: data.userEmail,
      firstName,
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

export interface CreatorWelcomeEmailData {
  userEmail: string;
  userName: string;
}

/**
 * Sends creator welcome email when someone completes creator signup.
 * Includes tips for keeping supporters engaged and CTA to complete onboarding.
 */
export async function sendCreatorWelcomeEmail(data: CreatorWelcomeEmailData): Promise<boolean> {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      logger.warn('Email transporter not configured, skipping creator welcome email', 'EMAIL');
      return false;
    }

    const appUrl = EMAIL_CONFIG.urls.app || 'https://merocircle.app';
    const dashboardUrl = `${appUrl}/dashboard`;
    const settingsUrl = EMAIL_CONFIG.urls.settings || `${appUrl}/settings`;
    const helpUrl = EMAIL_CONFIG.urls.help || `${appUrl}/help`;
    const firstName = data.userName.split(' ')[0] || data.userName;

    const cidLogo = 'logo@merocircle.app';
    const cidTeam = 'team@merocircle.app';
    const publicDir = path.join(process.cwd(), 'public');
    const logoPath = path.join(publicDir, 'logo', 'logo-light.png');
    const teamPath = path.join(publicDir, 'team.jpg');

    const html = await render(
      CreatorWelcomeEmail({
        firstName,
        dashboardUrl,
        settingsUrl,
        helpUrl,
        appUrl,
        logoSrc: `cid:${cidLogo}`,
        teamImageSrc: `cid:${cidTeam}`,
      })
    );

    const messageId = generateMessageId(`creator-${data.userEmail.replace('@', '-at-')}`);

    const mailOptions = {
      from: `${EMAIL_CONFIG.from.name} <${EMAIL_CONFIG.from.email}>`,
      to: data.userEmail,
      subject: EMAIL_SUBJECTS.creatorWelcome(firstName),
      html,
      messageId,
      attachments: [
        { filename: 'logo-light.png', path: logoPath, cid: cidLogo },
        { filename: 'team.jpg', path: teamPath, cid: cidTeam },
      ],
      headers: {
        ...getNoThreadHeaders(messageId),
        'X-Priority': '3',
      },
    };

    await transporter.sendMail(mailOptions);

    logger.info('Creator welcome email sent', 'EMAIL', {
      recipient: data.userEmail,
      firstName,
    });

    return true;
  } catch (error: any) {
    logger.error('Failed to send creator welcome email', 'EMAIL', {
      error: error.message,
      recipient: data.userEmail,
    });
    return false;
  }
}

interface ChannelMentionEmailData {
  memberEmail: string;
  memberName: string;
  memberId: string;
  creatorId: string;
  creatorName: string;
  /** Creator's URL slug (username or vanity_username). Used to build the profile link. */
  creatorUsername?: string;
  channelName: string;
  channelId: string;
  messageText: string;
  senderName: string;
  senderId: string;
  /** 'you' = specific @username mention; 'everyone' = @everyone mention */
  mentionType?: 'you' | 'everyone';
}

/**
 * Sends an email when a user is mentioned in a channel.
 * Use mentionType 'you' for @username mentions, 'everyone' for @everyone.
 */
export async function sendChannelMentionEmail(data: ChannelMentionEmailData): Promise<boolean> {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      logger.warn('Email transporter not configured, skipping email', 'EMAIL');
      return false;
    }

    const appUrl = EMAIL_CONFIG.urls.app;
    const creatorProfileUrl = getCreatorProfileUrl(data.creatorUsername || data.creatorName);
    const channelUrl = `${appUrl}/chat?channel=${data.channelId}`;
    const mentionType = data.mentionType ?? 'everyone';

    // Render email using ChannelMentionNotification template
    const emailHtml = await render(
      ChannelMentionNotification({
        memberName: data.memberName,
        creatorName: data.creatorName,
        channelName: data.channelName,
        messageText: data.messageText,
        senderName: data.senderName,
        channelUrl,
        creatorProfileUrl,
        settingsUrl: EMAIL_CONFIG.urls.settings,
        helpUrl: EMAIL_CONFIG.urls.help,
        mentionType,
      })
    );

    const subject = mentionType === 'you'
      ? `${data.senderName} mentioned you in ${data.channelName}`
      : `${data.senderName} mentioned everyone in ${data.channelName}`;

    const messageId = generateMessageId(data.memberId);

    const mailOptions = {
      from: {
        name: EMAIL_CONFIG.from.name,
        address: EMAIL_CONFIG.from.email,
      },
      to: data.memberEmail,
      subject,
      html: emailHtml,
      messageId,
      headers: {
        ...getNoThreadHeaders(messageId),
        'X-Priority': '3',
        'Precedence': 'bulk',
      },
    };

    await transporter.sendMail(mailOptions);

    logger.info('Channel mention email sent successfully', 'EMAIL', {
      recipient: data.memberEmail,
      channelId: data.channelId,
      senderId: data.senderId,
    });

    return true;
  } catch (error: any) {
    logger.error('Failed to send channel mention email', 'EMAIL', {
      error: error.message,
      recipient: data.memberEmail,
      channelId: data.channelId,
    });
    return false;
  }
}

/**
 * Sends email notifications to all channel members when @everyone is mentioned
 */
export async function sendBulkChannelMentionEmails(
  members: Array<{ email: string; name: string; id: string }>,
  mentionData: Omit<ChannelMentionEmailData, 'memberEmail' | 'memberName' | 'memberId'>
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  const batchSize = 10;
  for (let i = 0; i < members.length; i += batchSize) {
    const batch = members.slice(i, i + batchSize);
    
    const results = await Promise.allSettled(
      batch.map(member =>
        sendChannelMentionEmail({
          ...mentionData,
          memberEmail: member.email,
          memberName: member.name,
          memberId: member.id,
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

    if (i + batchSize < members.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return { sent, failed };
}

interface SubscriptionConfirmationEmailData {
  supporterEmail: string;
  supporterName: string;
  creatorName: string;
  tierLevel: number;
  tierName: string;
  amount: number;
  currency: string;
  creatorProfileUrl: string;
  chatUrl: string;
}

/**
 * Sends subscription confirmation email to supporter
 * Triggered when supporter successfully subscribes/supports a creator
 */
export async function sendSubscriptionConfirmationEmail(data: SubscriptionConfirmationEmailData): Promise<boolean> {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      logger.warn('Email transporter not configured, skipping subscription confirmation email', 'EMAIL');
      return false;
    }

    const appUrl = EMAIL_CONFIG.urls.app;
    const creatorProfileUrl = data.creatorProfileUrl || getCreatorProfileUrl(data.creatorName);
    const chatUrl = data.chatUrl || `${appUrl}/chat`;

    // Render subscription confirmation email template
    const html = await render(
      SubscriptionConfirmation({
        supporterName: data.supporterName,
        creatorName: data.creatorName,
        tierLevel: data.tierLevel,
        tierName: data.tierName,
        amount: data.amount,
        currency: data.currency,
        creatorProfileUrl,
        chatUrl,
        settingsUrl: EMAIL_CONFIG.urls.settings,
        helpUrl: EMAIL_CONFIG.urls.help,
      })
    );

    const messageId = generateMessageId(`sub-${data.supporterEmail.replace('@', '-at-')}`);

    const mailOptions = {
      from: {
        name: EMAIL_CONFIG.from.name,
        address: EMAIL_CONFIG.from.email,
      },
      to: data.supporterEmail,
      subject: EMAIL_SUBJECTS.subscriptionConfirmation(data.creatorName),
      html,
      messageId,
      headers: {
        ...getNoThreadHeaders(messageId),
        'X-Priority': '3',
      },
    };

    await transporter.sendMail(mailOptions);

    logger.info('Subscription confirmation email sent successfully', 'EMAIL', {
      recipient: data.supporterEmail,
      creatorName: data.creatorName,
      tierLevel: data.tierLevel,
      amount: data.amount,
    });

    return true;
  } catch (error: any) {
    logger.error('Failed to send subscription confirmation email', 'EMAIL', {
      error: error.message,
      recipient: data.supporterEmail,
    });
    return false;
  }
}

interface NewSupporterNotificationEmailData {
  creatorEmail: string;
  creatorName: string;
  supporterName: string;
  tierLevel: number;
  tierName: string;
  amount: number;
  currency: string;
  supporterMessage?: string | null;
}

/**
 * Sends new supporter notification email to creator
 * Triggered when creator receives new support/subscription
 */
export async function sendNewSupporterNotificationEmail(data: NewSupporterNotificationEmailData): Promise<boolean> {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      logger.warn('Email transporter not configured, skipping new supporter notification email', 'EMAIL');
      return false;
    }

    const appUrl = EMAIL_CONFIG.urls.app;
    const creatorStudioUrl = `${appUrl}/creator-studio`;
    const supportersUrl = `${appUrl}/creator-studio?tab=supporters`;

    // Render new supporter notification email template
    const html = await render(
      NewSupporterNotification({
        creatorName: data.creatorName,
        supporterName: data.supporterName,
        tierLevel: data.tierLevel,
        tierName: data.tierName,
        amount: data.amount,
        currency: data.currency,
        supporterMessage: data.supporterMessage,
        creatorStudioUrl,
        supportersUrl,
        settingsUrl: EMAIL_CONFIG.urls.settings,
        helpUrl: EMAIL_CONFIG.urls.help,
      })
    );

    const messageId = generateMessageId(`newsup-${data.creatorEmail.replace('@', '-at-')}`);

    const mailOptions = {
      from: {
        name: EMAIL_CONFIG.from.name,
        address: EMAIL_CONFIG.from.email,
      },
      to: data.creatorEmail,
      subject: EMAIL_SUBJECTS.newSupporterNotification(data.supporterName, data.amount, data.currency),
      html,
      messageId,
      headers: {
        ...getNoThreadHeaders(messageId),
        'X-Priority': '3',
      },
    };

    await transporter.sendMail(mailOptions);

    logger.info('New supporter notification email sent successfully', 'EMAIL', {
      recipient: data.creatorEmail,
      supporterName: data.supporterName,
      tierLevel: data.tierLevel,
      amount: data.amount,
    });

    return true;
  } catch (error: any) {
    logger.error('Failed to send new supporter notification email', 'EMAIL', {
      error: error.message,
      recipient: data.creatorEmail,
    });
    return false;
  }
}

/**
 * Send subscription expiring reminder email
 */
export async function sendSubscriptionExpiringEmail(data: {
  supporterEmail: string;
  supporterName: string;
  creatorName: string;
  /** Creator's URL slug (username or vanity_username). Used to build the profile link. */
  creatorUsername?: string;
  creatorId: string;
  tierLevel: number;
  expiryDate: string;
  daysUntilExpiry: number;
  renewUrl: string;
}): Promise<boolean> {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      logger.warn('Email transporter not configured, skipping email', 'EMAIL');
      return false;
    }

    const appUrl = EMAIL_CONFIG.urls.app;
    const creatorProfileUrl = getCreatorProfileUrl(data.creatorUsername || data.creatorName);

    const emailHtml = await render(
      SubscriptionExpiringReminder({
        supporterName: data.supporterName,
        creatorName: data.creatorName,
        daysUntilExpiry: data.daysUntilExpiry,
        expiryDate: data.expiryDate,
        tierLevel: data.tierLevel,
        renewUrl: data.renewUrl,
        creatorProfileUrl,
        settingsUrl: EMAIL_CONFIG.urls.settings,
      })
    );

    const messageId = generateMessageId(`expiring-${data.supporterEmail.replace('@', '-at-')}`);

    const mailOptions = {
      from: {
        name: EMAIL_CONFIG.from.name,
        address: EMAIL_CONFIG.from.email,
      },
      to: data.supporterEmail,
      subject: EMAIL_SUBJECTS.subscriptionExpiring(data.creatorName, data.daysUntilExpiry),
      html: emailHtml,
      messageId,
      headers: {
        ...getNoThreadHeaders(messageId),
        'X-Priority': '1', // High priority
      },
    };

    await transporter.sendMail(mailOptions);

    logger.info('Subscription expiring reminder email sent', 'EMAIL', {
      recipient: data.supporterEmail,
      creatorName: data.creatorName,
      daysUntilExpiry: data.daysUntilExpiry,
    });

    return true;
  } catch (error: any) {
    logger.error('Failed to send subscription expiring email', 'EMAIL', {
      error: error.message,
      recipient: data.supporterEmail,
    });
    return false;
  }
}

/**
 * Send subscription expired notification email
 */
export async function sendSubscriptionExpiredEmail(data: {
  supporterEmail: string;
  supporterName: string;
  creatorName: string;
  /** Creator's URL slug (username or vanity_username). Used to build the profile link. */
  creatorUsername?: string;
  creatorId: string;
  renewUrl: string;
}): Promise<boolean> {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      logger.warn('Email transporter not configured, skipping email', 'EMAIL');
      return false;
    }

    const appUrl = EMAIL_CONFIG.urls.app;
    const creatorProfileUrl = getCreatorProfileUrl(data.creatorUsername || data.creatorName);

    const emailHtml = await render(
      SubscriptionExpiredNotification({
        supporterName: data.supporterName,
        creatorName: data.creatorName,
        renewUrl: data.renewUrl,
        creatorProfileUrl,
        settingsUrl: EMAIL_CONFIG.urls.settings,
      })
    );

    const messageId = generateMessageId(`expired-${data.supporterEmail.replace('@', '-at-')}`);

    const mailOptions = {
      from: {
        name: EMAIL_CONFIG.from.name,
        address: EMAIL_CONFIG.from.email,
      },
      to: data.supporterEmail,
      subject: EMAIL_SUBJECTS.subscriptionExpired(data.creatorName),
      html: emailHtml,
      messageId,
      headers: {
        ...getNoThreadHeaders(messageId),
        'X-Priority': '3',
      },
    };

    await transporter.sendMail(mailOptions);

    logger.info('Subscription expired notification email sent', 'EMAIL', {
      recipient: data.supporterEmail,
      creatorName: data.creatorName,
    });

    return true;
  } catch (error: any) {
    logger.error('Failed to send subscription expired email', 'EMAIL', {
      error: error.message,
      recipient: data.supporterEmail,
    });
    return false;
  }
}
