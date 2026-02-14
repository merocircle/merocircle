-- Supporter (tier 1) is always free: default price 0, and update existing rows

-- Update trigger to create tier 1 with price 0
CREATE OR REPLACE FUNCTION create_default_tiers_for_creator()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscription_tiers (creator_id, tier_level, tier_name, price, description, benefits)
  VALUES
    (NEW.user_id, 1, 'One Star Supporter', 0.00, 'Access to supporter posts',
     '["Access to exclusive posts", "Support the creator"]'::jsonb),
    (NEW.user_id, 2, 'Two Star Supporter', 500.00, 'Posts + Community chat access',
     '["Access to exclusive posts", "Join community chat", "Direct interaction with creator"]'::jsonb),
    (NEW.user_id, 3, 'Three Star Supporter', 1000.00, 'Posts + Chat + Special perks',
     '["Access to exclusive posts", "Join community chat", "Special perks from creator", "Priority support"]'::jsonb)
  ON CONFLICT (creator_id, tier_level) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set existing tier 1 rows to free (optional; safe to run multiple times)
UPDATE public.subscription_tiers SET price = 0 WHERE tier_level = 1;
