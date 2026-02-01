-- DISABLE RLS ON ALL TABLES - Handle auth in API routes instead
-- This is the simple approach for NextAuth-only setup

-- Remove foreign key constraint first
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Add UUID auto-generation
ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Disable RLS on all existing tables
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY';
        RAISE NOTICE 'Disabled RLS on table: %', r.tablename;
    END LOOP;
END $$;

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

COMMENT ON SCHEMA public IS 'Using NextAuth - All authorization handled in API routes, not RLS';
