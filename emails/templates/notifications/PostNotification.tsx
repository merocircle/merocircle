import {
  Container,
  Heading,
  Hr,
  Img,
  Link,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../../components/shared/EmailLayout';
import { primaryButton, body, divider } from '../../components/shared/styles';

interface PostNotificationProps {
  supporterName: string;
  creatorName: string;
  postTitle: string;
  postContent: string;
  postImageUrl?: string | null;
  postUrl: string;
  creatorProfileUrl: string;
  settingsUrl: string;
  helpUrl: string;
}

/**
 * Email sent when a creator publishes a new post
 * Triggers: Creator creates a post
 * Recipients: All active supporters
 */
export default function PostNotification({
  supporterName = 'Alex',
  creatorName = 'Sarah Chen',
  postTitle = 'The future of creative collaboration',
  postContent = "I've been working on something that challenges how we think about community and creativity. This isn't just another project—it's a fundamental shift in how creators and supporters connect.",
  postImageUrl = 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=1200&h=600&fit=crop&q=80',
  postUrl = 'https://merocircle.app/sarahchen/posts/123',
  creatorProfileUrl = 'https://merocircle.app/sarahchen',
  settingsUrl = 'https://merocircle.app/settings',
  helpUrl = 'https://merocircle.app/help',
}: PostNotificationProps) {
  const preview = postContent.length > 160 ? postContent.substring(0, 160) + '…' : postContent;

  return (
    <EmailLayout
      preview={`New from ${creatorName}: ${postTitle}`}
      creatorName={creatorName}
      creatorProfileUrl={creatorProfileUrl}
      settingsUrl={settingsUrl}
      helpUrl={helpUrl}
    >
      <Section style={contentSection}>
        <Text style={greeting}>Hi {supporterName},</Text>
        
        <Text style={label}>{creatorName} just posted</Text>
        
        <Heading style={title}>{postTitle}</Heading>

        {postImageUrl && (
          <Section style={imageWrapper}>
            <Link href={postUrl} style={imageLink}>
              <Img src={postImageUrl} alt="" style={heroImage} />
            </Link>
          </Section>
        )}

        <Text style={contentPreview}>{preview}</Text>

        <Section style={ctaWrapper}>
          <Link href={postUrl} style={primaryButton}>
            Read the full post
          </Link>
        </Section>
      </Section>

      <Hr style={divider} />

      <Section style={messageSection}>
        <Text style={messageText}>
          You're supporting {creatorName}. Your support makes their work possible.
        </Text>
        <Text style={messageSubtext}>
          <Link href={settingsUrl} style={inlineLink}>Manage your preferences</Link>
        </Text>
      </Section>
    </EmailLayout>
  );
}

// Component-specific styles
const contentSection = {
  padding: '48px 40px 40px',
};

const greeting = {
  margin: '0 0 4px',
  fontSize: '15px',
  lineHeight: '24px',
  color: '#6B7280',
};

const label = {
  margin: '0 0 16px',
  fontSize: '12px',
  lineHeight: '16px',
  fontWeight: '500',
  color: '#9CA3AF',
  letterSpacing: '0.5px',
  textTransform: 'uppercase' as const,
};

const title = {
  margin: '0 0 32px',
  fontSize: '30px',
  lineHeight: '38px',
  fontWeight: '700',
  color: '#111827',
  letterSpacing: '-0.8px',
};

const contentPreview = {
  margin: '0 0 32px',
  fontSize: '16px',
  lineHeight: '26px',
  color: '#4B5563',
  letterSpacing: '-0.2px',
};

const imageWrapper = {
  margin: '0 0 32px',
};

const imageLink = {
  display: 'block',
  borderRadius: '12px',
  overflow: 'hidden',
  border: '1px solid #E5E7EB',
};

const heroImage = {
  width: '100%',
  height: 'auto',
  display: 'block',
  margin: '0',
};

const ctaWrapper = {
  margin: '0 0 48px',
};

const messageSection = {
  padding: '32px 40px 48px',
  textAlign: 'center' as const,
};

const messageText = {
  margin: '0 0 8px',
  fontSize: '14px',
  lineHeight: '20px',
  color: '#6B7280',
};

const messageSubtext = {
  margin: '0',
  fontSize: '13px',
  lineHeight: '20px',
  color: '#9CA3AF',
};

const inlineLink = {
  color: '#4f46e5',
  textDecoration: 'none',
};
