-- ============================================================
-- STAGD — Convert city enum columns to text
-- Created: 2026-05-05
-- ============================================================

ALTER TABLE public.profiles
  ALTER COLUMN city TYPE text
  USING city::text;

ALTER TABLE public.events
  ALTER COLUMN city TYPE text
  USING city::text;
