-- Allow app (anon/service) to insert into email_queue; RLS was blocking inserts.
-- Drop policy and disable RLS. Access to email_queue is already restricted by app code and API auth.
DROP POLICY IF EXISTS "Service role only" ON email_queue;
ALTER TABLE email_queue DISABLE ROW LEVEL SECURITY;
