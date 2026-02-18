'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Star,
  Check,
  Sparkles,
  Crown
} from 'lucide-react';

interface Tier {
  id: string;
  tier_level: number;
  tier_name: string;
  price: number;
  description: string;
  benefits: string[];
  extra_perks?: string[];
}

interface TierSelectionProps {
  tiers: Tier[];
  creatorName: string;
  currentTierLevel?: number;
  onSelectTier: (tierLevel: number, price: number) => void;
  loading?: boolean;
}

const tierIcons = [
  { level: 1, icon: Star, stars: 1 },
  { level: 2, icon: Star, stars: 2 },
  { level: 3, icon: Crown, stars: 3 }
];

// Map tier levels to display names (backend keeps 1, 2, 3 star)
const getTierDisplayName = (tierLevel: number): string => {
  switch (tierLevel) {
    case 1:
      return 'Supporter';
    case 2:
      return 'Inner Circle';
    case 3:
      return 'Core Member';
    default:
      return 'Supporter';
  }
};

export function TierSelection({
  tiers,
  creatorName,
  currentTierLevel = 0,
  onSelectTier,
  loading = false
}: TierSelectionProps) {
  const handleTierSelect = (tier: Tier) => {
    if (loading) return; // Prevent multiple clicks while loading
    
    // Directly go to payment with the tier's base price
    onSelectTier(tier.tier_level, tier.price);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Tier Cards - Horizontal 3-Column Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {tiers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No tiers available. Please check back later.
          </div>
        ) : (
          tiers.map((tier) => {
            console.log(tier.tier_level);
            console.log("current", currentTierLevel);

            const tierConfig = tierIcons.find(t => t.level === tier.tier_level);
            // Only mark as current if user is actually a supporter (currentTierLevel > 0)
            const isCurrent = currentTierLevel > 0 && currentTierLevel === tier.tier_level;
            const Icon = tierConfig?.icon || Star;

            // Mark middle tier as recommended
            const isRecommended = tier.tier_level === 2 && tiers.length >= 2;

            // Tier II and III are coming soon
            const isComingSoon = tier.tier_level >= 2;

            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: tier.tier_level * 0.1 }}
                className="relative h-full flex"
              >
                <Card
                  className={`relative overflow-hidden border border-border bg-background transition-all duration-200 flex flex-col w-full ${
                    isCurrent || isComingSoon ? 'opacity-75 cursor-not-allowed' : loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-foreground/30 hover:shadow-lg'
                  } ${isCurrent ? 'ring-1 ring-foreground/10' : ''} ${isRecommended && !isComingSoon ? 'border-foreground/30' : ''}`}
                  onClick={() => !loading && !isCurrent && !isComingSoon && handleTierSelect(tier)}
                >
                  {/* Blocked Overlay for Current Plan */}
                  {isCurrent && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-30 rounded-lg pointer-events-none" />
                  )}

                  {/* Coming Soon Overlay for Tier II and III */}
                  {isComingSoon && !isCurrent && (
                    <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] z-30 rounded-lg flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <Badge className="gap-1.5 px-4 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-sm font-semibold">
                          <Sparkles className="w-3.5 h-3.5" />
                          Coming Soon
                        </Badge>
                      </div>
                    </div>
                  )}

                  {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm z-20 rounded-lg">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-foreground/20 border-t-foreground"></div>
                        <span className="text-sm font-medium text-muted-foreground">Processing...</span>
                      </div>
                    </div>
                  )}

                  {/* Current Plan Badge */}
                  {isCurrent && (
                    <div className="absolute top-4 right-4 z-40">
                      <Badge className="gap-1.5 px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                        <Check className="w-3 h-3" />
                        Current Plan
                      </Badge>
                    </div>
                  )}

                  {/* Recommended Badge */}
                  {isRecommended && !isCurrent && !isComingSoon && (
                    <div className="absolute top-0 left-0 right-0 bg-foreground text-background text-xs font-semibold py-1.5 px-4 text-center z-10">
                      RECOMMENDED BY CREATOR
                    </div>
                  )}

                  {/* Header Image Area */}
                  <div className={`h-20 sm:h-24 md:h-32 bg-gradient-to-br ${
                    tier.tier_level === 1 ? 'from-muted to-muted/50' :
                    tier.tier_level === 2 ? 'from-foreground/5 to-foreground/10' :
                    'from-foreground/10 to-foreground/5'
                  } flex items-center justify-center relative`}>
                    <div className="absolute inset-0 opacity-5">
                      <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-foreground/20 to-transparent" />
                    </div>
                    <div className="relative z-10">
                      <Icon className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${
                        tier.tier_level === 1 ? 'text-foreground/40' :
                        tier.tier_level === 2 ? 'text-foreground/60' :
                        'text-foreground/70'
                      }`} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`flex-1 flex flex-col p-3 sm:p-4 md:p-6 ${isCurrent ? 'opacity-60' : ''}`}>
                    {/* Title and Price */}
                    <div className="mb-3 sm:mb-4 md:mb-6">
                      <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground mb-1">
                        {getTierDisplayName(tier.tier_level)}
                      </h3>
                      <div className="mt-2 sm:mt-3">
                        <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                          {tier.price === 0 ? 'Free' : `NPR ${tier.price}`}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                          {tier.price === 0 ? 'no payment required' : 'per month'}
                        </div>
                      </div>
                    </div>

                    {/* Benefits */}
                    <div className="flex-1 space-y-2 sm:space-y-2.5 mb-3 sm:mb-4 md:mb-6">
                      {tier.benefits.map((benefit, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2.5"
                        >
                          <div className="flex-shrink-0 w-4 h-4 rounded-full bg-foreground/10 flex items-center justify-center mt-0.5">
                            <Check className="w-2.5 h-2.5 text-foreground" />
                          </div>
                          <span className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            {benefit}
                          </span>
                        </div>
                      ))}
                      
                      {/* Extra Perks */}
                      {tier.extra_perks && tier.extra_perks.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border">
                          {tier.extra_perks.map((perk, perkIndex) => (
                            <div key={`${tier.id}-perk-${perkIndex}`} className="flex items-start gap-2.5 mb-2.5">
                              <div className="flex-shrink-0 w-4 h-4 rounded-full bg-foreground/10 flex items-center justify-center mt-0.5">
                                <Check className="w-2.5 h-2.5 text-foreground" />
                              </div>
                              <span className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                {perk}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* CTA Button */}
                    <div className="mt-auto">
                      {isCurrent ? (
                        <button
                          disabled
                          className="w-full py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 rounded-md font-medium text-center bg-muted/50 text-muted-foreground cursor-not-allowed border border-border/50 text-xs sm:text-sm"
                        >
                          Current Plan
                        </button>
                      ) : isComingSoon ? (
                        <button
                          disabled
                          className="w-full py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 rounded-md font-medium text-center bg-muted/30 text-muted-foreground cursor-not-allowed border border-border/30 text-xs sm:text-sm"
                        >
                          Coming Soon
                        </button>
                      ) : (
                        <button
                          disabled={loading}
                          className="w-full py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 rounded-md font-medium text-center bg-foreground text-background hover:opacity-90 active:opacity-80 transition-all duration-200 disabled:opacity-50 text-xs sm:text-sm"
                        >
                          {tier.price === 0 && tier.tier_level === 1
                            ? 'Join as Supporter'
                            : currentTierLevel !== 0 && tier.tier_level > currentTierLevel
                              ? `Upgrade to ${getTierDisplayName(tier.tier_level)}`
                              : `Select ${getTierDisplayName(tier.tier_level)}`}
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Trust Badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-6 border-t border-border"
      >
        <Check className="w-4 h-4 text-foreground/60" />
        <span>Secure payment</span>
      </motion.div>
    </div>
  );
}
