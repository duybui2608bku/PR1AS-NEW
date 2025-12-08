-- =============================================================================
-- FIX REALTIME PERMISSIONS FOR MESSAGES TABLE
-- =============================================================================
-- This migration fixes the common issue where Realtime subscriptions work
-- but don't receive events due to missing SELECT permissions for supabase_realtime role.
-- =============================================================================
-- 
-- PROBLEM: Subscription succeeds but no events are received
-- CAUSE: supabase_realtime role needs SELECT permission to read data and apply RLS
-- SOLUTION: Grant SELECT permission to supabase_realtime role
-- =============================================================================

-- Check if supabase_realtime role exists, if not, try alternative approaches
DO $$
BEGIN
  -- Check if supabase_realtime role exists
  IF EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'supabase_realtime'
  ) THEN
    -- Grant SELECT permission on messages table to supabase_realtime role
    GRANT SELECT ON public.messages TO supabase_realtime;
    RAISE NOTICE '✅ Granted SELECT permission on messages table to supabase_realtime role';
    
    -- Also grant SELECT on conversations table
    GRANT SELECT ON public.conversations TO supabase_realtime;
    RAISE NOTICE '✅ Granted SELECT permission on conversations table to supabase_realtime role';
  ELSE
    -- Role doesn't exist, try alternative: grant to authenticated role
    -- This might work if Realtime uses authenticated role
    RAISE WARNING '⚠️ supabase_realtime role does not exist. Trying alternative approach...';
    
    -- Grant to authenticated role (users who are logged in)
    GRANT SELECT ON public.messages TO authenticated;
    RAISE NOTICE '✅ Granted SELECT permission on messages table to authenticated role';
    
    GRANT SELECT ON public.conversations TO authenticated;
    RAISE NOTICE '✅ Granted SELECT permission on conversations table to authenticated role';
    
    -- Also try anon role (for public access, though this might not be needed)
    -- GRANT SELECT ON public.messages TO anon;
    -- GRANT SELECT ON public.conversations TO anon;
  END IF;
END $$;

-- Verify permissions
DO $$
DECLARE
  messages_granted BOOLEAN := false;
  conversations_granted BOOLEAN := false;
BEGIN
  -- Check if any role has SELECT on messages (check common roles)
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.role_table_grants
    WHERE grantee IN ('supabase_realtime', 'authenticated', 'anon')
      AND table_schema = 'public'
      AND table_name = 'messages'
      AND privilege_type = 'SELECT'
  ) INTO messages_granted;

  -- Check if any role has SELECT on conversations
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.role_table_grants
    WHERE grantee IN ('supabase_realtime', 'authenticated', 'anon')
      AND table_schema = 'public'
      AND table_name = 'conversations'
      AND privilege_type = 'SELECT'
  ) INTO conversations_granted;

  IF messages_granted THEN
    RAISE NOTICE '✅ Verified: SELECT permission granted on messages table';
  ELSE
    RAISE WARNING '❌ SELECT permission NOT granted on messages table';
  END IF;

  IF conversations_granted THEN
    RAISE NOTICE '✅ Verified: SELECT permission granted on conversations table';
  ELSE
    RAISE WARNING '❌ SELECT permission NOT granted on conversations table';
  END IF;
END $$;

