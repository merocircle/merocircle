-- Create subscription tiers system for creator support levels

-- Create subscription_tiers table
CREATE TABLE IF NOT EXISTS public.subscription_tiers (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tier_level INTEGER NOT NULL CHECK (tier_level IN (1, 2, 3)),
  tier_name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  description TEXT,
  benefits JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  UNIQUE(creator_id, tier_level)
);

-- Add tier column to supporters table
ALTER TABLE public.supporters
ADD COLUMN IF NOT EXISTS tier_level INTEGER DEFAULT 1 CHECK (tier_level IN (1, 2, 3));

-- Update existing supporters to tier 1
UPDATE public.supporters SET tier_level = 1 WHERE tier_level IS NULL;

-- Create function to auto-create default tiers for new creators
CREATE OR REPLACE FUNCTION create_default_tiers_for_creator()
RETURNS TRIGGER AS $$
BEGIN
  -- Create 3 default tiers
  INSERT INTO public.subscription_tiers (creator_id, tier_level, tier_name, price, description, benefits)
  VALUES
    (NEW.user_id, 1, 'One Star Supporter', 100.00, 'Access to supporter posts',
     '["Access to exclusive posts", "Support the creator"]'::jsonb),
    (NEW.user_id, 2, 'Two Star Supporter', 500.00, 'Posts + Community chat access',
     '["Access to exclusive posts", "Join community chat", "Direct interaction with creator"]'::jsonb),
    (NEW.user_id, 3, 'Three Star Supporter', 1000.00, 'Posts + Chat + Special perks',
     '["Access to exclusive posts", "Join community chat", "Special perks from creator", "Priority support"]'::jsonb)
  ON CONFLICT (creator_id, tier_level) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create tiers when creator profile is created
DROP TRIGGER IF EXISTS create_default_tiers_on_creator_profile ON public.creator_profiles;
CREATE TRIGGER create_default_tiers_on_creator_profile
  AFTER INSERT ON public.creator_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_tiers_for_creator();

-- Add updated_at trigger for subscription_tiers
DROP TRIGGER IF EXISTS update_subscription_tiers_updated_at ON public.subscription_tiers;
CREATE TRIGGER update_subscription_tiers_updated_at
  BEFORE UPDATE ON public.subscription_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_creator ON public.subscription_tiers(creator_id);
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_active ON public.subscription_tiers(is_active);
CREATE INDEX IF NOT EXISTS idx_supporters_tier_level ON public.supporters(tier_level);

-- Add comments
COMMENT ON TABLE public.subscription_tiers IS 'Defines the 3-tier support levels (1★, 2★, 3★) for each creator';
COMMENT ON COLUMN public.subscription_tiers.tier_level IS '1 = One Star (posts only), 2 = Two Star (posts + chat), 3 = Three Star (posts + chat + perks)';
COMMENT ON COLUMN public.subscription_tiers.benefits IS 'Array of benefit descriptions shown to supporters';
COMMENT ON COLUMN public.supporters.tier_level IS 'The tier level (1-3) of this supporter for the creator';
