-- ============================================================
-- STAGD — Phase 1 Schema Additions
-- Created: 2026-05-10
-- ============================================================

-- ── 1.1  projects table ────────────────────────────────────

CREATE TABLE IF NOT EXISTS projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id   UUID REFERENCES artist_profiles(id) ON DELETE CASCADE NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  discipline  TEXT,
  cover_image_url TEXT NOT NULL,
  sort_order  INTEGER DEFAULT 0 NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- project_items — portfolio pieces that belong to a project
CREATE TABLE IF NOT EXISTS project_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  image_url   TEXT NOT NULL,
  title       TEXT,
  sort_order  INTEGER DEFAULT 0 NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Projects are viewable by everyone" ON projects
  FOR SELECT USING (true);

CREATE POLICY "Artists can insert own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = artist_id);

CREATE POLICY "Artists can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = artist_id);

CREATE POLICY "Artists can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = artist_id);

CREATE POLICY "Project items are viewable by everyone" ON project_items
  FOR SELECT USING (true);

CREATE POLICY "Artists can manage own project items" ON project_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = project_items.project_id
      AND projects.artist_id = auth.uid()
    )
  );

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();


-- ── 1.2  portfolio_items.category ──────────────────────────

ALTER TABLE portfolio_items
  ADD COLUMN IF NOT EXISTS category TEXT;


-- ── 1.3  artist_profiles.detailed_bio ──────────────────────

ALTER TABLE artist_profiles
  ADD COLUMN IF NOT EXISTS detailed_bio TEXT;


-- ── 1.4  artist_profiles.featured_item_id ──────────────────
-- Points to the pinned portfolio item shown in the hero

ALTER TABLE artist_profiles
  ADD COLUMN IF NOT EXISTS featured_item_id UUID REFERENCES portfolio_items(id) ON DELETE SET NULL;


-- ── 1.5  social_links on artist_profiles ───────────────────

-- instagram_handle already exists from initial schema — skipped here
ALTER TABLE artist_profiles
  ADD COLUMN IF NOT EXISTS behance_url    TEXT,
  ADD COLUMN IF NOT EXISTS website_url    TEXT,
  ADD COLUMN IF NOT EXISTS youtube_url    TEXT,
  ADD COLUMN IF NOT EXISTS tiktok_url     TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url   TEXT,
  ADD COLUMN IF NOT EXISTS twitter_url    TEXT;


-- ── 1.6  follows table ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS follows (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  artist_id   UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (follower_id, artist_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows are viewable by everyone" ON follows
  FOR SELECT USING (true);

CREATE POLICY "Users can follow artists" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow artists" ON follows
  FOR DELETE USING (auth.uid() = follower_id);


-- ── 1.7  spots_remaining via function + trigger ────────────

-- Function: returns remaining capacity for a tier
CREATE OR REPLACE FUNCTION get_spots_remaining(tier_id UUID)
RETURNS INTEGER AS $$
  SELECT GREATEST(
    0,
    t.capacity - COALESCE(SUM(tk.quantity), 0)
  )
  FROM ticket_tiers t
  LEFT JOIN tickets tk ON tk.tier_id = t.id
  WHERE t.id = tier_id
  GROUP BY t.capacity;
$$ LANGUAGE sql STABLE;

-- View: ticket_tiers with live spots_remaining
CREATE OR REPLACE VIEW ticket_tiers_with_availability AS
  SELECT
    tt.*,
    GREATEST(
      0,
      tt.capacity - COALESCE(SUM(tk.quantity), 0)
    )::INTEGER AS spots_remaining,
    CASE
      WHEN tt.capacity = 0 THEN false
      WHEN GREATEST(0, tt.capacity - COALESCE(SUM(tk.quantity), 0)) = 0 THEN true
      ELSE false
    END AS is_sold_out
  FROM ticket_tiers tt
  LEFT JOIN tickets tk ON tk.tier_id = tt.id
  GROUP BY tt.id;
