-- =============================================================================
-- BOOKING SYSTEM MIGRATION
-- =============================================================================
-- This migration creates tables for:
-- 1. Bookings (service bookings between clients and workers)
-- 2. Notifications (in-app notifications for users)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. BOOKINGS TABLE
-- Stores service bookings between clients and workers
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  worker_service_id UUID REFERENCES worker_services(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  
  -- Booking details
  booking_type TEXT NOT NULL CHECK (booking_type IN ('hourly', 'daily', 'weekly', 'monthly')),
  duration_hours DECIMAL(10, 2) NOT NULL CHECK (duration_hours > 0),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  special_instructions TEXT,
  
  -- Pricing
  hourly_rate_usd DECIMAL(10, 2) NOT NULL CHECK (hourly_rate_usd > 0),
  total_amount_usd DECIMAL(10, 2) NOT NULL CHECK (total_amount_usd > 0),
  discount_percent DECIMAL(5, 2) DEFAULT 0.00,
  final_amount_usd DECIMAL(10, 2) NOT NULL CHECK (final_amount_usd > 0),
  
  -- Status workflow
  status TEXT NOT NULL DEFAULT 'pending_worker_confirmation' CHECK (status IN (
    'pending_worker_confirmation',  -- Client created, waiting for worker
    'worker_confirmed',             -- Worker accepted, payment deducted
    'worker_declined',              -- Worker declined
    'in_progress',                  -- Service is being performed
    'worker_completed',             -- Worker marked as completed
    'client_completed',             -- Client confirmed completion, payment released
    'cancelled',                    -- Cancelled by either party
    'disputed'                      -- Dispute filed
  )),
  
  -- Payment tracking
  escrow_id UUID REFERENCES escrow_holds(id) ON DELETE SET NULL,
  payment_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  
  -- Cancellation
  cancelled_by UUID REFERENCES auth.users(id),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  
  -- Completion tracking
  worker_completed_at TIMESTAMP WITH TIME ZONE,
  client_completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for bookings
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_worker_id ON bookings(worker_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_escrow_id ON bookings(escrow_id);

-- -----------------------------------------------------------------------------
-- 2. NOTIFICATIONS TABLE
-- In-app notifications for users
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification details
  type TEXT NOT NULL CHECK (type IN (
    'booking_request',           -- New booking request for worker
    'booking_confirmed',          -- Booking confirmed by worker
    'booking_declined',          -- Booking declined by worker
    'booking_cancelled',         -- Booking cancelled
    'booking_completed',         -- Booking completed
    'payment_received',         -- Payment received
    'payment_released',         -- Payment released from escrow
    'escrow_released',          -- Escrow released
    'system_announcement'       -- System announcement
  )),
  
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb, -- Additional data (booking_id, etc.)
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Link to related entity
  related_booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  related_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  related_escrow_id UUID REFERENCES escrow_holds(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_related_booking_id ON notifications(related_booking_id);

-- -----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Bookings policies
-- Clients can view their own bookings
CREATE POLICY "Clients can view their own bookings"
  ON bookings FOR SELECT
  USING (
    auth.uid() = client_id
  );

-- Workers can view bookings assigned to them
CREATE POLICY "Workers can view their assigned bookings"
  ON bookings FOR SELECT
  USING (
    auth.uid() = worker_id
  );

-- Clients can create bookings
CREATE POLICY "Clients can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (
    auth.uid() = client_id
  );

-- Workers can update bookings assigned to them (confirm/decline/complete)
CREATE POLICY "Workers can update their bookings"
  ON bookings FOR UPDATE
  USING (
    auth.uid() = worker_id
  );

-- Clients can update their own bookings (cancel, complete)
CREATE POLICY "Clients can update their bookings"
  ON bookings FOR UPDATE
  USING (
    auth.uid() = client_id
  );

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings"
  ON bookings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Notifications policies
-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (
    auth.uid() = user_id
  );

-- System can create notifications (via service role)
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true); -- Service role bypasses RLS

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (
    auth.uid() = user_id
  );

-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications"
  ON notifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- 4. FUNCTIONS & TRIGGERS
-- -----------------------------------------------------------------------------

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for bookings updated_at
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create notification when booking status changes
CREATE OR REPLACE FUNCTION create_booking_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
  notification_type TEXT;
  target_user_id UUID;
BEGIN
  -- Determine notification based on status change
  IF NEW.status = 'pending_worker_confirmation' AND OLD.status IS NULL THEN
    -- New booking created - notify worker
    notification_type := 'booking_request';
    notification_title := 'New Booking Request';
    notification_message := 'You have received a new booking request';
    target_user_id := NEW.worker_id;
  ELSIF NEW.status = 'worker_confirmed' AND OLD.status = 'pending_worker_confirmation' THEN
    -- Worker confirmed - notify client
    notification_type := 'booking_confirmed';
    notification_title := 'Booking Confirmed';
    notification_message := 'Your booking has been confirmed by the worker';
    target_user_id := NEW.client_id;
  ELSIF NEW.status = 'worker_declined' AND OLD.status = 'pending_worker_confirmation' THEN
    -- Worker declined - notify client
    notification_type := 'booking_declined';
    notification_title := 'Booking Declined';
    notification_message := 'The worker has declined your booking request';
    target_user_id := NEW.client_id;
  ELSIF NEW.status = 'in_progress' AND OLD.status = 'worker_confirmed' THEN
    -- Worker started booking - notify client
    notification_type := 'booking_confirmed';
    notification_title := 'Work Started';
    notification_message := 'The worker has started working on your booking';
    target_user_id := NEW.client_id;
  ELSIF NEW.status = 'worker_completed' AND (OLD.status = 'worker_confirmed' OR OLD.status = 'in_progress') THEN
    -- Worker completed - notify client
    notification_type := 'booking_completed';
    notification_title := 'Work Completed';
    notification_message := 'The worker has completed the work. Please confirm completion to release payment.';
    target_user_id := NEW.client_id;
  ELSIF NEW.status = 'client_completed' AND OLD.status = 'worker_completed' THEN
    -- Client confirmed completion - notify worker
    notification_type := 'booking_completed';
    notification_title := 'Booking Completed';
    notification_message := 'The client has confirmed completion. Payment will be released.';
    target_user_id := NEW.worker_id;
  ELSE
    -- No notification needed for this status change
    RETURN NEW;
  END IF;

  -- Create notification
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data,
    related_booking_id
  ) VALUES (
    target_user_id,
    notification_type,
    notification_title,
    notification_message,
    jsonb_build_object('booking_id', NEW.id, 'status', NEW.status),
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for booking notifications
CREATE TRIGGER booking_notification_trigger
  AFTER INSERT OR UPDATE OF status ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION create_booking_notification();

