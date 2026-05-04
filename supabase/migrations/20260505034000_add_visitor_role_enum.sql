-- ============================================================
-- STAGD — Add visitor to user_role enum
-- Created: 2026-05-05
-- ============================================================

DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE 'visitor';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
