-- =============================================================================
-- UPDATE BOOKING NOTIFICATION FUNCTION
-- =============================================================================
-- This script updates the create_booking_notification() function to include
-- notification when booking status changes to 'in_progress'
-- =============================================================================

-- Update function to create notification when booking status changes
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
