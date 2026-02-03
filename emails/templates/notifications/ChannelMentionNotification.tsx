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

interface ChannelMentionNotificationProps {
  memberName: string;
  creatorName: string;
  channelName: string;
  messageText: string;
  senderName: string;
  channelUrl: string;
  creatorProfileUrl: string;
  settingsUrl: string;
  helpUrl: string;
}

/**
 * Email sent when someone mentions @everyone in a channel
 * Triggers: User sends message with @everyone in a Stream Chat channel
 * Recipients: All channel members
 */
export default function ChannelMentionNotification({
  memberName = 'Alex',
  creatorName = 'Sarah Chen',
  channelName = 'General Discussion',
  messageText = 'Hey everyone! Check out this new update...',
  senderName = 'John Doe',
  channelUrl = 'https://merocircle.app/chat',
  creatorProfileUrl = 'https://merocircle.app/sarahchen',
  settingsUrl = 'https://merocircle.app/settings',
  helpUrl = 'https://merocircle.app/help',
}: ChannelMentionNotificationProps) {
  const preview = messageText.length > 160 ? messageText.substring(0, 160) + '…' : messageText;

  return (
    <EmailLayout
      preview={`${senderName} mentioned everyone in ${channelName}`}
      creatorName={creatorName}
      creatorProfileUrl={creatorProfileUrl}
      settingsUrl={settingsUrl}
      helpUrl={helpUrl}
    >
      <Section style={contentSection}>
        <Text style={greeting}>Hi {memberName},</Text>
        
        <Text style={label}>{senderName} mentioned everyone</Text>
        
        <Heading style={title}>New message in {channelName}</Heading>

        <Section style={messageBox}>
          <Text style={senderNameStyle}>{senderName}</Text>
          <Text style={messageTextStyle}>{preview}</Text>
        </Section>

        <Section style={ctaWrapper}>
          <Link href={channelUrl} style={primaryButton}>
            View message in chat
          </Link>
        </Section>
      </Section>

      <Hr style={divider} />

      <Section style={messageSection}>
        <Text style={messageText}>
          You're a member of {creatorName}'s community. Stay connected with the latest updates.
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
  fontSize: '12px',
  lineHeight: '16px',
  fontWeight: '500',
  color: '#9CA3AF',
  letterSpacing: '0.5px',
  textTransform: 'uppercase' as const,
};

const title = {
  margin: '0 0 32px',
  fontSize: '30px',
  lineHeight: '38px',
  fontWeight: '700',
  color: '#111827',
  letterSpacing: '-0.8px',
};

const messageBox = {
  margin: '0 0 32px',
  padding: '20px',
  backgroundColor: '#F9FAFB',
  borderRadius: '8px',
  border: '1px solid #E5E7EB',
};

const senderNameStyle = {
  margin: '0 0 8px',
  fontSize: '14px',
  lineHeight: '20px',
  fontWeight: '600',
  color: '#111827',
};

const messageTextStyle = {
  margin: '0',
  fontSize: '16px',
  lineHeight: '26px',
  color: '#4B5563',
  letterSpacing: '-0.2px',
};

const ctaWrapper = {
  margin: '0 0 48px',
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
