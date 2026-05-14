-- Track whether a user has completed the post-signup intent modal.
-- New rows get false by default; set to true once the role picker is submitted.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS role_selected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS creative_request_sent_at TIMESTAMPTZ;
