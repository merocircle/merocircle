import {
  Container,
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
}

/**
 * Email sent when a creator creates a poll
 * Triggers: Creator creates a poll
 * Recipients: All active supporters
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
}: PollNotificationProps) {
  const preview = pollDescription.length > 160 ? pollDescription.substring(0, 160) + '…' : pollDescription;

  return (
    <EmailLayout
      preview={`${creatorName} wants to hear from you`}
      creatorName={creatorName}
      creatorProfileUrl={creatorProfileUrl}
      settingsUrl={settingsUrl}
      helpUrl={helpUrl}
    >
      <Section style={contentSection}>
        <Text style={greeting}>Hi {supporterName},</Text>
        
        <Text style={label}>{creatorName} asked a question</Text>
        
        <Heading style={title}>{pollQuestion}</Heading>

        <Text style={contentPreview}>{preview}</Text>

        <Section style={ctaWrapper}>
          <Link href={pollUrl} style={primaryButton}>
            Cast your vote
          </Link>
        </Section>
      </Section>

      <Hr style={divider} />

      <Section style={messageSection}>
        <Text style={messageText}>
          Your opinion matters. Help shape what {creatorName} creates next.
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
  color: '#6B7280',
};

const label = {
  margin: '0 0 16px',
  fontSize: '13px',
  lineHeight: '20px',
  fontWeight: '500',
  color: '#6B7280',
  letterSpacing: '0.3px',
  textTransform: 'uppercase' as const,
};

const title = {
  margin: '0 0 24px',
  fontSize: '30px',
  lineHeight: '38px',
  fontWeight: '700',
  color: '#111827',
  letterSpacing: '-0.8px',
};

const contentPreview = {
  margin: '0 0 32px',
  fontSize: '16px',
  lineHeight: '26px',
  color: '#4B5563',
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
  color: '#6B7280',
};

const messageSubtext = {
  margin: '0',
  fontSize: '13px',
  lineHeight: '20px',
  color: '#9CA3AF',
};

const inlineLink = {
  color: '#4f46e5',
  textDecoration: 'none',
};
