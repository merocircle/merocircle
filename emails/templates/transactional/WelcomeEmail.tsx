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

interface WelcomeEmailProps {
  firstName: string;
  exploreUrl: string;
  settingsUrl: string;
  helpUrl: string;
}

/**
 * Welcome email — a concise personal note from the Mero Circle team
 * Triggered when someone creates an account.
 */
export default function WelcomeEmail({
  firstName = 'there',
  exploreUrl = 'https://merocircle.app/explore',
  settingsUrl = 'https://merocircle.app/settings',
  helpUrl = 'https://merocircle.app/help',
}: WelcomeEmailProps) {
  return (
    <EmailLayout
      preview={`Hi ${firstName}, welcome to Mero Circle — we're glad you're here.`}
      settingsUrl={settingsUrl}
      helpUrl={helpUrl}
      hideCreatorInfo
      appUrl={appUrl}
      logoSrc={logoSrc}
    >
      {/* Top accent */}
      <Section style={topAccent} />

      {/* Logo */}
      <Section style={logoSection}>
        <Img
          src={`${appUrl}/logo/logo.png`}
          alt="MeroCircle"
          style={logo}
          width="122"
          height="72"
        />
      </Section>

      {/* Letter */}
      <Section style={letterSection}>
        <Heading style={greeting}>
          Hi {firstName},
        </Heading>

        <Text style={paragraph}>
          We just got notified that you joined Mero Circle, and it genuinely made our day. Thank you for being here.
        </Text>

        <Text style={paragraph}>
          On average, you'll spend 15 years of your life on social media consuming useless content. Most platforms optimize for attention: more posts, more reach, more noise.
        </Text>
        <Text style={paragraph}>
          We built the opposite: a private space where creators show up intentionally and supporters participate meaningfully.
        </Text>
        <Text style={paragraph}>
          Fewer distractions. Stronger connection. That&apos;s it.
        </Text>

        <Text style={paragraph}>
          If anything feels off, reply to this email — it comes directly to us at{' '}
          <Link href="mailto:teams@merocircle.app" style={inlineLink}>
            teams@merocircle.app
          </Link>.
        </Text>

        <Text style={closingLine}>
          Thank you for being part of the beginning.
        </Text>

        {/* Signature */}
        <Section style={signatureSection}>
          <Text style={signatureDash}>—</Text>
          <Text style={signatureName}>The Mero Circle Team</Text>
        </Section>
      </Section>

      {/* Team photo */}
      <Section style={teamPhotoSection}>
        <Img
          src={`${appUrl}/email/team-photo.jpg`}
          alt="The Mero Circle Team"
          style={teamPhoto}
          width="480"
        />
        <Text style={teamCaption}>
          Building this carefully, from Kathmandu
        </Text>
      </Section>

      <Hr style={divider} />

      {/* Video — watch what we're building */}
      <Section style={videoSection}>
        <Text style={videoLabel}>See what we&apos;re building</Text>
        <Link href="https://www.youtube.com/watch?v=PLACEHOLDER" style={videoLink}>
          <Img
            src={`${appUrl}/email/video-thumbnail.jpg`}
            alt="Watch: What is Mero Circle?"
            style={videoThumbnail}
            width="480"
          />
          {/* Play button overlay */}
          <Section style={playButtonWrapper}>
            <Text style={playButton}>&#9654;</Text>
          </Section>
        </Link>
        <Text style={videoCaption}>
          A 2-minute walkthrough of Mero Circle
        </Text>
      </Section>

      <Hr style={divider} />

      {/* CTA */}
      <Section style={ctaSection}>
        <Link href={exploreUrl} style={ctaButton}>
          Explore creators
        </Link>
        <Text style={ctaHint}>
          Find creators you care about and step inside their circle.
        </Text>
      </Section>
    </EmailLayout>
  );
}

/* ─── Styles ────────────────────────────────────────────── */

const topAccent = {
  height: '4px',
  background: 'linear-gradient(90deg, #c4382a 0%, #e76f51 50%, #f4a261 100%)',
  borderRadius: '16px 16px 0 0',
};

const logoSection = {
  textAlign: 'center' as const,
  padding: '32px 0 8px',
};

const logo = {
  margin: '0 auto',
  borderRadius: '12px',
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

const videoSection = {
  padding: '24px 40px 8px',
  textAlign: 'center' as const,
};

const videoLabel = {
  margin: '0 0 14px',
  fontSize: '13px',
  lineHeight: '18px',
  fontWeight: '600',
  color: '#78716c',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.8px',
};

const videoLink = {
  display: 'block',
  textDecoration: 'none',
  position: 'relative' as const,
};

const videoThumbnail = {
  width: '100%',
  maxWidth: '480px',
  height: 'auto',
  borderRadius: '12px',
  border: '1px solid #f0ebe6',
};

const playButtonWrapper = {
  margin: '-60px auto 20px',
  textAlign: 'center' as const,
};

const playButton = {
  display: 'inline-block',
  width: '52px',
  height: '52px',
  lineHeight: '52px',
  fontSize: '20px',
  color: '#ffffff',
  backgroundColor: 'rgba(196, 56, 42, 0.9)',
  borderRadius: '50%',
  textAlign: 'center' as const,
  margin: '0 auto',
};

const videoCaption = {
  margin: '0 0 0',
  fontSize: '13px',
  lineHeight: '20px',
  color: '#a8a29e',
};

const ctaSection = {
  padding: '24px 40px 36px',
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
