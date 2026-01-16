-- Add social_links and onboarding_completed columns to creator_profiles table

ALTER TABLE public.creator_profiles
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

COMMENT ON COLUMN public.creator_profiles.social_links IS 'JSON object storing social media profile URLs (facebook, youtube, instagram, etc.)';
COMMENT ON COLUMN public.creator_profiles.onboarding_completed IS 'Whether the creator has completed the onboarding call/process';
