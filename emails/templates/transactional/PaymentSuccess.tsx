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

interface PaymentSuccessProps {
  supporterName: string;
  creatorName: string;
  amount: number;
  currency: string;
  transactionId: string;
  creatorProfileUrl: string;
  receiptUrl: string;
  settingsUrl: string;
  helpUrl: string;
  appUrl?: string;
  logoSrc?: string;
}

/**
 * Payment confirmation email
 * Triggers: Successful payment completion
 * Recipients: Supporter who made the payment
 */
export default function PaymentSuccess({
  supporterName = 'Alex',
  creatorName = 'Sarah Chen',
  amount = 500,
  currency = 'NPR',
  transactionId = 'TXN_123456789',
  creatorProfileUrl = 'https://merocircle.app/sarahchen',
  receiptUrl = 'https://merocircle.app/receipts/123',
  settingsUrl = 'https://merocircle.app/settings',
  helpUrl = 'https://merocircle.app/help',
  appUrl,
  logoSrc,
}: PaymentSuccessProps) {
  return (
    <EmailLayout
      preview={`Your support just landed - Supporting ${creatorName}`}
      creatorName={creatorName}
      creatorProfileUrl={creatorProfileUrl}
      settingsUrl={settingsUrl}
      helpUrl={helpUrl}
      appUrl={appUrl}
      logoSrc={logoSrc}
    >
      <Section style={contentSection}>
        <Text style={successIcon}>✓</Text>
        
        <Heading style={title}>Your support just landed</Heading>

        <Text style={subtitle}>
          Thanks, {supporterName}
        </Text>

        <Text style={body}>
          Your support means the world to {creatorName}. You're helping them create and share their work with their circle.
        </Text>

        <Section style={detailsCard}>
          <Section style={detailRow}>
            <Text style={detailLabel}>Amount</Text>
            <Text style={detailValue}>
              {currency} {amount.toLocaleString()}
            </Text>
          </Section>
          
          <Section style={detailRow}>
            <Text style={detailLabel}>Creator</Text>
            <Text style={detailValue}>{creatorName}</Text>
          </Section>

          <Section style={detailRow}>
            <Text style={detailLabel}>Transaction ID</Text>
            <Text style={detailValue}>{transactionId}</Text>
          </Section>
        </Section>

        <Section style={ctaWrapper}>
          <Link href={receiptUrl} style={primaryButton}>
            View receipt
          </Link>
        </Section>
      </Section>

      <Hr style={divider} />

      <Section style={messageSection}>
        <Text style={messageText}>
          You now have access to all of {creatorName}'s posts and exclusive content in their circle.
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
  width: '64px',
  height: '64px',
  lineHeight: '64px',
  borderRadius: '50%',
  backgroundColor: '#10B981',
  color: '#ffffff',
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

const ctaWrapper = {
  margin: '32px 0 0',
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
