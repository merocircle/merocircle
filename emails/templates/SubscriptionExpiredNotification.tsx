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

interface SubscriptionExpiredNotificationProps {
  supporterName: string;
  creatorName: string;
  renewUrl: string;
  creatorProfileUrl: string;
  settingsUrl: string;
}

export default function SubscriptionExpiredNotification({
  supporterName = 'Supporter',
  creatorName = 'Creator',
  renewUrl = 'https://merocircle.app',
  creatorProfileUrl = 'https://merocircle.app',
  settingsUrl = 'https://merocircle.app/settings',
}: SubscriptionExpiredNotificationProps) {
  return (
    <Html>
      <Head />
      <Preview>{`Your subscription to ${creatorName} has expired`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>MeroCircle</Heading>
          </Section>

          <Section style={content}>
            <Heading style={h2}>Hi {supporterName},</Heading>

            <Text style={paragraph}>
              Your subscription to <strong>{creatorName}</strong> has expired.
            </Text>

            <Section style={alertBox}>
              <Text style={alertText}>
                Subscription Expired
              </Text>
              <Text style={alertSubtext}>
                You no longer have access to exclusive content
              </Text>
            </Section>

            <Text style={paragraph}>
              We hope you enjoyed supporting {creatorName}! Your subscription has now ended, 
              and you will no longer have access to:
            </Text>

            <Text style={listItem}>• Exclusive posts and content</Text>
            <Text style={listItem}>• Community chat access</Text>
            <Text style={listItem}>• Special perks from the creator</Text>

            <Text style={paragraph} style={{ marginTop: '24px' }}>
              Want to continue supporting {creatorName}? You can renew your subscription 
              anytime and regain instant access to all exclusive content.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={renewUrl}>
                Renew Your Subscription
              </Button>
            </Section>

            <Text style={thankYouText}>
              Thank you for being part of the MeroCircle community and for supporting 
              {' '}{creatorName}. We hope to see you again soon!
            </Text>
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
  backgroundColor: '#fee2e2',
  border: '2px solid #ef4444',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const alertText = {
  color: '#991b1b',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const alertSubtext = {
  color: '#991b1b',
  fontSize: '14px',
  margin: '0',
};

const listItem = {
  color: '#525f7f',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '4px 0 4px 16px',
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

const thankYouText = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'center' as const,
  marginTop: '32px',
  padding: '20px',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
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
