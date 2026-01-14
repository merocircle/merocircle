import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface Stat {
  icon: LucideIcon;
  label: string;
  value: string | number;
}

interface WelcomeBannerProps {
  title: string;
  description: string;
  stats?: Stat[];
  gradient?: string;
  children?: ReactNode;
  className?: string;
}

export function WelcomeBanner({
  title,
  description,
  stats,
  gradient = 'from-purple-500 via-pink-500 to-red-500',
  children,
  className
}: WelcomeBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className={`p-6 bg-gradient-to-r ${gradient} text-white border-0 overflow-hidden relative`}>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-2">
            {title}
          </h1>
          <p className="text-white/90 mb-4">
            {description}
          </p>
          {stats && stats.length > 0 && (
            <div className="flex items-center gap-4 flex-wrap">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div 
                    key={index}
                    className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value} {stat.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          {children}
        </div>
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
        <div className="absolute right-20 bottom-0 w-48 h-48 bg-white/10 rounded-full -mb-24" />
      </Card>
    </motion.div>
  );
}
