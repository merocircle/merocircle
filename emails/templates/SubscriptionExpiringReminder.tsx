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

interface SubscriptionExpiringReminderProps {
  supporterName: string;
  creatorName: string;
  daysUntilExpiry: number;
  expiryDate: string;
  tierLevel: number;
  renewUrl: string;
  creatorProfileUrl: string;
  settingsUrl: string;
  helpUrl?: string;
}

export default function SubscriptionExpiringReminder({
  supporterName = 'Alex',
  creatorName = 'Sarah Chen',
  daysUntilExpiry = 2,
  expiryDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  tierLevel = 1,
  renewUrl = 'https://merocircle.app',
  creatorProfileUrl = 'https://merocircle.app',
  settingsUrl = 'https://merocircle.app/settings',
  helpUrl = 'https://merocircle.app/help',
}: SubscriptionExpiringReminderProps) {
  const formattedDate = new Date(expiryDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const tierNames = ['', 'One Star', 'Two Star', 'Three Star'];
  const tierName = tierNames[tierLevel] || `Tier ${tierLevel}`;

  const renewalMessage =
    daysUntilExpiry === 1
      ? 'Your place in the circle comes up for renewal tomorrow'
      : `Your place in the circle comes up for renewal in ${daysUntilExpiry} days`;

  return (
    <EmailLayout
      preview={`${renewalMessage} — renew your place in ${creatorName}'s circle`}
      creatorName={creatorName}
      creatorProfileUrl={creatorProfileUrl}
      settingsUrl={settingsUrl}
      helpUrl={helpUrl}
    >
      <Section style={contentSection}>
        <Heading style={title}>Hi {supporterName},</Heading>

        <Text style={body}>
          Your time in <strong>{creatorName}&apos;s circle</strong> is coming up for renewal. You&apos;ve been part of their inner circle as a <strong>{tierName}</strong> member — we wanted to give you a gentle heads up.
        </Text>

        <Section style={infoCard}>
          <Text style={infoText}>{renewalMessage}</Text>
          <Text style={expiryDateText}>Renewal date: {formattedDate}</Text>
        </Section>

        <Text style={body}>
          To keep enjoying everything {creatorName} shares with their circle — exclusive posts, community chat, and more — you can renew your place whenever you&apos;re ready.
        </Text>

        <Section style={ctaWrapper}>
          <Link href={renewUrl} style={primaryButton}>
            Renew your place in the circle
          </Link>
        </Section>

        <Text style={smallText}>
          After renewal, you&apos;ll continue to have access to:
        </Text>
        <Text style={listItem}>• Exclusive posts and content</Text>
        <Text style={listItem}>• Community chat (if applicable)</Text>
        <Text style={listItem}>• Special perks from {creatorName}</Text>
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

const infoCard = {
  margin: '24px 0',
  padding: '20px',
  backgroundColor: '#fef7f5',
  borderRadius: '12px',
  borderLeft: '4px solid #c4382a',
  textAlign: 'left' as const,
};

const infoText = {
  margin: '0 0 8px',
  fontSize: '17px',
  fontWeight: '600',
  color: '#1c1917',
};

const expiryDateText = {
  margin: '0',
  fontSize: '14px',
  color: '#78716c',
};

const ctaWrapper = {
  margin: '32px 0 24px',
};

const smallText = {
  margin: '0 0 8px',
  fontSize: '14px',
  lineHeight: '20px',
  color: '#78716c',
};

const listItem = {
  margin: '4px 0 4px 16px',
  fontSize: '14px',
  lineHeight: '20px',
  color: '#44403c',
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
