-- ============================================================
-- STAGD — Messages Migration
-- Created: 2026-05-10
-- ============================================================

DO $$ BEGIN
  CREATE TYPE message_type AS ENUM ('text', 'proposal', 'payment_confirmation', 'status_update');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id UUID REFERENCES commissions(id) ON DELETE CASCADE NOT NULL,
  sender_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  body          TEXT NOT NULL,
  type          message_type DEFAULT 'text' NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM commissions
      WHERE commissions.id = messages.commission_id
      AND (commissions.client_id = auth.uid() OR commissions.artist_id = auth.uid())
    )
  );

CREATE POLICY "Participants can send messages" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM commissions
      WHERE commissions.id = messages.commission_id
      AND (commissions.client_id = auth.uid() OR commissions.artist_id = auth.uid())
    )
  );
