-- Enable Realtime replication for channel_messages table
-- This allows real-time subscriptions to work for chat messages

-- Add table to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE channel_messages;

-- Set replica identity for better realtime updates (includes old values in updates/deletes)
ALTER TABLE channel_messages REPLICA IDENTITY FULL;
