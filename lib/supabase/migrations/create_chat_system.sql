-- =============================================================================
-- CHAT SYSTEM MIGRATION
-- =============================================================================
-- This migration creates tables and types for:
-- 1. Conversations (1-1 chat between clients and workers, optionally tied to bookings)
-- 2. Messages (text + image + mixed content)
-- 3. Row Level Security (RLS) policies to ensure privacy
-- 4. Optional: Storage bucket for chat images
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. ENUM TYPES
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'message_content_type'
  ) THEN
    CREATE TYPE message_content_type AS ENUM ('text', 'image', 'mixed');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'message_status'
  ) THEN
    CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');
  END IF;
END
$$;

-- -----------------------------------------------------------------------------
-- 1. CONVERSATIONS TABLE
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Declared as plain UUID first to avoid circular dependency;
  -- FK will be added after messages table is created.
  last_message_id UUID,
  last_message_at TIMESTAMP WITH TIME ZONE
);

-- Ensure one conversation per (client, worker, booking)
ALTER TABLE conversations
  ADD CONSTRAINT conversations_unique_participants_booking
  UNIQUE (client_id, worker_id, booking_id);

-- Indexes for listing conversations
CREATE INDEX IF NOT EXISTS idx_conversations_client_last_message_at
  ON conversations (client_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_worker_last_message_at
  ON conversations (worker_id, last_message_at DESC);

-- Trigger to keep updated_at in sync
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 2. MESSAGES TABLE
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  content TEXT,
  content_type message_content_type NOT NULL DEFAULT 'text',
  attachments JSONB,
  status message_status NOT NULL DEFAULT 'sent',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fetching messages in a conversation
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at
  ON messages (conversation_id, created_at DESC);

-- Trigger to keep updated_at in sync
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Keep conversations.last_message_* in sync when new message is created
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET
    last_message_id = NEW.id,
    last_message_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_after_insert_update_conversation
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Add FK for last_message_id now that messages table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'conversations_last_message_id_fkey'
  ) THEN
    ALTER TABLE conversations
      ADD CONSTRAINT conversations_last_message_id_fkey
      FOREIGN KEY (last_message_id)
      REFERENCES messages(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

-- -----------------------------------------------------------------------------
-- 3. RLS POLICIES
-- -----------------------------------------------------------------------------

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Helper expression: check if current user is a participant in the conversation
-- (Used inline in policies to avoid creating custom functions)

-- Conversations: SELECT
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (
    auth.uid() = client_id
    OR auth.uid() = worker_id
  );

-- Conversations: INSERT
CREATE POLICY "Participants can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (
    auth.uid() = client_id
    OR auth.uid() = worker_id
  );

-- Conversations: UPDATE
CREATE POLICY "Participants can update their conversations"
  ON conversations FOR UPDATE
  USING (
    auth.uid() = client_id
    OR auth.uid() = worker_id
  );

-- Conversations: Admin bypass
CREATE POLICY "Admins can manage all conversations"
  ON conversations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Messages: SELECT
CREATE POLICY "Participants can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.client_id = auth.uid() OR c.worker_id = auth.uid())
    )
  );

-- Messages: INSERT
CREATE POLICY "Only participants can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.client_id = auth.uid() OR c.worker_id = auth.uid())
    )
  );

-- Messages: UPDATE (e.g., status changes)
CREATE POLICY "Senders can update their messages"
  ON messages FOR UPDATE
  USING (
    sender_id = auth.uid()
  );

-- Messages: Admin bypass
CREATE POLICY "Admins can manage all messages"
  ON messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- 4. OPTIONAL: STORAGE BUCKET FOR CHAT IMAGES
-- -----------------------------------------------------------------------------
-- NOTE: This assumes Supabase Storage is available in the same project.
-- If the bucket already exists, the INSERT will be a no-op due to ON CONFLICT.

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', false)
ON CONFLICT (id) DO NOTHING;

-- Basic policy: only authenticated users can upload/read their chat images via signed URLs.
-- Fine-grained access control should be enforced at the application layer
-- by generating signed URLs tied to conversations/messages.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users can access chat images via signed URLs'
  ) THEN
    CREATE POLICY "Authenticated users can access chat images via signed URLs"
      ON storage.objects FOR ALL
      TO authenticated
      USING (bucket_id = 'chat-images')
      WITH CHECK (bucket_id = 'chat-images');
  END IF;
END
$$;

-- -----------------------------------------------------------------------------
-- 5. COMMENTS / DOCUMENTATION
-- -----------------------------------------------------------------------------

COMMENT ON TABLE conversations IS '1-1 chat conversations between clients and workers, optionally tied to bookings';
COMMENT ON COLUMN conversations.booking_id IS 'Optional booking reference for booking-specific chats; NULL for pre-booking chats';
COMMENT ON COLUMN conversations.last_message_id IS 'Reference to the latest message in this conversation';
COMMENT ON COLUMN conversations.last_message_at IS 'Timestamp of the latest message in this conversation';

COMMENT ON TABLE messages IS 'Messages within conversations (text, image, or mixed content)';
COMMENT ON COLUMN messages.attachments IS 'JSONB array of attachments (e.g., chat images with metadata)';

COMMENT ON TYPE message_content_type IS 'Type of message content: text, image, or mixed';
COMMENT ON TYPE message_status IS 'Delivery/read status of a message';
