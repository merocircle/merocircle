-- CreatorsNepal Database Schema Migration
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  display_name text not null,
  photo_url text,
  role text not null default 'user' check (role in ('user', 'creator')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create creator_profiles table
create table public.creator_profiles (
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
create table public.posts (
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
create table public.supporters (
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

-- Create transactions table for payment tracking
create table public.transactions (
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
create table public.creator_payment_methods (
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

-- Create supporter_transactions table for tracking payments
CREATE TABLE IF NOT EXISTS supporter_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'NPR',
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('esewa', 'khalti', 'bank_transfer')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    supporter_message TEXT,
    
    -- eSewa specific fields
    esewa_product_code VARCHAR(50),
    esewa_signature TEXT,
    esewa_data JSONB,
    
    -- Khalti specific fields  
    khalti_transaction_id VARCHAR(100),
    khalti_data JSONB,
    
    -- Bank transfer specific fields
    bank_reference VARCHAR(100),
    bank_account_details JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    
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
CREATE INDEX IF NOT EXISTS idx_supporter_transactions_payment_method ON supporter_transactions(payment_method);

-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.creator_profiles enable row level security;
alter table public.posts enable row level security;
alter table public.supporters enable row level security;
alter table public.transactions enable row level security;
alter table public.creator_payment_methods enable row level security;

-- Users policies
create policy "Users can view all profiles" on public.users
  for select using (true);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);

-- Creator profiles policies
create policy "Anyone can view creator profiles" on public.creator_profiles
  for select using (true);

create policy "Creators can update own profile" on public.creator_profiles
  for update using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.id = creator_profiles.user_id
    )
  );

create policy "Creators can insert own profile" on public.creator_profiles
  for insert with check (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.id = creator_profiles.user_id
    )
  );

-- Posts policies
create policy "Anyone can view public posts" on public.posts
  for select using (is_public = true);

create policy "Supporters can view creator posts" on public.posts
  for select using (
    exists (
      select 1 from public.supporters
      where supporters.supporter_id = auth.uid() 
      and supporters.creator_id = posts.creator_id
      and supporters.is_active = true
    )
  );

create policy "Creators can manage own posts" on public.posts
  for all using (auth.uid() = creator_id);

-- Supporters policies
create policy "Users can view own support relationships" on public.supporters
  for select using (auth.uid() = supporter_id or auth.uid() = creator_id);

create policy "Users can create support relationships" on public.supporters
  for insert with check (auth.uid() = supporter_id);

create policy "Users can update own support relationships" on public.supporters
  for update using (auth.uid() = supporter_id);

-- Transactions policies
create policy "Users can view own transactions" on public.transactions
  for select using (auth.uid() = supporter_id or auth.uid() = creator_id);

create policy "System can insert transactions" on public.transactions
  for insert with check (true);

-- Creator payment methods policies
create policy "Creators can view own payment methods" on public.creator_payment_methods
  for select using (auth.uid() = creator_id);

create policy "Creators can insert own payment methods" on public.creator_payment_methods
  for insert with check (auth.uid() = creator_id);

create policy "Creators can update own payment methods" on public.creator_payment_methods
  for update using (auth.uid() = creator_id);

create policy "Creators can delete own payment methods" on public.creator_payment_methods
  for delete using (auth.uid() = creator_id);

-- Functions to automatically create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, display_name, photo_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'photo_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create user profile on auth.users insert
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Add updated_at triggers to all tables
create trigger update_users_updated_at before update on public.users
  for each row execute procedure public.update_updated_at_column();

create trigger update_creator_profiles_updated_at before update on public.creator_profiles
  for each row execute procedure public.update_updated_at_column();

create trigger update_posts_updated_at before update on public.posts
  for each row execute procedure public.update_updated_at_column();

create trigger update_supporters_updated_at before update on public.supporters
  for each row execute procedure public.update_updated_at_column();

create trigger update_creator_payment_methods_updated_at before update on public.creator_payment_methods
  for each row execute procedure public.update_updated_at_column();

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant all on public.users to anon, authenticated;
grant all on public.creator_profiles to anon, authenticated;
grant all on public.posts to anon, authenticated;
grant all on public.supporters to anon, authenticated;
grant all on public.transactions to anon, authenticated; 
grant all on public.creator_payment_methods to anon, authenticated;

-- Create RLS policies for supporter_transactions
ALTER TABLE supporter_transactions ENABLE ROW LEVEL SECURITY;

-- Supporters can view their own transactions
CREATE POLICY "Supporters can view own transactions" ON supporter_transactions
    FOR SELECT USING (auth.uid() = supporter_id);

-- Creators can view transactions made to them
CREATE POLICY "Creators can view their received transactions" ON supporter_transactions
    FOR SELECT USING (auth.uid() = creator_id);

-- Allow inserting new transactions (for payment processing)
CREATE POLICY "Allow transaction creation" ON supporter_transactions
    FOR INSERT WITH CHECK (auth.uid() = supporter_id);

-- Allow updating transaction status (for payment verification)
CREATE POLICY "Allow transaction updates" ON supporter_transactions
    FOR UPDATE USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_supporter_transactions_updated_at 
    BEFORE UPDATE ON supporter_transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON supporter_transactions TO authenticated;
GRANT ALL ON supporter_transactions TO service_role;

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

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_creator_transaction_stats(UUID) TO authenticated; 