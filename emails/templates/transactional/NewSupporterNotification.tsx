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

interface NewSupporterNotificationProps {
  creatorName: string;
  supporterName: string;
  tierLevel: number;
  tierName: string;
  amount: number;
  currency: string;
  supporterMessage?: string | null;
  creatorStudioUrl: string;
  supportersUrl: string;
  settingsUrl: string;
  helpUrl: string;
}

/**
 * New supporter notification email
 * Triggers: When a creator receives new support/subscription
 * Recipients: Creator who received the support
 */
export default function NewSupporterNotification({
  creatorName = 'Sarah Chen',
  supporterName = 'Alex',
  tierLevel = 2,
  tierName = 'Two Star Supporter',
  amount = 500,
  currency = 'NPR',
  supporterMessage = null,
  creatorStudioUrl = 'https://merocircle.app/creator-studio',
  supportersUrl = 'https://merocircle.app/creator-studio?tab=supporters',
  settingsUrl = 'https://merocircle.app/settings',
  helpUrl = 'https://merocircle.app/help',
}: NewSupporterNotificationProps) {
  const tierEmoji = tierLevel === 1 ? '⭐' : tierLevel === 2 ? '⭐⭐' : '⭐⭐⭐';
  
  return (
    <EmailLayout
      preview={`${supporterName} just supported you with ${currency} ${amount}`}
      settingsUrl={settingsUrl}
      helpUrl={helpUrl}
      hideCreatorInfo={true}
    >
      <Section style={contentSection}>
        <Text style={successIcon}>🎊</Text>
        
        <Heading style={title}>You have a new supporter!</Heading>

        <Text style={subtitle}>
          {supporterName} just supported you
        </Text>

        <Text style={body}>
          Someone believes in your work and wants to support your journey. This is just the beginning!
        </Text>

        <Section style={detailsCard}>
          <Section style={tierBadge}>
            <Text style={tierEmojiText}>{tierEmoji}</Text>
            <Text style={tierNameText}>{tierName}</Text>
          </Section>
          
          <Section style={detailRow}>
            <Text style={detailLabel}>Support Amount</Text>
            <Text style={detailValue}>
              {currency} {amount.toLocaleString()}
            </Text>
          </Section>
          
          <Section style={detailRow}>
            <Text style={detailLabel}>Supporter</Text>
            <Text style={detailValue}>{supporterName}</Text>
          </Section>
        </Section>

        {supporterMessage && (
          <Section style={messageCard}>
            <Text style={messageLabel}>Message from {supporterName}:</Text>
            <Text style={messageContent}>{supporterMessage}</Text>
          </Section>
        )}

        <Section style={ctaWrapper}>
          <Link href={supportersUrl} style={primaryButton}>
            View All Supporters
          </Link>
        </Section>

        <Section style={ctaWrapper}>
          <Link href={creatorStudioUrl} style={secondaryButton}>
            Go to Creator Studio
          </Link>
        </Section>
      </Section>

      <Hr style={divider} />

      <Section style={messageSection}>
        <Text style={messageText}>
          Keep creating amazing content! Your supporters are here to cheer you on.
        </Text>
        <Text style={messageSubtext}>
          Questions? <Link href={helpUrl} style={inlineLink}>Contact support</Link>
        </Text>
      </Section>
    </EmailLayout>
  );
}

// Component-specific styles
const contentSection = {
  padding: '48px 40px 40px',
  textAlign: 'center' as const,
};

const successIcon = {
  fontSize: '48px',
  margin: '0 0 24px',
  display: 'inline-block',
};

const title = {
  margin: '0 0 8px',
  fontSize: '28px',
  lineHeight: '36px',
  fontWeight: '700',
  color: '#111827',
  letterSpacing: '-0.6px',
};

const subtitle = {
  margin: '0 0 20px',
  fontSize: '17px',
  lineHeight: '26px',
  color: '#6B7280',
};

const detailsCard = {
  margin: '32px 0',
  padding: '24px',
  backgroundColor: '#F9FAFB',
  borderRadius: '12px',
  textAlign: 'left' as const,
};

const tierBadge = {
  textAlign: 'center' as const,
  marginBottom: '20px',
  paddingBottom: '20px',
  borderBottom: '1px solid #E5E7EB',
};

const tierEmojiText = {
  margin: '0 0 8px',
  fontSize: '32px',
  lineHeight: '1',
};

const tierNameText = {
  margin: '0',
  fontSize: '18px',
  fontWeight: '600',
  color: '#111827',
};

const detailRow = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '16px',
};

const detailLabel = {
  margin: '0',
  fontSize: '14px',
  color: '#6B7280',
  fontWeight: '500',
};

const detailValue = {
  margin: '0',
  fontSize: '14px',
  color: '#111827',
  fontWeight: '600',
};

const messageCard = {
  margin: '24px 0',
  padding: '20px',
  backgroundColor: '#FEF3C7',
  borderRadius: '12px',
  borderLeft: '4px solid #F59E0B',
  textAlign: 'left' as const,
};

const messageLabel = {
  margin: '0 0 8px',
  fontSize: '13px',
  fontWeight: '600',
  color: '#92400E',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const messageContent = {
  margin: '0',
  fontSize: '15px',
  lineHeight: '22px',
  color: '#78350F',
  fontStyle: 'italic' as const,
};

const ctaWrapper = {
  margin: '24px 0 0',
};

const secondaryButton = {
  display: 'inline-block',
  padding: '12px 24px',
  backgroundColor: '#ffffff',
  color: '#4f46e5',
  textDecoration: 'none',
  borderRadius: '8px',
  fontWeight: '600',
  fontSize: '14px',
  border: '2px solid #4f46e5',
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
