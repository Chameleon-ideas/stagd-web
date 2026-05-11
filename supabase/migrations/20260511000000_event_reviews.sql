-- Add event_id to reviews table to support event-specific reviews.
-- commission_id remains nullable (already was); exactly one of the two should be set per row.

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE CASCADE;

-- Prevent a user from reviewing the same event twice
CREATE UNIQUE INDEX IF NOT EXISTS reviews_event_reviewer_unique
  ON reviews(event_id, reviewer_id)
  WHERE event_id IS NOT NULL;

-- Allow ticket buyers to leave event reviews
CREATE POLICY "Ticket buyers can review events" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id AND
    event_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.event_id = reviews.event_id
        AND tickets.buyer_id = auth.uid()
    )
  );
