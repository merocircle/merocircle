-- Enable Realtime replication for notifications table
-- This allows real-time subscriptions to work for notifications

-- Add table to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Set replica identity for better realtime updates (includes old values in updates/deletes)
ALTER TABLE notifications REPLICA IDENTITY FULL;
