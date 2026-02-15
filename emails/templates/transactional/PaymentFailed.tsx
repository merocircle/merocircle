import {
  Heading,
  Hr,
  Link,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../../components/shared/EmailLayout';
import { primaryButton, secondaryButton, body, divider } from '../../components/shared/styles';

interface PaymentFailedProps {
  supporterName: string;
  creatorName: string;
  amount: number;
  currency: string;
  errorMessage?: string;
  retryUrl: string;
  creatorProfileUrl: string;
  settingsUrl: string;
  helpUrl: string;
  appUrl?: string;
  logoSrc?: string;
}

/**
 * Payment failure notification
 * Triggers: Payment processing fails
 * Recipients: Supporter whose payment failed
 */
export default function PaymentFailed({
  supporterName = 'Alex',
  creatorName = 'Sarah Chen',
  amount = 500,
  currency = 'NPR',
  errorMessage = 'Your payment could not be processed',
  retryUrl = 'https://merocircle.app/payment/retry/123',
  creatorProfileUrl = 'https://merocircle.app/sarahchen',
  settingsUrl = 'https://merocircle.app/settings',
  helpUrl = 'https://merocircle.app/help',
  appUrl,
  logoSrc,
}: PaymentFailedProps) {
  return (
    <EmailLayout
      preview="We ran into a snag - Quick fix available"
      creatorName={creatorName}
      creatorProfileUrl={creatorProfileUrl}
      settingsUrl={settingsUrl}
      helpUrl={helpUrl}
      appUrl={appUrl}
      logoSrc={logoSrc}
    >
      <Section style={contentSection}>
        <Text style={errorIcon}>!</Text>
        
        <Heading style={title}>We ran into a snag</Heading>

        <Text style={subtitle}>
          Hi {supporterName}
        </Text>

        <Text style={body}>
          We weren't able to process your payment of {currency} {amount.toLocaleString()} to support {creatorName}. No worries—this happens sometimes, and we're here to help.
        </Text>

        <Section style={errorCard}>
          <Text style={errorText}>{errorMessage}</Text>
        </Section>

        <Text style={reasonsTitle}>
          Common reasons (easy to fix):
        </Text>

        <Section style={reasonsList}>
          <Text style={reason}>• Insufficient funds</Text>
          <Text style={reason}>• Card expired or needs verification</Text>
          <Text style={reason}>• Bank declined the transaction</Text>
        </Section>

        <Section style={ctaWrapper}>
          <Link href={retryUrl} style={primaryButton}>
            Retry payment
          </Link>
        </Section>

        <Section style={secondaryCtaWrapper}>
          <Link href={helpUrl} style={secondaryLink}>
            Contact support
          </Link>
        </Section>
      </Section>

      <Hr style={divider} />

      <Section style={messageSection}>
        <Text style={messageText}>
          Our support team is here to help—reply to this email or visit our help center anytime.
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

const errorIcon = {
  fontSize: '32px',
  margin: '0 0 24px',
  display: 'inline-block',
  width: '64px',
  height: '64px',
  lineHeight: '64px',
  borderRadius: '50%',
  backgroundColor: '#EF4444',
  color: '#ffffff',
  fontWeight: '600' as const,
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

const errorCard = {
  margin: '24px 0',
  padding: '16px 20px',
  backgroundColor: '#FEF2F2',
  borderRadius: '8px',
  borderLeft: '3px solid #EF4444',
  textAlign: 'left' as const,
};

const errorText = {
  margin: '0',
  fontSize: '14px',
  color: '#DC2626',
  lineHeight: '20px',
};

const reasonsTitle = {
  margin: '24px 0 12px',
  fontSize: '14px',
  lineHeight: '20px',
  fontWeight: '500',
  color: '#78716c',
  textAlign: 'left' as const,
};

const reasonsList = {
  margin: '0 0 32px',
  textAlign: 'left' as const,
};

const reason = {
  margin: '0 0 8px',
  fontSize: '14px',
  color: '#78716c',
  lineHeight: '20px',
};

const ctaWrapper = {
  margin: '0 0 16px',
  textAlign: 'center' as const,
};

const secondaryCtaWrapper = {
  margin: '0',
  textAlign: 'center' as const,
};

const secondaryLink = {
  color: '#c4382a',
  textDecoration: 'none',
  fontSize: '15px',
  fontWeight: '500',
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
