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
import { primaryButton, divider } from '../../components/shared/styles';

interface CreatorWelcomeEmailProps {
  firstName: string;
  dashboardUrl: string;
  settingsUrl: string;
  helpUrl: string;
  appUrl?: string;
  logoSrc?: string;
  teamImageSrc?: string;
}

const DEFAULT_APP_URL = 'https://merocircle.app';

/**
 * Creator welcome email — sent when someone completes creator signup.
 * Same warm template as WelcomeEmail, plus tips for engagement and onboarding CTA.
 */
export default function CreatorWelcomeEmail({
  firstName = 'there',
  dashboardUrl = `${DEFAULT_APP_URL}/dashboard`,
  settingsUrl = `${DEFAULT_APP_URL}/settings`,
  helpUrl = `${DEFAULT_APP_URL}/help`,
  appUrl,
  logoSrc,
  teamImageSrc,
}: CreatorWelcomeEmailProps) {
  const baseUrl = appUrl?.trim() || DEFAULT_APP_URL;
  const teamPhotoUrl = teamImageSrc ?? `${baseUrl}/email/team-photo.jpg`;

  return (
    <EmailLayout
      preview={`Hi ${firstName}, you're all set as a creator. Here's how to keep supporters engaged.`}
      settingsUrl={settingsUrl}
      helpUrl={helpUrl}
      hideCreatorInfo
      appUrl={baseUrl}
      logoSrc={logoSrc}
    >
      <Section style={topAccent} />

      <Section style={letterSection}>
        <Heading style={greeting}>Hi {firstName},</Heading>

        <Text style={paragraph}>
          You just joined Mero Circle as a creator — thank you. You now have a dedicated space to share with your supporters and grow your circle.
        </Text>

        <Text style={subheading}>Tips to keep supporters engaged</Text>
        <Text style={paragraph}>
          • <strong>Post regularly</strong> — Even short updates (once or twice a week) help people feel connected.
        </Text>
        <Text style={paragraph}>
          • <strong>Reply to comments</strong> — A quick reply makes supporters feel seen and builds loyalty.
        </Text>
        <Text style={paragraph}>
          • <strong>Use tiers</strong> — Offer something extra for higher tiers (exclusive posts, Q&As, or early access) so supporters know their support matters.
        </Text>
        <Text style={paragraph}>
          • <strong>Go live when you can</strong> — Streams and live Q&As create real-time connection and give people a reason to stay subscribed.
        </Text>

        <Text style={paragraph}>
          If anything feels off, reply to this email — it comes directly to us at{' '}
          <Link href="mailto:teams@merocircle.app" style={inlineLink}>
            teams@merocircle.app
          </Link>.
        </Text>

        <Text style={closingLine}>We're glad you're here.</Text>

        <Section style={signatureSection}>
          <Text style={signatureDash}>—</Text>
          <Text style={signatureName}>The Mero Circle Team</Text>
        </Section>
      </Section>

      <Section style={teamPhotoSection}>
        <Img
          src={teamPhotoUrl}
          alt="The Mero Circle Team"
          style={teamPhoto}
          width="480"
        />
        <Text style={teamCaption}>Building this carefully, from Kathmandu</Text>
      </Section>

      <Hr style={divider} />

      <Section style={ctaSection}>
        <Text style={ctaNotice}>
          Right now you won&apos;t be able to post until we verify you. Please complete this step as soon as you can so you can start making your circle bigger.
        </Text>
        <Link href={dashboardUrl} style={ctaButton}>
          Complete your onboarding
        </Link>
        <Text style={ctaHint}>
          Finish your profile, set up tiers, and get verified so you can publish your first post.
        </Text>
      </Section>
    </EmailLayout>
  );
}

const topAccent = {
  height: '4px',
  background: 'linear-gradient(90deg, #c4382a 0%, #e76f51 50%, #f4a261 100%)',
  borderRadius: '16px 16px 0 0',
};

const letterSection = {
  padding: '0 40px',
};

const greeting = {
  margin: '24px 0 16px',
  fontSize: '24px',
  lineHeight: '32px',
  fontWeight: '600',
  color: '#1c1917',
  letterSpacing: '-0.3px',
};

const subheading = {
  margin: '20px 0 8px',
  fontSize: '16px',
  lineHeight: '24px',
  fontWeight: '600',
  color: '#1c1917',
  letterSpacing: '-0.1px',
};

const paragraph = {
  margin: '0 0 14px',
  fontSize: '15px',
  lineHeight: '25px',
  color: '#44403c',
  letterSpacing: '-0.1px',
};

const closingLine = {
  margin: '0 0 4px',
  fontSize: '15px',
  lineHeight: '25px',
  color: '#44403c',
  fontWeight: '500' as const,
  letterSpacing: '-0.1px',
};

const signatureSection = {
  margin: '16px 0 0',
};

const signatureDash = {
  margin: '0',
  fontSize: '16px',
  lineHeight: '20px',
  color: '#a8a29e',
};

const signatureName = {
  margin: '4px 0 0',
  fontSize: '15px',
  lineHeight: '22px',
  fontWeight: '600',
  color: '#1c1917',
  letterSpacing: '-0.1px',
};

const teamPhotoSection = {
  margin: '24px 0 0',
  textAlign: 'center' as const,
};

const teamPhoto = {
  width: '100%',
  maxWidth: '480px',
  height: 'auto',
  objectFit: 'cover' as const,
};

const teamCaption = {
  margin: '8px 0 0',
  fontSize: '12px',
  lineHeight: '18px',
  color: '#a8a29e',
  fontStyle: 'italic' as const,
};

const ctaSection = {
  padding: '24px 40px 36px',
  textAlign: 'center' as const,
};

const ctaNotice = {
  margin: '0 0 16px',
  fontSize: '14px',
  lineHeight: '22px',
  color: '#44403c',
  textAlign: 'center' as const,
};

const ctaButton = {
  ...primaryButton,
  display: 'inline-block',
  padding: '14px 32px',
  fontSize: '15px',
  fontWeight: '600',
  borderRadius: '28px',
  boxShadow: '0 2px 8px rgba(196, 56, 42, 0.2)',
};

const ctaHint = {
  margin: '12px 0 0',
  fontSize: '13px',
  lineHeight: '20px',
  color: '#a8a29e',
};

const inlineLink = {
  color: '#c4382a',
  textDecoration: 'underline',
  textUnderlineOffset: '2px',
};
