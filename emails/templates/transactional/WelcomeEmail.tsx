import {
  Heading,
  Hr,
  Img,
  Link,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../../components/shared/EmailLayout';
import { primaryButton, secondaryButton, body, divider } from '../../components/shared/styles';

interface WelcomeEmailProps {
  userName: string;
  userRole: 'creator' | 'supporter';
  profileUrl: string;
  exploreUrl: string;
  settingsUrl: string;
  helpUrl: string;
}

/**
 * Welcome email sent to new users
 * Triggers: User completes signup
 * Recipients: New users (both creators and supporters)
 */
export default function WelcomeEmail({
  userName = 'Alex',
  userRole = 'supporter',
  profileUrl = 'https://merocircle.app/profile',
  exploreUrl = 'https://merocircle.app/explore',
  settingsUrl = 'https://merocircle.app/settings',
  helpUrl = 'https://merocircle.app/help',
}: WelcomeEmailProps) {
  const isCreator = userRole === 'creator';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://merocircle.app';

  return (
    <EmailLayout
      preview={`Welcome to MeroCircle, ${userName}`}
      settingsUrl={settingsUrl}
      helpUrl={helpUrl}
      hideCreatorInfo
    >
      <Section style={contentSection}>
        <Section style={logoSection}>
          <Img
            src={`${appUrl}/logo/logo.png`}
            alt="MeroCircle"
            style={logo}
            width="120"
          />
        </Section>

        <Heading style={title}>
          Welcome to MeroCircle
        </Heading>

        <Text style={subtitle}>
          {isCreator 
            ? `${userName}, you're now part of a platform where creators thrive.`
            : `${userName}, you're now part of a community that empowers creators.`}
        </Text>

        <Text style={body}>
          {isCreator 
            ? "MeroCircle is where meaningful connections happen. Share your work, engage with supporters, and build a sustainable creative practice."
            : "Your support makes a real difference. Connect with creators you love and be part of their journey."}
        </Text>

        {isCreator ? (
          <>
            <Section style={featureGrid}>
              <Section style={feature}>
                <Text style={featureTitle}>Share your best work</Text>
                <Text style={featureDescription}>
                  Post updates, polls, and exclusive content. Your supporters will be notified instantly.
                </Text>
              </Section>

              <Section style={feature}>
                <Text style={featureTitle}>Build real connections</Text>
                <Text style={featureDescription}>
                  Engage directly with people who believe in what you create. No algorithms, just community.
                </Text>
              </Section>

              <Section style={feature}>
                <Text style={featureTitle}>Earn sustainably</Text>
                <Text style={featureDescription}>
                  Get paid for your work. Track earnings and grow your creative business on your terms.
                </Text>
              </Section>
            </Section>

            <Section style={ctaWrapper}>
              <Link href={profileUrl} style={primaryButton}>
                Set up your profile
              </Link>
            </Section>
          </>
        ) : (
          <>
            <Section style={ctaWrapper}>
              <Link href={exploreUrl} style={primaryButton}>
                Discover creators
              </Link>
            </Section>
          </>
        )}
      </Section>

      <Hr style={divider} />

      <Section style={messageSection}>
        <Text style={messageText}>
          Need help getting started? Visit our{' '}
          <Link href={helpUrl} style={inlineLink}>
            help center
          </Link>
          {' '}or reply to this email.
        </Text>
      </Section>
    </EmailLayout>
  );
}

// Component-specific styles
const contentSection = {
  padding: '0 40px',
};

const logoSection = {
  textAlign: 'center' as const,
  margin: '0 0 32px',
};

const logo = {
  margin: '0 auto',
};

const title = {
  margin: '0 0 12px',
  fontSize: '32px',
  lineHeight: '40px',
  fontWeight: '700',
  color: '#111827',
  letterSpacing: '-0.8px',
  textAlign: 'center' as const,
};

const subtitle = {
  margin: '0 0 24px',
  fontSize: '17px',
  lineHeight: '26px',
  color: '#6B7280',
  textAlign: 'center' as const,
};

const featureGrid = {
  margin: '40px 0',
};

const feature = {
  marginBottom: '28px',
};

const featureTitle = {
  margin: '0 0 6px',
  fontSize: '16px',
  fontWeight: '600',
  color: '#111827',
  lineHeight: '24px',
};

const featureDescription = {
  margin: '0',
  fontSize: '15px',
  lineHeight: '24px',
  color: '#6B7280',
};

const ctaWrapper = {
  margin: '32px 0 48px',
  textAlign: 'center' as const,
};

const messageSection = {
  padding: '0 40px 48px',
};

const messageText = {
  margin: '0',
  fontSize: '14px',
  lineHeight: '22px',
  color: '#6B7280',
  textAlign: 'center' as const,
  letterSpacing: '-0.1px',
};

const inlineLink = {
  color: '#4f46e5',
  textDecoration: 'none',
};
