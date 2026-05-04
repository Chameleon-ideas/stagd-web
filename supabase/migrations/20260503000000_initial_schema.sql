-- ============================================================
-- STAGD — Initial Schema Migration
-- Created: 2026-05-03
-- ============================================================

-- ── ENUMS ──────────────────────────────────────────────────

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('creative', 'general', 'both');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE city AS ENUM ('Karachi', 'Lahore', 'Islamabad');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE availability_status AS ENUM ('available', 'busy', 'unavailable');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_type AS ENUM ('concert', 'workshop', 'gallery', 'spoken_word', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_status AS ENUM ('draft', 'live', 'cancelled', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE commission_status AS ENUM ('enquiry', 'in_discussion', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE proposal_status AS ENUM ('pending', 'accepted', 'tweaking', 'superseded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ── TABLES ─────────────────────────────────────────────────

-- 1. Profiles (extending auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT UNIQUE,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'general' NOT NULL,
  city city,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Artist Profiles
CREATE TABLE IF NOT EXISTS artist_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  bio TEXT,
  disciplines TEXT[] DEFAULT '{}' NOT NULL,
  availability availability_status DEFAULT 'available' NOT NULL,
  starting_rate INTEGER,
  rates_on_request BOOLEAN DEFAULT false,
  travel_available BOOLEAN DEFAULT false,
  accent_color TEXT,
  instagram_handle TEXT,
  verified BOOLEAN DEFAULT false NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Portfolio Items
CREATE TABLE IF NOT EXISTS portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES artist_profiles(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  title TEXT,
  is_hidden BOOLEAN DEFAULT false NOT NULL,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organiser_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_type event_type DEFAULT 'other' NOT NULL,
  cover_image_url TEXT,
  venue_name TEXT,
  venue_address TEXT,
  city city,
  maps_pin TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  doors_at TIMESTAMPTZ,
  is_recurring BOOLEAN DEFAULT false NOT NULL,
  status event_status DEFAULT 'draft' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Ticket Tiers
CREATE TABLE IF NOT EXISTS ticket_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  price INTEGER NOT NULL, -- PKR
  capacity INTEGER NOT NULL,
  is_door_only BOOLEAN DEFAULT false NOT NULL,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id TEXT UNIQUE NOT NULL, -- Human readable TKT-YYYY-XXXXX
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  tier_id UUID REFERENCES ticket_tiers(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  quantity INTEGER DEFAULT 1 NOT NULL,
  total_paid INTEGER NOT NULL,
  qr_url TEXT,
  scanned_at TIMESTAMPTZ,
  purchased_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. Commissions
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  artist_id UUID REFERENCES artist_profiles(id) ON DELETE CASCADE NOT NULL,
  status commission_status DEFAULT 'enquiry' NOT NULL,
  brief_what TEXT,
  brief_budget TEXT,
  brief_timeline TEXT,
  brief_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. Proposals
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id UUID REFERENCES commissions(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  total_price INTEGER NOT NULL, -- PKR
  deposit_amount INTEGER,
  delivery_date DATE,
  revisions INTEGER DEFAULT 0,
  deliverables TEXT,
  status proposal_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id UUID REFERENCES commissions(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reviewee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ── RLS POLICIES ───────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can view, only owner can update
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Artist Profiles: Anyone can view, only owner can update
CREATE POLICY "Artist profiles are viewable by everyone" ON artist_profiles
  FOR SELECT USING (true);

CREATE POLICY "Artists can update own profile" ON artist_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Events: Anyone can view live events, organisers can view all their own
CREATE POLICY "Live events are viewable by everyone" ON events
  FOR SELECT USING (status = 'live' OR auth.uid() = organiser_id);

CREATE POLICY "Organisers can insert events" ON events
  FOR INSERT WITH CHECK (auth.uid() = organiser_id);

CREATE POLICY "Organisers can update own events" ON events
  FOR UPDATE USING (auth.uid() = organiser_id);

-- Tickets: Only buyer or organiser can view
CREATE POLICY "Buyers can view own tickets" ON tickets
  FOR SELECT USING (auth.uid() = buyer_id OR buyer_email = auth.jwt()->>'email');

CREATE POLICY "Organisers can view tickets for their events" ON tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events WHERE events.id = tickets.event_id AND events.organiser_id = auth.uid()
    )
  );

-- Commissions: Only client or artist can view
CREATE POLICY "Users can view own commissions" ON commissions
  FOR SELECT USING (auth.uid() = client_id OR auth.uid() = artist_id);

CREATE POLICY "Clients can create commissions" ON commissions
  FOR INSERT WITH CHECK (auth.uid() = client_id);

-- Proposals: Only client or artist can view
CREATE POLICY "Users can view proposals for their commissions" ON proposals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM commissions WHERE commissions.id = proposals.commission_id 
      AND (commissions.client_id = auth.uid() OR commissions.artist_id = auth.uid())
    )
  );

-- Reviews: Anyone can view, only participants of a commission can create
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Clients can review artists after commission" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id AND EXISTS (
      SELECT 1 FROM commissions WHERE commissions.id = reviews.commission_id 
      AND commissions.client_id = auth.uid()
    )
  );

-- ── FUNCTIONS & TRIGGERS ───────────────────────────────────

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, role, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.id::text),
    'general',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated At Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_artist_profiles_updated_at BEFORE UPDATE ON artist_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_commissions_updated_at BEFORE UPDATE ON commissions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
