'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  Check,
  Crown,
  Star
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
  { level: 1, icon: Heart, stars: 1 },
  { level: 2, icon: Star, stars: 2 },
  { level: 3, icon: Crown, stars: 3 }
];

// Fallback when tier has no custom name (backend keeps 1, 2, 3)
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

const displayName = (tier: Tier): string =>
  (tier.tier_name?.trim() && tier.tier_name) || getTierDisplayName(tier.tier_level);

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
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Tier Cards - Horizontal 3-Column Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-6">
        {tiers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No tiers available. Please check back later.
          </div>
        ) : (
          tiers.map((tier) => {
            const tierConfig = tierIcons.find(t => t.level === tier.tier_level);
            // Only mark as current if user is actually a supporter (currentTierLevel > 0)
            const isCurrent = currentTierLevel > 0 && currentTierLevel === tier.tier_level;
            const Icon = tierConfig?.icon || Star;

            // Mark middle tier as recommended
            const isRecommended = tier.tier_level === 2 && tiers.length >= 2;

            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: tier.tier_level * 0.1 }}
                className={`relative h-full flex transition-all duration-300 rounded-lg ${!isCurrent && !loading && 'hover:scale-[1.02]'} ${
                  tier.tier_level === 1 ? 'rounded-lg p-[0.5px] bg-linear-to-br from-primary/20 via-primary/15 to-primary/18 shadow-[0_0_6px_rgba(196,56,42,0.08),0_0_12px_rgba(196,56,42,0.04),0_0_24px_rgba(196,56,42,0.02)]' :
                  tier.tier_level === 2 ? 'rounded-lg p-px bg-linear-to-br from-orange-400/80 via-red-400/70 to-red-500/80 shadow-[0_0_12px_rgba(234,88,12,0.25),0_0_24px_rgba(234,88,12,0.15),0_0_48px_rgba(234,88,12,0.08)]' :
                  tier.tier_level === 3 ? 'rounded-lg p-[2px] bg-linear-to-br from-orange-400 via-red-400 to-red-500 shadow-[0_0_20px_rgba(234,88,12,0.3),0_0_48px_rgba(234,88,12,0.18),0_0_96px_rgba(234,88,12,0.12),0_0_160px_rgba(234,88,12,0.06)]' :
                  ''
                }`}
              >
                <Card
                  className={`relative overflow-hidden transition-all duration-300 flex flex-col w-full ${
                    isCurrent ? 'opacity-75 cursor-not-allowed' : loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                  } ${isCurrent ? 'ring-1 ring-foreground/10' : ''} bg-card rounded-[10px]`}
                  onClick={() => !loading && !isCurrent && handleTierSelect(tier)}
                >
                  {/* Blocked Overlay for Current Plan */}
                  {isCurrent && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-30 rounded-lg pointer-events-none" />
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
                  {isRecommended && !isCurrent && (
                    <div className={`absolute top-0 left-0 right-0 text-xs font-semibold py-1.5 px-4 text-center z-10 ${
                      tier.tier_level === 2 ? 'bg-gradient-to-r from-orange-400/90 to-red-400/90 text-white' : 'bg-foreground text-background'
                    }`}>
                      RECOMMENDED BY CREATOR
                    </div>
                  )}

                  {/* Header Image Area */}
                  <div className={`h-16 sm:h-20 md:h-28 relative overflow-hidden ${
                    tier.tier_level === 1 ? 'bg-linear-to-br from-orange-400/5 via-red-400/5 to-red-500/5' :
                    tier.tier_level === 2 ? 'bg-linear-to-br from-orange-400/20 via-red-400/10 to-red-500/20' :
                    'bg-linear-to-br from-orange-400/25 via-red-400/15 to-red-500/25'
                  }`}>
                    {/* Background pattern for premium tiers */}
                    {tier.tier_level >= 2 && (
                      <div className="absolute inset-0 opacity-20">
                        <div className="w-full h-full bg-[radial-gradient(circle_at_30%_40%,var(--tw-gradient-stops))] from-primary/30 to-transparent" />
                        <div className="w-full h-full bg-[radial-gradient(circle_at_70%_60%,var(--tw-gradient-stops))] from-primary/20 to-transparent" />
                      </div>
                    )}
                    
                    {/* Icon container */}
                    <div className="relative z-10 flex items-center justify-center h-full">
                      <div className={`p-3 sm:p-4 md:p-5 rounded-full backdrop-blur-sm ${
                        tier.tier_level === 1 ? 'bg-primary/5' :
                        tier.tier_level === 2 ? 'bg-primary/10 shadow-md' :
                        'bg-primary/15 shadow-lg'
                      }`}>
                        <Icon className={`w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 ${
                          tier.tier_level === 1 ? 'text-primary' :
                          tier.tier_level === 2 ? 'text-primary' :
                          'text-primary drop-shadow-sm'
                        }`} />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`flex-1 flex flex-col p-3 sm:p-3 md:p-5 ${isCurrent ? 'opacity-60' : ''}`}>
                    {/* Title and Price */}
                    <div className="mb-2 sm:mb-3 md:mb-4">
                      <h3 className="text-sm sm:text-base md:text-lg font-bold text-foreground mb-1">
                        {displayName(tier)}
                      </h3>
                      <div className="mt-1 sm:mt-2">
                        <div className="text-lg sm:text-xl md:text-3xl font-bold text-foreground">
                          {tier.price === 0 ? 'Free' : `NPR ${tier.price}`}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {tier.price === 0 ? 'no payment required' : 'per month'}
                        </div>
                      </div>
                    </div>

                    {/* Benefits */}
                    <div className="flex-1 space-y-2 sm:space-y-2 mb-2 sm:mb-3 md:mb-4">
                      {tier.benefits.map((benefit, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2"
                        >
                          <div className="shrink-0 w-3.5 h-3.5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                            <Check className="w-2 h-2 text-primary" />
                          </div>
                          <span className="text-xs text-muted-foreground leading-tight">
                            {benefit}
                          </span>
                        </div>
                      ))}
                      
                      {/* Extra Perks */}
                      {tier.extra_perks && tier.extra_perks.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border">
                          {tier.extra_perks.map((perk, perkIndex) => (
                            <div key={`${tier.id}-perk-${perkIndex}`} className="flex items-start gap-2 mb-2">
                              <div className="flex-shrink-0 w-3.5 h-3.5 rounded-full bg-foreground/10 flex items-center justify-center mt-0.5">
                                <Check className="w-2 h-2 text-foreground" />
                              </div>
                              <span className="text-xs text-muted-foreground leading-tight">
                                {perk}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* CTA Button */}
                    <div className="mt-2">
                      {isCurrent ? (
                        <button
                          disabled
                          className="w-full py-1.5 sm:py-2 md:py-2.5 px-2 sm:px-3 rounded-md font-medium text-center bg-muted/50 text-muted-foreground cursor-not-allowed border border-border/50 text-xs"
                        >
                          Current Plan
                        </button>
                      ) : (
                        <button
                          disabled={loading}
                          className={`w-full py-1.5 sm:py-2 md:py-2.5 px-2 sm:px-3 rounded-md font-medium text-center transition-all duration-200 disabled:opacity-50 text-xs ${
                            tier.tier_level === 3
                              ? 'bg-linear-to-br from-orange-400 via-red-400 to-red-500 shadow-[0_0_20px_rgba(234,88,12,0.3),0_0_48px_rgba(234,88,12,0.18),0_0_96px_rgba(234,88,12,0.12),0_0_160px_rgba(234,88,12,0.06)]' 
                              : tier.tier_level === 2 ? 'bg-linear-to-br from-orange-400 via-primary to-red-400 shadow-[0_0_12px_rgba(234,88,12,0.25),0_0_24px_rgba(234,88,12,0.15),0_0_48px_rgba(234,88,12,0.08)]' : 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80'
                          }`}
                        >
                          {tier.price === 0 && tier.tier_level === 1
                            ? `Join as ${displayName(tier)}`
                            : currentTierLevel !== 0 && tier.tier_level > currentTierLevel
                              ? `Upgrade to ${displayName(tier)}`
                              : `Select ${displayName(tier)}`}
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
