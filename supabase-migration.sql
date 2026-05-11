-- ============================================================
-- STAGD — Commissions Flow V1 Migration
-- Run this in your Supabase SQL editor.
-- ============================================================

-- ── 1. artist_profiles additions ────────────────────────────

ALTER TABLE artist_profiles
  ADD COLUMN IF NOT EXISTS available_from        date          NULL,
  ADD COLUMN IF NOT EXISTS invoice_auto_send     boolean       NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS bank_account_title    text          NULL,
  ADD COLUMN IF NOT EXISTS bank_name             text          NULL,
  ADD COLUMN IF NOT EXISTS bank_account_number   text          NULL,
  ADD COLUMN IF NOT EXISTS bank_iban             text          NULL;

-- ── 2. commissions additions ────────────────────────────────

ALTER TABLE commissions
  ADD COLUMN IF NOT EXISTS brief_discipline      text          NULL,
  ADD COLUMN IF NOT EXISTS brief_deliverable     text          NULL,
  ADD COLUMN IF NOT EXISTS brief_description     text          NULL,
  ADD COLUMN IF NOT EXISTS brief_deadline        date          NULL,
  ADD COLUMN IF NOT EXISTS brief_duration        text          NULL,
  ADD COLUMN IF NOT EXISTS brief_budget_amount   integer       NULL,
  ADD COLUMN IF NOT EXISTS brief_reference       text          NULL,
  ADD COLUMN IF NOT EXISTS payment_status        text          NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS completion_requested_by uuid        NULL REFERENCES profiles(id);

-- ── 3. proposals table ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS proposals (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id    uuid        NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,
  title            text        NOT NULL,
  description      text        NULL,
  total_price      integer     NOT NULL,
  deposit_amount   integer     NULL,
  delivery_date    date        NULL,
  revisions        integer     NULL,
  deliverables     text        NULL,
  status           text        NOT NULL DEFAULT 'pending',
  version          integer     NOT NULL DEFAULT 1,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commission parties can view proposals"
  ON proposals FOR SELECT
  USING (
    commission_id IN (
      SELECT id FROM commissions
      WHERE client_id = auth.uid() OR artist_id = auth.uid()
    )
  );

CREATE POLICY "artist can insert proposals"
  ON proposals FOR INSERT
  WITH CHECK (
    commission_id IN (
      SELECT id FROM commissions WHERE artist_id = auth.uid()
    )
  );

CREATE POLICY "artist can update own proposals"
  ON proposals FOR UPDATE
  USING (
    commission_id IN (
      SELECT id FROM commissions WHERE artist_id = auth.uid()
    )
  );

-- ── 4. payment_status_log table ─────────────────────────────

CREATE TABLE IF NOT EXISTS payment_status_log (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id    uuid        NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,
  status           text        NOT NULL,
  updated_by       uuid        NOT NULL REFERENCES profiles(id),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payment_status_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commission parties can view payment log"
  ON payment_status_log FOR SELECT
  USING (
    commission_id IN (
      SELECT id FROM commissions
      WHERE client_id = auth.uid() OR artist_id = auth.uid()
    )
  );

-- ── 5. invoices table ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS invoices (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id    uuid        NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,
  invoice_number   text        UNIQUE NOT NULL,
  issued_at        timestamptz NOT NULL DEFAULT now(),
  sent_to_email    text        NOT NULL,
  total_amount     integer     NOT NULL,
  pdf_url          text        NULL
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commission parties can view invoices"
  ON invoices FOR SELECT
  USING (
    commission_id IN (
      SELECT id FROM commissions
      WHERE client_id = auth.uid() OR artist_id = auth.uid()
    )
  );

-- ── 6. Supabase Storage bucket for brief references ─────────
-- Run via Supabase dashboard Storage panel or:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('brief-references', 'brief-references', true)
-- ON CONFLICT DO NOTHING;
