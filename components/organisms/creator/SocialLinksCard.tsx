'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Share2,
  Facebook,
  Youtube,
  Instagram,
  Linkedin,
  Twitter,
  Globe,
  Link as LinkIcon,
  MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { staggerContainer, fadeInUp } from '@/components/animations/variants';

interface SocialLinks {
  facebook?: string;
  youtube?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  tiktok?: string;
  website?: string;
  other?: string;
}

interface SocialLinksCardProps {
  socialLinks?: SocialLinks;
  variant?: 'sidebar' | 'inline';
  className?: string;
}

interface SocialLinkConfig {
  key: keyof SocialLinks;
  label: string;
  icon: React.ReactNode;
  hoverBg: string;
}

const socialLinkConfigs: SocialLinkConfig[] = [
  {
    key: 'facebook',
    label: 'Facebook',
    icon: <Facebook className="w-4 h-4 text-blue-600" />,
    hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-950'
  },
  {
    key: 'youtube',
    label: 'YouTube',
    icon: <Youtube className="w-4 h-4 text-red-600" />,
    hoverBg: 'hover:bg-red-50 dark:hover:bg-red-950'
  },
  {
    key: 'instagram',
    label: 'Instagram',
    icon: <Instagram className="w-4 h-4 text-pink-600" />,
    hoverBg: 'hover:bg-pink-50 dark:hover:bg-pink-950'
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    icon: <Linkedin className="w-4 h-4 text-blue-700" />,
    hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-950'
  },
  {
    key: 'twitter',
    label: 'Twitter (X)',
    icon: <Twitter className="w-4 h-4 text-sky-500" />,
    hoverBg: 'hover:bg-sky-50 dark:hover:bg-sky-950'
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    icon: <MessageCircle className="w-4 h-4" />,
    hoverBg: 'hover:bg-muted'
  },
  {
    key: 'website',
    label: 'Website',
    icon: <Globe className="w-4 h-4 text-purple-600" />,
    hoverBg: 'hover:bg-purple-50 dark:hover:bg-purple-950'
  },
  {
    key: 'other',
    label: 'Other Link',
    icon: <LinkIcon className="w-4 h-4" />,
    hoverBg: ''
  }
];

export const SocialLinksCard = memo(function SocialLinksCard({
  socialLinks,
  variant = 'sidebar',
  className,
}: SocialLinksCardProps) {
  const hasLinks = socialLinks && Object.keys(socialLinks).length > 0;
  const availableLinks = socialLinkConfigs.filter(
    (config) => socialLinks?.[config.key]
  );

  if (variant === 'inline') {
    // Inline variant for About tab
    if (!hasLinks) return null;

    return (
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className={cn("flex flex-wrap gap-2", className)}
      >
        {availableLinks.map((config) => (
          <motion.a
            key={config.key}
            href={socialLinks![config.key]}
            target="_blank"
            rel="noopener noreferrer"
            variants={fadeInUp}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button variant="outline" size="sm" className="gap-2">
              {config.icon}
              {config.label}
            </Button>
          </motion.a>
        ))}
      </motion.div>
    );
  }

  // Sidebar variant (default)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className={cn("p-6 hover:shadow-lg transition-shadow", className)}>
        <motion.h3
          className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Share2 className="w-5 h-5 text-primary" />
          Connect
        </motion.h3>

        {hasLinks ? (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-2"
          >
            {availableLinks.map((config, index) => (
              <motion.a
                key={config.key}
                href={socialLinks![config.key]}
                target="_blank"
                rel="noopener noreferrer"
                variants={fadeInUp}
                custom={index}
                whileHover={{ x: 4 }}
              >
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start transition-colors",
                    config.hoverBg
                  )}
                >
                  <span className="mr-2">{config.icon}</span>
                  {config.label}
                </Button>
              </motion.a>
            ))}
          </motion.div>
        ) : (
          <motion.p
            className="text-sm text-muted-foreground text-center py-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            No social links available
          </motion.p>
        )}
      </Card>
    </motion.div>
  );
});
