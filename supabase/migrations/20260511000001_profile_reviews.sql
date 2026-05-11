-- Prevent a user from leaving more than one direct profile review per creative
CREATE UNIQUE INDEX IF NOT EXISTS reviews_profile_reviewer_unique
  ON reviews(reviewer_id, reviewee_id)
  WHERE commission_id IS NULL AND event_id IS NULL;

-- Allow any authenticated user to leave a direct profile review
CREATE POLICY "Users can review creative profiles" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id AND
    commission_id IS NULL AND
    event_id IS NULL AND
    auth.uid() <> reviewee_id
  );
