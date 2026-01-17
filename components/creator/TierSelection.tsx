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
  tier3_extra_perks?: string | null;
}

interface TierSelectionProps {
  tiers: Tier[];
  creatorName: string;
  currentTierLevel?: number;
  onSelectTier: (tierLevel: number, price: number) => void;
  loading?: boolean;
}

const tierIcons = [
  { level: 1, icon: Star, color: 'from-gray-400 to-gray-600', stars: 1 },
  { level: 2, icon: Star, color: 'from-yellow-400 to-orange-500', stars: 2 },
  { level: 3, icon: Crown, color: 'from-purple-500 to-pink-600', stars: 3 }
];

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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-3">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
          Support {creatorName}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-xs">
          Choose a tier and unlock exclusive benefits
        </p>
      </div>

      {/* Tier Cards - Vertical Layout */}
      <div className="space-y-3">
        {tiers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No tiers available. Please check back later.
          </div>
        ) : (
          tiers.map((tier) => {
            const tierConfig = tierIcons.find(t => t.level === tier.tier_level);
            const isCurrent = currentTierLevel === tier.tier_level;
            const Icon = tierConfig?.icon || Star;
            
            // Different styles for different tiers
            const tierStyles = {
              1: {
                border: 'border-gray-300 dark:border-gray-700',
                gradient: 'from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900',
                iconGradient: 'from-gray-400 to-gray-600',
                hoverBorder: 'hover:border-gray-400 dark:hover:border-gray-600',
                priceGradient: 'from-gray-600 to-gray-800'
              },
              2: {
                border: 'border-yellow-300 dark:border-yellow-700',
                gradient: 'from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20',
                iconGradient: 'from-yellow-400 to-orange-500',
                hoverBorder: 'hover:border-yellow-400 dark:hover:border-yellow-600',
                priceGradient: 'from-yellow-600 to-orange-600'
              },
              3: {
                border: 'border-purple-400 dark:border-purple-600',
                gradient: 'from-purple-50 via-pink-50 to-purple-50 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-purple-900/30',
                iconGradient: 'from-purple-500 to-pink-600',
                hoverBorder: 'hover:border-purple-500 dark:hover:border-purple-500',
                priceGradient: 'from-purple-600 to-pink-600',
                badge: 'absolute -top-3 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg'
              }
            };
            
            const styles = tierStyles[tier.tier_level as keyof typeof tierStyles] || tierStyles[1];

            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: tier.tier_level * 0.15 }}
                whileHover={{ scale: 1.02 }}
                className="relative"
              >
                <Card
                  className={`relative overflow-hidden border-2 ${styles.border} ${styles.hoverBorder} bg-gradient-to-br ${styles.gradient} cursor-pointer transition-all duration-300 ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  } ${isCurrent ? 'ring-4 ring-purple-400 ring-opacity-50' : ''}`}
                  onClick={() => !loading && handleTierSelect(tier)}
                >
                  {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-20 rounded-lg">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Processing...</span>
                      </div>
                    </div>
                  )}

                  {isCurrent && (
                    <Badge className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg z-10">
                      <Check className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  )}

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      {/* Left side - Icon and Stars */}
                      <div className="flex items-center gap-4">
                        <motion.div
                          whileHover={{ rotate: 360, scale: 1.1 }}
                          transition={{ duration: 0.6 }}
                          className={`w-14 h-14 rounded-xl bg-gradient-to-br ${styles.iconGradient} flex items-center justify-center shadow-lg`}
                        >
                          <Icon className="w-7 h-7 text-white" />
                        </motion.div>
                        
                        <div className="flex flex-col">
                          <div className="flex gap-1 mb-1">
                            {Array.from({ length: tierConfig?.stars || 1 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-5 h-5 fill-yellow-400 text-yellow-400 ${
                                  tier.tier_level === 3 ? 'animate-pulse' : ''
                                }`}
                              />
                            ))}
                          </div>
                          <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {tier.tier_name}
                          </h4>
                        </div>
                      </div>

                      {/* Right side - Price */}
                      <div className="text-right">
                        <div className={`text-3xl font-extrabold bg-gradient-to-r ${styles.priceGradient} bg-clip-text text-transparent`}>
                          NPR {tier.price}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          per month
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-5 font-medium">
                      {tier.description}
                    </p>

                    {/* Benefits */}
                    <div className="space-y-2.5 mb-5">
                      {tier.benefits.map((benefit, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index }}
                          className="flex items-center gap-3"
                        >
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {benefit}
                          </span>
                        </motion.div>
                      ))}
                      
                      {/* Tier 3 Extra Perks */}
                      {tier.tier_level === 3 && tier.tier3_extra_perks && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * tier.benefits.length }}
                          className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mt-0.5">
                              <Sparkles className="w-3 h-3 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">
                                Special Perks:
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                {tier.tier3_extra_perks}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* CTA Button */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`w-full py-3 px-4 rounded-lg bg-gradient-to-r ${styles.iconGradient} text-white font-semibold text-center shadow-lg ${
                        loading ? 'opacity-50' : 'hover:shadow-xl'
                      } transition-all duration-300`}>
                        {isCurrent ? 'Upgrade Tier' : `Select ${tier.tier_name}`}
                      </div>
                    </motion.div>
                  </div>

                  {/* Decorative gradient overlay */}
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${styles.iconGradient} opacity-5 rounded-full blur-2xl -translate-y-16 translate-x-16`} />
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
        transition={{ delay: 0.6 }}
        className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-800"
      >
        <Check className="w-4 h-4 text-green-500" />
        <span>Secure payment via eSewa</span>
      </motion.div>
    </div>
  );
}
