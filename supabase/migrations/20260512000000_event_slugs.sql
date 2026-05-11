ALTER TABLE events
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Back-fill existing events with a slug derived from their title
UPDATE events
SET slug = regexp_replace(
             lower(trim(title)),
             '[^a-z0-9]+', '-', 'g'
           ) || '-' || substr(replace(id::text, '-', ''), 1, 4)
WHERE slug IS NULL;

-- Now enforce NOT NULL
ALTER TABLE events ALTER COLUMN slug SET NOT NULL;
