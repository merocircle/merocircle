-- Update default tier names to Supporter, Core Member, Inner Circle; tier 1 free
CREATE OR REPLACE FUNCTION create_default_tiers_for_creator()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscription_tiers (creator_id, tier_level, tier_name, price, description, benefits)
  VALUES
    (NEW.user_id, 1, 'Supporter', 0.00, 'Access to supporter posts',
     '["Access to exclusive posts", "Community chat"]'::jsonb),
    (NEW.user_id, 2, 'Inner Circle', 0.00, 'Posts + Community chat access',
     '["Access to exclusive posts", "Community chat"]'::jsonb),
    (NEW.user_id, 3, 'Core Member', 0.00, 'Posts + Chat + Special perks',
     '["Access to exclusive posts", "Community chat", "Special perks"]'::jsonb)
  ON CONFLICT (creator_id, tier_level) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
