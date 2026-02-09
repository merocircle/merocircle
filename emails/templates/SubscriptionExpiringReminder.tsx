import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Button,
} from '@react-email/components';
import * as React from 'react';

interface SubscriptionExpiringReminderProps {
  supporterName: string;
  creatorName: string;
  daysUntilExpiry: number;
  expiryDate: string;
  tierLevel: number;
  renewUrl: string;
  creatorProfileUrl: string;
  settingsUrl: string;
}

export default function SubscriptionExpiringReminder({
  supporterName = 'Supporter',
  creatorName = 'Creator',
  daysUntilExpiry = 2,
  expiryDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  tierLevel = 1,
  renewUrl = 'https://merocircle.app',
  creatorProfileUrl = 'https://merocircle.app',
  settingsUrl = 'https://merocircle.app/settings',
}: SubscriptionExpiringReminderProps) {
  const formattedDate = new Date(expiryDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const tierNames = ['', 'One Star Supporter', 'Two Star Supporter', 'Three Star Supporter'];
  const tierName = tierNames[tierLevel] || `Tier ${tierLevel}`;

  const urgencyMessage = daysUntilExpiry === 1 
    ? 'Your subscription expires tomorrow!' 
    : `Your subscription expires in ${daysUntilExpiry} days`;

  return (
    <Html>
      <Head />
      <Preview>{`${urgencyMessage} - Renew your support for ${creatorName}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>MeroCircle</Heading>
          </Section>

          <Section style={content}>
            <Heading style={h2}>Hi {supporterName},</Heading>

            <Text style={paragraph}>
              This is a friendly reminder that your <strong>{tierName}</strong> subscription 
              to <strong>{creatorName}</strong> is expiring soon.
            </Text>

            <Section style={alertBox}>
              <Text style={alertText}>
                {urgencyMessage}
              </Text>
              <Text style={expiryDateText}>
                Expiry Date: {formattedDate}
              </Text>
            </Section>

            <Text style={paragraph}>
              To continue enjoying exclusive content and access to {creatorName}'s community, 
              please renew your subscription before it expires.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={renewUrl}>
                Renew Subscription Now
              </Button>
            </Section>

            <Text style={paragraph}>
              Or visit {creatorName}'s profile to choose a different tier:
            </Text>

            <Section style={linkContainer}>
              <Link href={creatorProfileUrl} style={link}>
                {creatorProfileUrl}
              </Link>
            </Section>

            <Text style={smallText}>
              After your subscription expires, you will lose access to:
            </Text>
            <Text style={listItem}>• Exclusive posts and content</Text>
            <Text style={listItem}>• Community chat access (if applicable)</Text>
            <Text style={listItem}>• Special perks from the creator</Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Manage your subscriptions anytime from your{' '}
              <Link href={settingsUrl} style={footerLink}>
                settings page
              </Link>
              .
            </Text>
            <Text style={footerText}>
              MeroCircle - Empowering Nepali Creators
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 20px',
  backgroundColor: '#8b5cf6',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
};

const h2 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '30px 0',
};

const content = {
  padding: '0 40px',
};

const paragraph = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
  marginBottom: '16px',
};

const alertBox = {
  backgroundColor: '#fff3cd',
  border: '2px solid #ffc107',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const alertText = {
  color: '#856404',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const expiryDateText = {
  color: '#856404',
  fontSize: '16px',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#8b5cf6',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const linkContainer = {
  textAlign: 'center' as const,
  marginBottom: '24px',
};

const link = {
  color: '#8b5cf6',
  fontSize: '14px',
  textDecoration: 'underline',
};

const smallText = {
  color: '#525f7f',
  fontSize: '14px',
  lineHeight: '20px',
  marginTop: '24px',
  marginBottom: '8px',
};

const listItem = {
  color: '#525f7f',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '4px 0 4px 16px',
};

const footer = {
  borderTop: '1px solid #e6ebf1',
  marginTop: '32px',
  padding: '20px 40px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  marginBottom: '8px',
};

const footerLink = {
  color: '#8b5cf6',
  textDecoration: 'underline',
};
