-- Add extra_perks column to subscription_tiers table
-- This allows creators to add custom perks for each tier

ALTER TABLE public.subscription_tiers
ADD COLUMN IF NOT EXISTS extra_perks JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.subscription_tiers.extra_perks IS 'Array of custom extra perks that creators can add for each tier';
