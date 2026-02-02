/**
 * Email Templates Index
 * Centralized exports for all email templates
 * 
 * Usage:
 *   import { PostNotification, WelcomeEmail } from '@/emails/templates';
 */

// Notifications (content from creators)
export { default as PostNotification } from './notifications/PostNotification';
export { default as PollNotification } from './notifications/PollNotification';

// Transactional (account & payment related)
export { default as WelcomeEmail } from './transactional/WelcomeEmail';
export { default as PaymentSuccess } from './transactional/PaymentSuccess';
export { default as PaymentFailed } from './transactional/PaymentFailed';

// Types
export type EmailTemplate =
  | 'post-notification'
  | 'poll-notification'
  | 'welcome'
  | 'payment-success'
  | 'payment-failed';

export interface BaseEmailProps {
  appUrl?: string;
}

export interface NotificationEmailProps extends BaseEmailProps {
  supporterName: string;
  creatorName: string;
  creatorProfileUrl: string;
  settingsUrl: string;
  helpUrl: string;
}

export interface TransactionalEmailProps extends BaseEmailProps {
  userName: string;
  settingsUrl: string;
  helpUrl: string;
}
