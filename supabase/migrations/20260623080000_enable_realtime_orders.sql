-- Migration: Enable Realtime for orders table
-- This allows the frontend to subscribe to real-time changes via Supabase Realtime

-- Add orders table to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Set replica identity to full so we get old AND new values in realtime events
ALTER TABLE orders REPLICA IDENTITY FULL;
