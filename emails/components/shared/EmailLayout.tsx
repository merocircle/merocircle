import {
  Body,
  Container,
  Head,
  Html,
  Img,
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
  /** App base URL for logo and links (e.g. https://merocircle.app). If provided, logo is shown. */
  appUrl?: string;
}

/**
 * Shared layout — warm, personal, inner-circle feel
 */
export default function EmailLayout({
  preview,
  children,
  creatorName,
  creatorProfileUrl,
  settingsUrl,
  helpUrl,
  hideCreatorInfo = false,
  appUrl,
}: EmailLayoutProps) {
  const baseUrl = appUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://merocircle.app';

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={wrapper}>
          {/* Warm brand accent bar */}
          <Section style={brandBar} />

          {/* Logo — light theme for email clients */}
          <Section style={logoSection}>
            <Link href={baseUrl} style={logoLink}>
              <Img
                src={`${baseUrl}/logo/logo-light.png`}
                alt="MeroCircle"
                width={140}
                height={48}
                style={logoImg}
              />
            </Link>
          </Section>

          <Container style={card}>
            {children}
          </Container>

          {/* Footer — warm, personal */}
          <Section style={footer}>
            <Text style={footerText}>
              {!hideCreatorInfo && creatorName && creatorProfileUrl && (
                <>
                  <Link href={creatorProfileUrl} style={footerLink}>
                    {creatorName}&apos;s circle
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
              MeroCircle · Made with care in Kathmandu, Nepal
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Shared layout styles — warm tones
const main = {
  backgroundColor: '#fdf8f6',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  lineHeight: '1.6',
};

const wrapper = {
  padding: '40px 0',
  maxWidth: '560px',
  margin: '0 auto',
};

const brandBar = {
  height: '3px',
  background: 'linear-gradient(90deg, #c4382a 0%, #e76f51 100%)',
  marginBottom: '24px',
  borderRadius: '2px',
};

const logoSection = {
  padding: '0 40px 24px',
  textAlign: 'center' as const,
};

const logoLink = {
  display: 'inline-block',
};

const logoImg = {
  display: 'block',
  maxWidth: '140px',
  height: 'auto',
};

const card = {
  margin: '0 auto',
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  border: '1px solid #f5f0eb',
  overflow: 'hidden' as const,
};

const footer = {
  padding: '28px 32px 0',
  textAlign: 'center' as const,
  margin: '0 0 40px',
};

const footerText = {
  margin: '0 0 8px',
  fontSize: '12px',
  lineHeight: '20px',
  color: '#a8a29e',
};

const footerLink = {
  color: '#78716c',
  textDecoration: 'none',
};

const separator = {
  color: '#d6d3d1',
  margin: '0 4px',
};

const footerAddress = {
  margin: '0',
  fontSize: '11px',
  lineHeight: '16px',
  color: '#d6d3d1',
};
