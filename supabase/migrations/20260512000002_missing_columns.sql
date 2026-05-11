-- ============================================================
-- STAGD — Missing columns & tables
-- All fields already used in application code but never migrated.
-- Created: 2026-05-12
-- ============================================================


-- ── artist_profiles — commission + payment fields ───────────

ALTER TABLE artist_profiles
  ADD COLUMN IF NOT EXISTS available_from        DATE,
  ADD COLUMN IF NOT EXISTS invoice_auto_send      BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS bank_account_title     TEXT,
  ADD COLUMN IF NOT EXISTS bank_name              TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number    TEXT,
  ADD COLUMN IF NOT EXISTS bank_iban              TEXT,
  ADD COLUMN IF NOT EXISTS is_public              BOOLEAN NOT NULL DEFAULT true;


-- ── commissions — extended brief fields + workflow state ────

-- Enum: add 'delivered' status (artist marks done, awaiting client confirm)
ALTER TYPE commission_status ADD VALUE IF NOT EXISTS 'delivered' AFTER 'in_progress';

ALTER TABLE commissions
  ADD COLUMN IF NOT EXISTS payment_status         TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'partially_paid', 'fully_paid')),
  ADD COLUMN IF NOT EXISTS brief_discipline        TEXT,
  ADD COLUMN IF NOT EXISTS brief_deliverable       TEXT,
  ADD COLUMN IF NOT EXISTS brief_description       TEXT,
  ADD COLUMN IF NOT EXISTS brief_deadline          TEXT,
  ADD COLUMN IF NOT EXISTS brief_duration          TEXT,
  ADD COLUMN IF NOT EXISTS brief_budget_amount     INTEGER,
  ADD COLUMN IF NOT EXISTS hidden_for              UUID[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS completion_requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL;


-- ── proposals — add 'declined' status ───────────────────────
-- Initial schema used 'tweaking' but application code uses 'declined'.
-- Keep both values to avoid breaking existing rows; 'tweaking' is retired.

ALTER TYPE proposal_status ADD VALUE IF NOT EXISTS 'declined' AFTER 'accepted';


-- ── projects — location, format, year ───────────────────────

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS location   TEXT,
  ADD COLUMN IF NOT EXISTS format     TEXT,
  ADD COLUMN IF NOT EXISTS year       INTEGER;


-- ── invoices ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS invoices (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id  UUID NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  issued_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_to_email  TEXT NOT NULL,
  total_amount   INTEGER NOT NULL,
  pdf_url        TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Commission parties can view invoices" ON invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM commissions
      WHERE commissions.id = invoices.commission_id
        AND (commissions.client_id = auth.uid() OR commissions.artist_id = auth.uid())
    )
  );


-- ── payment_status_log ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS payment_status_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id UUID NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,
  status        TEXT NOT NULL CHECK (status IN ('unpaid', 'partially_paid', 'fully_paid')),
  updated_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE payment_status_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Commission parties can view payment log" ON payment_status_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM commissions
      WHERE commissions.id = payment_status_log.commission_id
        AND (commissions.client_id = auth.uid() OR commissions.artist_id = auth.uid())
    )
  );
