-- ============================================================
-- STAGD — Schema alignment: invoices table
-- invoices was created with a different column set than the
-- application code expects. Add the missing columns so both
-- invoice insert paths in /api/db stop failing silently.
-- Created: 2026-05-18
-- ============================================================

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS sent_to_email TEXT,
  ADD COLUMN IF NOT EXISTS pdf_url       TEXT;
