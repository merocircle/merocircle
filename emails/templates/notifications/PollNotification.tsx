import {
  Heading,
  Hr,
  Link,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../../components/shared/EmailLayout';
import { primaryButton, body, divider } from '../../components/shared/styles';

interface PollNotificationProps {
  supporterName: string;
  creatorName: string;
  pollQuestion: string;
  pollDescription: string;
  pollUrl: string;
  creatorProfileUrl: string;
  settingsUrl: string;
  helpUrl: string;
  appUrl?: string;
  logoSrc?: string;
}

/**
 * Email sent when a creator wants input from their circle
 * Triggers: Creator creates a poll
 * Recipients: All circle members
 */
export default function PollNotification({
  supporterName = 'Alex',
  creatorName = 'Sarah Chen',
  pollQuestion = 'What should we build next?',
  pollDescription = "I'm planning the next phase of our journey together, and your input matters. Should we focus on expanding our video content, diving deeper into written essays, or experimenting with interactive experiences?",
  pollUrl = 'https://merocircle.app/sarahchen/polls/456',
  creatorProfileUrl = 'https://merocircle.app/sarahchen',
  settingsUrl = 'https://merocircle.app/settings',
  helpUrl = 'https://merocircle.app/help',
  appUrl,
  logoSrc,
}: PollNotificationProps) {
  const preview = pollQuestion ? `New poll: ${pollQuestion}` : `New poll from ${creatorName}`;

  return (
    <EmailLayout
      preview={preview}
      creatorName={creatorName}
      creatorProfileUrl={creatorProfileUrl}
      settingsUrl={settingsUrl}
      helpUrl={helpUrl}
      appUrl={appUrl}
      logoSrc={logoSrc}
    >
      <Section style={contentSection}>
        <Text style={greeting}>Hi {supporterName},</Text>

        <Text style={label}>New poll from {creatorName}</Text>

        <Heading style={title}>{pollQuestion}</Heading>

        <Text style={contentPreview}>{preview}</Text>

        <Section style={ctaWrapper}>
          <Link href={pollUrl} style={primaryButton}>
            Vote in poll
          </Link>
        </Section>
      </Section>

      <Hr style={divider} />

      <Section style={messageSection}>
        <Text style={messageText}>
          This poll is part of {creatorName}&apos;s latest update.
        </Text>
        <Text style={messageSubtext}>
          <Link href={settingsUrl} style={inlineLink}>Manage your preferences</Link>
        </Text>
      </Section>
    </EmailLayout>
  );
}

// Component-specific styles
const contentSection = {
  padding: '48px 40px 40px',
};

const greeting = {
  margin: '0 0 4px',
  fontSize: '15px',
  lineHeight: '24px',
  color: '#78716c',
};

const label = {
  margin: '0 0 16px',
  fontSize: '13px',
  lineHeight: '20px',
  fontWeight: '500',
  color: '#78716c',
  letterSpacing: '0.3px',
  textTransform: 'uppercase' as const,
};

const title = {
  margin: '0 0 24px',
  fontSize: '30px',
  lineHeight: '38px',
  fontWeight: '700',
  color: '#1c1917',
  letterSpacing: '-0.8px',
};

const contentPreview = {
  margin: '0 0 32px',
  fontSize: '16px',
  lineHeight: '26px',
  color: '#44403c',
  letterSpacing: '-0.2px',
};

const ctaWrapper = {
  margin: '32px 0 0',
  textAlign: 'center' as const,
};

const messageSection = {
  padding: '32px 40px 48px',
  textAlign: 'center' as const,
};

const messageText = {
  margin: '0 0 8px',
  fontSize: '14px',
  lineHeight: '20px',
  color: '#78716c',
};

const messageSubtext = {
  margin: '0',
  fontSize: '13px',
  lineHeight: '20px',
  color: '#a8a29e',
};

const inlineLink = {
  color: '#c4382a',
  textDecoration: 'none',
};
