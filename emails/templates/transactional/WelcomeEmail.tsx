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
  userName: string;
  userRole: 'creator' | 'supporter';
  profileUrl: string;
  exploreUrl: string;
  settingsUrl: string;
  helpUrl: string;
  appUrl?: string;
  /** Logo src (URL or base64 data URL) so it displays in email */
  logoSrc?: string;
  /** Team image src (URL or base64 data URL) so it displays in email */
  teamImageSrc?: string;
}

export default function WelcomeEmail({
  userName = 'Alex',
  userRole = 'supporter',
  profileUrl = 'https://merocircle.app/profile',
  exploreUrl = 'https://merocircle.app/explore',
  settingsUrl = 'https://merocircle.app/settings',
  helpUrl = 'https://merocircle.app/help',
  appUrl = 'https://merocircle.app',
  logoSrc,
  teamImageSrc,
}: WelcomeEmailProps) {
  const isCreator = userRole === 'creator';
  const teamImageUrl = teamImageSrc || `${appUrl}/team.jpg`;

  return (
    <EmailLayout
      preview={`Welcome to your circle, ${userName}`}
      settingsUrl={settingsUrl}
      helpUrl={helpUrl}
      hideCreatorInfo
      appUrl={appUrl}
      logoSrc={logoSrc}
    >
      <Section style={contentSection}>
        <Heading style={title}>
          {isCreator ? `Welcome home, ${userName}` : `Hey ${userName}, you're in`}
        </Heading>

        <Text style={subtitle}>
          {isCreator
            ? "Your circle starts here. A space where your people gather, your work lives, and real connections grow."
            : "You just joined something personal. MeroCircle is where you get closer to the creators you love — no noise, no algorithms."}
        </Text>

        {isCreator ? (
          <>
            <Section style={featureGrid}>
              <Section style={feature}>
                <Text style={featureIcon}>✍️</Text>
                <Text style={featureTitle}>Share with your circle</Text>
                <Text style={featureDescription}>
                  Post updates, polls, photos, and exclusive content. Only the people who matter will see it.
                </Text>
              </Section>

              <Section style={feature}>
                <Text style={featureIcon}>💬</Text>
                <Text style={featureTitle}>Talk directly</Text>
                <Text style={featureDescription}>
                  Private channels, DMs, and real-time chat with the people who support your work.
                </Text>
              </Section>

              <Section style={feature}>
                <Text style={featureIcon}>🤝</Text>
                <Text style={featureTitle}>Earn on your terms</Text>
                <Text style={featureDescription}>
                  Multiple tiers, local payment options, and full control over your creative practice.
                </Text>
              </Section>
            </Section>

            <Section style={ctaWrapper}>
              <Link href={profileUrl} style={primaryButton}>
                Set up your circle
              </Link>
            </Section>
          </>
        ) : (
          <>
            <Text style={bodyBlock}>
              Explore creators, join their circles, and unlock posts, chats, and content made just for their closest supporters.
            </Text>
            <Section style={ctaWrapper}>
              <Link href={exploreUrl} style={primaryButton}>
                Find your people
              </Link>
            </Section>
          </>
        )}
      </Section>

      <Hr style={divider} />

      <Section style={teamSection}>
        <Img
          src={teamImageUrl}
          alt="The MeroCircle team"
          width={480}
          height={320}
          style={teamImage}
        />
        <Text style={teamGreeting}>
          Greetings from the team. We&apos;re here to help.
        </Text>
      </Section>

      <Hr style={divider} />

      <Section style={messageSection}>
        <Text style={messageText}>
          Questions? Just reply to this email — a real person will get back to you.
        </Text>
      </Section>
    </EmailLayout>
  );
}

const contentSection = {
  padding: '32px 32px 24px',
};

const title = {
  margin: '0 0 16px',
  fontSize: '26px',
  lineHeight: '34px',
  fontWeight: '700',
  color: '#1c1917',
  letterSpacing: '-0.5px',
  textAlign: 'center' as const,
};

const subtitle = {
  margin: '0 0 20px',
  fontSize: '15px',
  lineHeight: '24px',
  color: '#78716c',
  textAlign: 'center' as const,
};

const bodyBlock = {
  margin: '0 0 24px',
  fontSize: '15px',
  lineHeight: '24px',
  color: '#44403c',
  textAlign: 'center' as const,
};

const featureGrid = {
  margin: '28px 0',
};

const feature = {
  marginBottom: '24px',
  textAlign: 'center' as const,
};

const featureIcon = {
  margin: '0 0 4px',
  fontSize: '20px',
  lineHeight: '24px',
  textAlign: 'center' as const,
};

const featureTitle = {
  margin: '0 0 4px',
  fontSize: '15px',
  fontWeight: '600',
  color: '#1c1917',
  lineHeight: '22px',
  textAlign: 'center' as const,
};

const featureDescription = {
  margin: '0',
  fontSize: '14px',
  lineHeight: '22px',
  color: '#78716c',
  textAlign: 'center' as const,
};

const ctaWrapper = {
  margin: '24px 0 32px',
  textAlign: 'center' as const,
};

const teamSection = {
  padding: '24px 32px',
  textAlign: 'center' as const,
};

const teamImage = {
  display: 'block',
  width: '100%',
  maxWidth: '480px',
  height: 'auto',
  margin: '0 auto 16px',
  borderRadius: '12px',
};

const teamGreeting = {
  margin: '0',
  fontSize: '14px',
  lineHeight: '22px',
  color: '#78716c',
  textAlign: 'center' as const,
};

const messageSection = {
  padding: '0 32px 32px',
};

const messageText = {
  margin: '0',
  fontSize: '13px',
  lineHeight: '20px',
  color: '#a8a29e',
  textAlign: 'center' as const,
};
