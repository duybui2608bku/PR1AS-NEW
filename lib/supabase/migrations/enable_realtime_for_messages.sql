-- =============================================================================
-- ENABLE REALTIME FOR MESSAGES TABLE
-- =============================================================================
-- This migration enables Supabase Realtime for the messages table
-- so that clients can subscribe to new messages in real-time.
-- =============================================================================

-- IMPORTANT: Before running this migration, ensure Realtime is enabled in
-- Supabase Dashboard: Database > Replication > Enable for 'messages' table
--
-- This migration adds the messages table to the supabase_realtime publication,
-- which is required for postgres_changes subscriptions to work.

-- Check if publication exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    RAISE EXCEPTION 'Realtime publication not found. Please enable Realtime in Supabase Dashboard: Database > Replication';
  END IF;
END $$;

-- Add messages table to supabase_realtime publication
-- This is required for postgres_changes subscriptions to receive INSERT events
DO $$
BEGIN
  -- Check if messages table is already in the publication
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'messages'
    AND schemaname = 'public'
  ) THEN
    -- Add messages table to publication
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    RAISE NOTICE 'Added messages table to supabase_realtime publication';
  ELSE
    RAISE NOTICE 'Messages table is already in supabase_realtime publication';
  END IF;
END $$;

-- Verify the table is in the publication
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM pg_publication_tables
  WHERE pubname = 'supabase_realtime'
    AND tablename = 'messages'
    AND schemaname = 'public';
  
  IF table_count = 0 THEN
    RAISE WARNING 'Messages table is not in supabase_realtime publication. Realtime may not work.';
  ELSE
    RAISE NOTICE 'Verified: messages table is in supabase_realtime publication';
  END IF;
END $$;

-- IMPORTANT: Grant SELECT permission for Realtime to work with RLS policies
-- The Realtime service needs SELECT permission to read data and apply RLS policies
-- when sending events to clients
DO $$
BEGIN
  -- Check if supabase_realtime role exists
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_realtime') THEN
    -- Grant to supabase_realtime role (preferred)
    GRANT SELECT ON public.messages TO supabase_realtime;
    GRANT SELECT ON public.conversations TO supabase_realtime;
    RAISE NOTICE 'Granted SELECT permission to supabase_realtime role';
  ELSE
    -- Fallback: Grant to authenticated role
    -- This works because Realtime uses the authenticated user's context
    GRANT SELECT ON public.messages TO authenticated;
    GRANT SELECT ON public.conversations TO authenticated;
    RAISE NOTICE 'Granted SELECT permission to authenticated role (supabase_realtime role not found)';
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON TABLE messages IS 'Messages within conversations (text, image, or mixed content). Realtime enabled for INSERT events.';

