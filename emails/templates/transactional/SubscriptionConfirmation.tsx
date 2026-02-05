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

interface SubscriptionConfirmationProps {
  supporterName: string;
  creatorName: string;
  tierLevel: number;
  tierName: string;
  amount: number;
  currency: string;
  creatorProfileUrl: string;
  chatUrl: string;
  settingsUrl: string;
  helpUrl: string;
}

/**
 * Subscription confirmation email
 * Triggers: When supporter successfully subscribes/supports a creator
 * Recipients: Supporter who made the payment
 */
export default function SubscriptionConfirmation({
  supporterName = 'Alex',
  creatorName = 'Sarah Chen',
  tierLevel = 2,
  tierName = 'Two Star Supporter',
  amount = 500,
  currency = 'NPR',
  creatorProfileUrl = 'https://merocircle.app/sarahchen',
  chatUrl = 'https://merocircle.app/chat',
  settingsUrl = 'https://merocircle.app/settings',
  helpUrl = 'https://merocircle.app/help',
}: SubscriptionConfirmationProps) {
  const tierEmoji = tierLevel === 1 ? '⭐' : tierLevel === 2 ? '⭐⭐' : '⭐⭐⭐';
  
  return (
    <EmailLayout
      preview={`You're now supporting ${creatorName} as a ${tierName}`}
      creatorName={creatorName}
      creatorProfileUrl={creatorProfileUrl}
      settingsUrl={settingsUrl}
      helpUrl={helpUrl}
    >
      <Section style={contentSection}>
        <Text style={successIcon}>🎉</Text>
        
        <Heading style={title}>You're now supporting {creatorName}!</Heading>

        <Text style={subtitle}>
          Thank you, {supporterName}
        </Text>

        <Text style={body}>
          Your support means everything to {creatorName}. You're helping them create and share their work with the world.
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
            <Text style={detailLabel}>Creator</Text>
            <Text style={detailValue}>{creatorName}</Text>
          </Section>
        </Section>

        <Section style={benefitsSection}>
          <Text style={benefitsTitle}>What you get:</Text>
          <Text style={benefitItem}>✓ Access to exclusive posts</Text>
          {tierLevel >= 2 && (
            <Text style={benefitItem}>✓ Join community chat channels</Text>
          )}
          {tierLevel >= 3 && (
            <Text style={benefitItem}>✓ Special perks and priority support</Text>
          )}
        </Section>

        <Section style={ctaWrapper}>
          <Link href={creatorProfileUrl} style={primaryButton}>
            Visit {creatorName}'s Profile
          </Link>
        </Section>

        {tierLevel >= 2 && (
          <Section style={ctaWrapper}>
            <Link href={chatUrl} style={secondaryButton}>
              Join Community Chat
            </Link>
          </Section>
        )}
      </Section>

      <Hr style={divider} />

      <Section style={messageSection}>
        <Text style={messageText}>
          You now have access to all of {creatorName}'s exclusive content and community features.
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

const benefitsSection = {
  margin: '32px 0',
  padding: '24px',
  backgroundColor: '#F0FDF4',
  borderRadius: '12px',
  textAlign: 'left' as const,
};

const benefitsTitle = {
  margin: '0 0 16px',
  fontSize: '16px',
  fontWeight: '600',
  color: '#111827',
};

const benefitItem = {
  margin: '0 0 8px',
  fontSize: '14px',
  lineHeight: '20px',
  color: '#166534',
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
