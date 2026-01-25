'use client';

import { memo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ShoppingBag, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabItem {
  value: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

interface CreatorTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: TabItem[];
  className?: string;
}

const tabContentVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.98
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    transition: {
      duration: 0.2
    }
  }
};

const underlineVariants = {
  inactive: { scaleX: 0 },
  active: {
    scaleX: 1,
    transition: { type: "spring", stiffness: 400, damping: 30 }
  }
};

export const CreatorTabs = memo(function CreatorTabs({
  activeTab,
  onTabChange,
  tabs,
  className,
}: CreatorTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className={cn("w-full", className)}>
      <div className="border-b border-border">
        <TabsList className="h-auto p-0 bg-transparent gap-0">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                "relative rounded-none bg-transparent px-6 py-3 text-base font-medium",
                "text-muted-foreground data-[state=active]:text-foreground",
                "transition-colors hover:text-foreground/80",
                "data-[state=active]:shadow-none"
              )}
            >
              <div className="flex items-center gap-2">
                {tab.icon}
                {tab.label}
              </div>

              {/* Animated underline */}
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                variants={underlineVariants}
                initial="inactive"
                animate={activeTab === tab.value ? "active" : "inactive"}
                style={{ originX: 0.5 }}
              />
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {/* Tab Content with AnimatePresence */}
      <AnimatePresence mode="wait">
        {tabs.map((tab) => (
          activeTab === tab.value && (
            <TabsContent
              key={tab.value}
              value={tab.value}
              forceMount
              className="mt-0"
            >
              <motion.div
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {tab.content}
              </motion.div>
            </TabsContent>
          )
        ))}
      </AnimatePresence>
    </Tabs>
  );
});

// Preset tabs for creator profile
export const defaultCreatorTabs = [
  { value: 'home', label: 'Home' },
  { value: 'posts', label: 'Posts' },
  { value: 'shop', label: 'Shop', icon: <ShoppingBag className="w-4 h-4" /> },
  { value: 'about', label: 'About', icon: <Info className="w-4 h-4" /> },
];
