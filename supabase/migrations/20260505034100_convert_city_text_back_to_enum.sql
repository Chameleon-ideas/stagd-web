-- ============================================================
-- STAGD — Convert city columns back to enum (3 fixed cities)
-- Created: 2026-05-05
-- ============================================================

ALTER TABLE public.profiles
  ALTER COLUMN city TYPE city
  USING (
    CASE
      WHEN city IN ('Karachi', 'Lahore', 'Islamabad') THEN city::city
      ELSE NULL
    END
  );

ALTER TABLE public.events
  ALTER COLUMN city TYPE city
  USING (
    CASE
      WHEN city IN ('Karachi', 'Lahore', 'Islamabad') THEN city::city
      ELSE NULL
    END
  );
