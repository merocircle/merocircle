import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface CTAButton {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  icon?: LucideIcon;
}

interface CTABannerProps {
  title: string;
  description: string;
  buttons: CTAButton[];
  gradient?: string;
  size?: 'default' | 'large';
  delay?: number;
  children?: ReactNode;
  className?: string;
}

export function CTABanner({
  title,
  description,
  buttons,
  gradient = 'from-blue-600 to-purple-600',
  size = 'default',
  delay = 0.4,
  children,
  className
}: CTABannerProps) {
  const isLarge = size === 'large';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={className}
    >
      <Card className={`bg-gradient-to-r ${gradient} text-white text-center border-0 ${isLarge ? 'p-12' : 'p-8'}`}>
        <h2 className={`font-bold mb-2 ${isLarge ? 'text-3xl' : 'text-2xl'}`}>
          {title}
        </h2>
        <p className={`text-white/90 mb-6 ${isLarge ? 'text-xl' : ''}`}>
          {description}
        </p>
        {buttons.length > 0 && (
          <div className={`flex items-center justify-center ${buttons.length > 1 ? 'space-x-4' : ''}`}>
            {buttons.map((button, index) => {
              const ButtonIcon = button.icon || ArrowRight;
              const buttonContent = (
                <Button
                  key={index}
                  size="lg"
                  variant={button.variant || 'secondary'}
                  onClick={button.onClick}
                  className={button.variant === 'outline' ? 'bg-white/10 border-white text-white hover:bg-white/20' : ''}
                >
                  {button.label}
                  <ButtonIcon className="w-4 h-4 ml-2" />
                </Button>
              );

              return button.href ? (
                <Link key={index} href={button.href}>
                  {buttonContent}
                </Link>
              ) : buttonContent;
            })}
          </div>
        )}
        {children}
      </Card>
    </motion.div>
  );
}
