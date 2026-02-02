import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
  creatorName?: string;
  creatorProfileUrl?: string;
  settingsUrl: string;
  helpUrl: string;
  hideCreatorInfo?: boolean;
}

/**
 * Shared layout component for all emails
 * Provides consistent structure, branding, and footer
 */
export default function EmailLayout({
  preview,
  children,
  creatorName,
  creatorProfileUrl,
  settingsUrl,
  helpUrl,
  hideCreatorInfo = false,
}: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={wrapper}>
          {/* Brand accent bar */}
          <Section style={brandBar} />

          <Container style={card}>
            {children}
          </Container>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              {!hideCreatorInfo && creatorName && creatorProfileUrl && (
                <>
                  <Link href={creatorProfileUrl} style={footerLink}>
                    {creatorName}'s profile
                  </Link>
                  <span style={separator}> · </span>
                </>
              )}
              <Link href={settingsUrl} style={footerLink}>
                Preferences
              </Link>
              <span style={separator}> · </span>
              <Link href={helpUrl} style={footerLink}>
                Help
              </Link>
            </Text>
            <Text style={footerAddress}>
              MeroCircle · Kathmandu, Nepal
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Shared layout styles
const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  lineHeight: '1.6',
};

const wrapper = {
  padding: '48px 0',
  maxWidth: '600px',
  margin: '0 auto',
};

const brandBar = {
  height: '3px',
  background: 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)',
  marginBottom: '40px',
};

const card = {
  margin: '0 auto',
};

const footer = {
  padding: '32px 40px 0',
  textAlign: 'center' as const,
  borderTop: '1px solid #F3F4F6',
  margin: '0 0 48px',
};

const footerText = {
  margin: '0 0 12px',
  fontSize: '13px',
  lineHeight: '20px',
  color: '#9CA3AF',
};

const footerLink = {
  color: '#6B7280',
  textDecoration: 'none',
};

const separator = {
  color: '#D1D5DB',
  margin: '0 4px',
};

const footerAddress = {
  margin: '0',
  fontSize: '12px',
  lineHeight: '18px',
  color: '#D1D5DB',
};
