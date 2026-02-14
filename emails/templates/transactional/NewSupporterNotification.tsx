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
 * New circle member notification email
 * Triggers: When someone joins a creator's circle
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
      preview={`${supporterName} just joined your circle — ${currency} ${amount}`}
      settingsUrl={settingsUrl}
      helpUrl={helpUrl}
      hideCreatorInfo={true}
    >
      <Section style={contentSection}>
        <Text style={successIcon}>🎊</Text>

        <Heading style={title}>Someone joined your circle</Heading>

        <Text style={subtitle}>
          {supporterName} is now part of your inner circle
        </Text>

        <Text style={body}>
          Someone believes in what you&apos;re creating and wanted to be closer to your work. Your people are here.
        </Text>

        <Section style={detailsCard}>
          <Section style={tierBadge}>
            <Text style={tierEmojiText}>{tierEmoji}</Text>
            <Text style={tierNameText}>{tierName}</Text>
          </Section>

          <Section style={detailRow}>
            <Text style={detailLabel}>Their contribution</Text>
            <Text style={detailValue}>
              {currency} {amount.toLocaleString()}
            </Text>
          </Section>

          <Section style={detailRow}>
            <Text style={detailLabel}>Circle member</Text>
            <Text style={detailValue}>{supporterName}</Text>
          </Section>
        </Section>

        {supporterMessage && (
          <Section style={messageCard}>
            <Text style={messageLabel}>A note from {supporterName}:</Text>
            <Text style={messageContent}>{supporterMessage}</Text>
          </Section>
        )}

        <Section style={ctaWrapper}>
          <Link href={supportersUrl} style={primaryButton}>
            See who&apos;s in your circle
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
          Keep creating — your circle is here to cheer you on.
        </Text>
        <Text style={messageSubtext}>
          Questions? <Link href={helpUrl} style={inlineLink}>We&apos;re here to help</Link>
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
  color: '#1c1917',
  letterSpacing: '-0.6px',
};

const subtitle = {
  margin: '0 0 20px',
  fontSize: '17px',
  lineHeight: '26px',
  color: '#78716c',
};

const detailsCard = {
  margin: '32px 0',
  padding: '24px',
  backgroundColor: '#fafaf9',
  borderRadius: '12px',
  textAlign: 'left' as const,
};

const tierBadge = {
  textAlign: 'center' as const,
  marginBottom: '20px',
  paddingBottom: '20px',
  borderBottom: '1px solid #e7e5e4',
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
  color: '#1c1917',
};

const detailRow = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '16px',
};

const detailLabel = {
  margin: '0',
  fontSize: '14px',
  color: '#78716c',
  fontWeight: '500',
};

const detailValue = {
  margin: '0',
  fontSize: '14px',
  color: '#1c1917',
  fontWeight: '600',
};

const messageCard = {
  margin: '24px 0',
  padding: '20px',
  backgroundColor: '#fef7f5',
  borderRadius: '12px',
  borderLeft: '4px solid #c4382a',
  textAlign: 'left' as const,
};

const messageLabel = {
  margin: '0 0 8px',
  fontSize: '13px',
  fontWeight: '600',
  color: '#a12e23',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const messageContent = {
  margin: '0',
  fontSize: '15px',
  lineHeight: '22px',
  color: '#44403c',
  fontStyle: 'italic' as const,
};

const ctaWrapper = {
  margin: '24px 0 0',
};

const secondaryButton = {
  display: 'inline-block',
  padding: '12px 24px',
  backgroundColor: '#ffffff',
  color: '#c4382a',
  textDecoration: 'none',
  borderRadius: '8px',
  fontWeight: '600',
  fontSize: '14px',
  border: '2px solid #c4382a',
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
