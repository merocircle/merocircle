import {
  Heading,
  Hr,
  Link,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../components/shared/EmailLayout';
import { primaryButton, body, divider } from '../components/shared/styles';

interface SubscriptionExpiredNotificationProps {
  supporterName: string;
  creatorName: string;
  renewUrl: string;
  creatorProfileUrl: string;
  settingsUrl: string;
  helpUrl?: string;
}

export default function SubscriptionExpiredNotification({
  supporterName = 'Alex',
  creatorName = 'Sarah Chen',
  renewUrl = 'https://merocircle.app',
  creatorProfileUrl = 'https://merocircle.app',
  settingsUrl = 'https://merocircle.app/settings',
  helpUrl = 'https://merocircle.app/help',
}: SubscriptionExpiredNotificationProps) {
  return (
    <EmailLayout
      preview={`The door is still open — rejoin ${creatorName}'s circle anytime`}
      creatorName={creatorName}
      creatorProfileUrl={creatorProfileUrl}
      settingsUrl={settingsUrl}
      helpUrl={helpUrl}
    >
      <Section style={contentSection}>
        <Heading style={title}>Hi {supporterName},</Heading>

        <Text style={body}>
          Your time in <strong>{creatorName}&apos;s circle</strong> has come to an end — for now. We hope you enjoyed being part of their inner circle.
        </Text>

        <Section style={warmCard}>
          <Text style={warmCardTitle}>The door is still open</Text>
          <Text style={warmCardText}>
            You&apos;re always welcome back. Rejoin {creatorName}&apos;s circle anytime and you&apos;ll have instant access to everything they share — exclusive posts, community chat, and more.
          </Text>
        </Section>

        <Text style={body}>
          While you were part of the circle, you had access to:
        </Text>
        <Text style={listItem}>• Exclusive posts and content</Text>
        <Text style={listItem}>• Community chat</Text>
        <Text style={listItem}>• Special perks from {creatorName}</Text>

        <Section style={ctaWrapper}>
          <Link href={renewUrl} style={primaryButton}>
            Rejoin {creatorName}&apos;s circle
          </Link>
        </Section>

        <Text style={thankYouText}>
          Thank you for being part of the journey. We hope to see you again soon.
        </Text>
      </Section>

      <Hr style={divider} />

      <Section style={messageSection}>
        <Text style={messageText}>
          Manage your circle memberships anytime from your{' '}
          <Link href={settingsUrl} style={inlineLink}>
            preferences
          </Link>
          .
        </Text>
      </Section>
    </EmailLayout>
  );
}

// Component-specific styles
const contentSection = {
  padding: '48px 40px 40px',
};

const title = {
  margin: '0 0 20px',
  fontSize: '24px',
  lineHeight: '32px',
  fontWeight: '700',
  color: '#1c1917',
  letterSpacing: '-0.5px',
};

const warmCard = {
  margin: '24px 0',
  padding: '24px',
  backgroundColor: '#fafaf9',
  borderRadius: '12px',
  border: '1px solid #e7e5e4',
  textAlign: 'left' as const,
};

const warmCardTitle = {
  margin: '0 0 12px',
  fontSize: '18px',
  fontWeight: '600',
  color: '#1c1917',
};

const warmCardText = {
  margin: '0',
  fontSize: '15px',
  lineHeight: '24px',
  color: '#44403c',
};

const listItem = {
  margin: '4px 0 4px 16px',
  fontSize: '14px',
  lineHeight: '20px',
  color: '#44403c',
};

const ctaWrapper = {
  margin: '32px 0 24px',
};

const thankYouText = {
  margin: '24px 0 0',
  padding: '20px',
  fontSize: '15px',
  lineHeight: '24px',
  color: '#44403c',
  backgroundColor: '#fafaf9',
  borderRadius: '12px',
  textAlign: 'center' as const,
};

const messageSection = {
  padding: '32px 40px 48px',
  textAlign: 'center' as const,
};

const messageText = {
  margin: '0',
  fontSize: '14px',
  lineHeight: '20px',
  color: '#78716c',
};

const inlineLink = {
  color: '#c4382a',
  textDecoration: 'none',
};
