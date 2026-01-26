-- Fix channel triggers for Discord-like server structure
-- Applied via Supabase MCP

-- Drop old triggers and functions
DROP TRIGGER IF EXISTS on_creator_profile_created ON creator_profiles;
DROP TRIGGER IF EXISTS on_supporter_created ON supporters;
DROP TRIGGER IF EXISTS on_supporter_created_or_updated ON supporters;
DROP TRIGGER IF EXISTS on_channel_created ON channels;
DROP FUNCTION IF EXISTS create_creator_default_channels() CASCADE;
DROP FUNCTION IF EXISTS add_supporter_to_channels() CASCADE;
DROP FUNCTION IF EXISTS add_existing_supporters_to_new_channel() CASCADE;

-- Create function to auto-create default channels when a creator profile is created
CREATE OR REPLACE FUNCTION public.create_creator_default_channels()
RETURNS TRIGGER AS $$
BEGIN
    -- Create "All Supporters" channel (tier 1+ can access)
    INSERT INTO public.channels (creator_id, name, description, category, channel_type, min_tier_required, position)
    VALUES (NEW.user_id, 'All Supporters', 'Welcome channel for all supporters', 'all-supporters', 'text', 1, 1);

    -- Create "3-Star Supporters" channel (tier 3 only)
    INSERT INTO public.channels (creator_id, name, description, category, channel_type, min_tier_required, position)
    VALUES (NEW.user_id, '3-Star Supporters', 'Exclusive channel for top tier supporters', 'tier-3', 'text', 3, 2);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: When creator profile is created, auto-create default channels
CREATE TRIGGER on_creator_profile_created
    AFTER INSERT ON public.creator_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.create_creator_default_channels();

-- Create function to add supporter to appropriate channels
CREATE OR REPLACE FUNCTION public.add_supporter_to_channels()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.channel_members (channel_id, user_id)
    SELECT c.id, NEW.supporter_id
    FROM public.channels c
    WHERE c.creator_id = NEW.creator_id
      AND c.min_tier_required <= NEW.tier_level
    ON CONFLICT (channel_id, user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: When supporter is created or updated, add them to appropriate channels
CREATE TRIGGER on_supporter_created
    AFTER INSERT OR UPDATE ON public.supporters
    FOR EACH ROW
    EXECUTE FUNCTION public.add_supporter_to_channels();

-- Create function to add existing supporters to a new channel
CREATE OR REPLACE FUNCTION public.add_existing_supporters_to_new_channel()
RETURNS TRIGGER AS $$
BEGIN
    -- Add creator as member of the channel
    INSERT INTO public.channel_members (channel_id, user_id)
    VALUES (NEW.id, NEW.creator_id)
    ON CONFLICT (channel_id, user_id) DO NOTHING;

    -- Add all existing active supporters who meet the tier requirement
    INSERT INTO public.channel_members (channel_id, user_id)
    SELECT NEW.id, s.supporter_id
    FROM public.supporters s
    WHERE s.creator_id = NEW.creator_id
      AND s.is_active = true
      AND s.tier_level >= NEW.min_tier_required
    ON CONFLICT (channel_id, user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: When a new channel is created, add creator and existing eligible supporters
CREATE TRIGGER on_channel_created
    AFTER INSERT ON public.channels
    FOR EACH ROW
    EXECUTE FUNCTION public.add_existing_supporters_to_new_channel();

-- Ensure unique constraint on channel_members
ALTER TABLE channel_members
DROP CONSTRAINT IF EXISTS channel_members_channel_id_user_id_key;

ALTER TABLE channel_members
ADD CONSTRAINT channel_members_channel_id_user_id_key UNIQUE (channel_id, user_id);
