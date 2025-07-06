-- CreatorsNepal Database Cleanup and Migration
-- Run this in your Supabase SQL Editor to start fresh

-- First, drop all existing tables (order matters due to foreign keys)
DROP TABLE IF EXISTS public.creator_payment_methods CASCADE;
DROP TABLE IF EXISTS public.supporter_transactions CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.supporters CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.creator_profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop any existing functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.get_creator_transaction_stats(UUID) CASCADE;

-- Now run the complete migration
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  display_name text not null,
  photo_url text,
  role text not null default 'user' check (role in ('user', 'creator')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create creator_profiles table
CREATE TABLE public.creator_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  bio text,
  category text,
  is_verified boolean default false,
  total_earnings numeric(10,2) default 0,
  supporters_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

-- Create posts table for creator content
CREATE TABLE public.posts (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  content text not null,
  image_url text,
  is_public boolean default true,
  tier_required text default 'free',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create supporters table (relationship between users and creators)
CREATE TABLE public.supporters (
  id uuid default uuid_generate_v4() primary key,
  supporter_id uuid references public.users(id) on delete cascade not null,
  creator_id uuid references public.users(id) on delete cascade not null,
  tier text not null default 'basic',
  amount numeric(10,2) not null default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(supporter_id, creator_id)
);

-- Create legacy transactions table (keeping for backward compatibility)
CREATE TABLE public.transactions (
  id uuid default uuid_generate_v4() primary key,
  supporter_id uuid references public.users(id) on delete cascade not null,
  creator_id uuid references public.users(id) on delete cascade not null,
  amount numeric(10,2) not null,
  currency text default 'NPR',
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  transaction_type text not null default 'support' check (transaction_type in ('support', 'tip', 'subscription')),
  payment_method text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create creator_payment_methods table for payment configuration
CREATE TABLE public.creator_payment_methods (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references public.users(id) on delete cascade not null,
  payment_type text not null check (payment_type in ('esewa', 'khalti', 'bank_transfer')),
  phone_number text,
  qr_code_url text,
  merchant_id text,
  merchant_key text,
  account_name text,
  account_number text,
  bank_name text,
  is_active boolean default true,
  is_verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(creator_id, payment_type)
);

-- Create supporter_transactions table for tracking payments (main table for new payment system)
CREATE TABLE public.supporter_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'NPR',
    gateway VARCHAR(20) NOT NULL CHECK (gateway IN ('esewa', 'khalti', 'bank_transfer')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    message TEXT,
    
    -- Transaction reference
    transaction_uuid VARCHAR(100) UNIQUE,
    product_code VARCHAR(50),
    signature TEXT,
    
    -- eSewa specific fields
    esewa_data JSONB,
    
    -- Khalti specific fields  
    khalti_data JSONB,
    
    -- Bank transfer specific fields
    bank_data JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_supporter_transactions_supporter_id ON supporter_transactions(supporter_id);
CREATE INDEX IF NOT EXISTS idx_supporter_transactions_creator_id ON supporter_transactions(creator_id);
CREATE INDEX IF NOT EXISTS idx_supporter_transactions_status ON supporter_transactions(status);
CREATE INDEX IF NOT EXISTS idx_supporter_transactions_created_at ON supporter_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_supporter_transactions_gateway ON supporter_transactions(gateway);
CREATE INDEX IF NOT EXISTS idx_supporter_transactions_transaction_uuid ON supporter_transactions(transaction_uuid);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supporters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supporter_transactions ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Creator profiles policies
CREATE POLICY "Anyone can view creator profiles" ON public.creator_profiles
  FOR SELECT USING (true);

CREATE POLICY "Creators can update own profile" ON public.creator_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.id = creator_profiles.user_id
    )
  );

CREATE POLICY "Creators can insert own profile" ON public.creator_profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.id = creator_profiles.user_id
    )
  );

-- Posts policies
CREATE POLICY "Anyone can view public posts" ON public.posts
  FOR SELECT USING (is_public = true);

CREATE POLICY "Supporters can view creator posts" ON public.posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.supporters
      WHERE supporters.supporter_id = auth.uid() 
      AND supporters.creator_id = posts.creator_id
      AND supporters.is_active = true
    )
  );

CREATE POLICY "Creators can manage own posts" ON public.posts
  FOR ALL USING (auth.uid() = creator_id);

-- Supporters policies
CREATE POLICY "Users can view own support relationships" ON public.supporters
  FOR SELECT USING (auth.uid() = supporter_id OR auth.uid() = creator_id);

CREATE POLICY "Users can create support relationships" ON public.supporters
  FOR INSERT WITH CHECK (auth.uid() = supporter_id);

CREATE POLICY "Users can update own support relationships" ON public.supporters
  FOR UPDATE USING (auth.uid() = supporter_id);

-- Transactions policies (legacy table)
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = supporter_id OR auth.uid() = creator_id);

CREATE POLICY "System can insert transactions" ON public.transactions
  FOR INSERT WITH CHECK (true);

-- Creator payment methods policies
CREATE POLICY "Creators can view own payment methods" ON public.creator_payment_methods
  FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "Creators can insert own payment methods" ON public.creator_payment_methods
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own payment methods" ON public.creator_payment_methods
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own payment methods" ON public.creator_payment_methods
  FOR DELETE USING (auth.uid() = creator_id);

-- Supporter transactions policies
CREATE POLICY "Supporters can view own transactions" ON public.supporter_transactions
    FOR SELECT USING (auth.uid() = supporter_id);

CREATE POLICY "Creators can view their received transactions" ON public.supporter_transactions
    FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "Allow transaction creation" ON public.supporter_transactions
    FOR INSERT WITH CHECK (auth.uid() = supporter_id);

CREATE POLICY "Allow transaction updates" ON public.supporter_transactions
    FOR UPDATE USING (true);

-- Functions to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, photo_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'photo_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  new.updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_creator_profiles_updated_at BEFORE UPDATE ON public.creator_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_supporters_updated_at BEFORE UPDATE ON public.supporters
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_creator_payment_methods_updated_at BEFORE UPDATE ON public.creator_payment_methods
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_supporter_transactions_updated_at 
    BEFORE UPDATE ON public.supporter_transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get transaction statistics for creators
CREATE OR REPLACE FUNCTION get_creator_transaction_stats(creator_uuid UUID)
RETURNS TABLE (
    total_amount DECIMAL,
    transaction_count BIGINT,
    this_month_amount DECIMAL,
    this_month_count BIGINT,
    avg_transaction_amount DECIMAL
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) as transaction_count,
        COALESCE(SUM(CASE WHEN created_at >= date_trunc('month', CURRENT_DATE) THEN amount ELSE 0 END), 0) as this_month_amount,
        SUM(CASE WHEN created_at >= date_trunc('month', CURRENT_DATE) THEN 1 ELSE 0 END) as this_month_count,
        COALESCE(AVG(amount), 0) as avg_transaction_amount
    FROM supporter_transactions
    WHERE creator_id = creator_uuid AND status = 'completed';
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.creator_profiles TO anon, authenticated;
GRANT ALL ON public.posts TO anon, authenticated;
GRANT ALL ON public.supporters TO anon, authenticated;
GRANT ALL ON public.transactions TO anon, authenticated;
GRANT ALL ON public.creator_payment_methods TO anon, authenticated;
GRANT ALL ON public.supporter_transactions TO authenticated;
GRANT ALL ON public.supporter_transactions TO service_role;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_creator_transaction_stats(UUID) TO authenticated; 