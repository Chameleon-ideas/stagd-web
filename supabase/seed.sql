-- ============================================================
-- STAGD — Seed Data (with valid UUIDs)
-- ============================================================

-- 1. Create Profiles
INSERT INTO profiles (id, full_name, username, role, city, avatar_url)
VALUES 
  ('9fd66df8-f3a7-4cf7-9292-df31a6a8fc82', 'Lyari Underground', 'lyari_underground', 'creative', 'Karachi', 'https://images.unsplash.com/photo-1520110120385-ad291a104bc2?w=400&h=400&fit=crop'),
  ('eea7e977-8d2b-4bca-830f-224184a2f5e4', 'Risograph Karachi', 'risograph_khi', 'creative', 'Karachi', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=400&fit=crop')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  username = EXCLUDED.username,
  role = EXCLUDED.role,
  city = EXCLUDED.city,
  avatar_url = EXCLUDED.avatar_url;

-- 2. Create Artist Profile Details
INSERT INTO artist_profiles (id, bio, disciplines, availability, starting_rate, verified, accent_color, instagram_handle)
VALUES 
  ('9fd66df8-f3a7-4cf7-9292-df31a6a8fc82', 'The sound of the streets. Lyari Underground is a hip-hop collective bringing the raw energy of Karachi''s most vibrant neighborhood to the global stage.', '{Music, Hip-hop, Community}', 'available', 50000, true, '#649839', 'lyari_ug'),
  ('eea7e977-8d2b-4bca-830f-224184a2f5e4', 'Independent print studio specializing in risograph techniques. Experimental, tactile, and community-driven.', '{Printmaking, Graphic Design, Workshop}', 'available', 15000, true, '#1CAEE5', 'risograph_khi')
ON CONFLICT (id) DO UPDATE SET
  bio = EXCLUDED.bio,
  disciplines = EXCLUDED.disciplines,
  availability = EXCLUDED.availability,
  starting_rate = EXCLUDED.starting_rate,
  verified = EXCLUDED.verified,
  accent_color = EXCLUDED.accent_color,
  instagram_handle = EXCLUDED.instagram_handle;

-- 3. Create Portfolio Items
INSERT INTO portfolio_items (artist_id, image_url, title, sort_order)
VALUES 
  ('9fd66df8-f3a7-4cf7-9292-df31a6a8fc82', 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=800&h=1000&fit=crop', 'Live at T2F', 0),
  ('9fd66df8-f3a7-4cf7-9292-df31a6a8fc82', 'https://images.unsplash.com/photo-1514525253361-bee8a187499b?w=800&h=800&fit=crop', 'Studio Session', 1),
  ('eea7e977-8d2b-4bca-830f-224184a2f5e4', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=1000&fit=crop', 'Cyan Overlay', 0),
  ('eea7e977-8d2b-4bca-830f-224184a2f5e4', 'https://images.unsplash.com/photo-1541462608141-ad603a1ee596?w=800&h=800&fit=crop', 'Texture Study', 1);

-- 4. Create Events (using valid random UUIDs)
INSERT INTO events (id, organiser_id, title, description, event_type, cover_image_url, venue_name, city, starts_at, status)
VALUES 
  ('59368d4c-9f8e-4b72-88d4-59e519234850', '9fd66df8-f3a7-4cf7-9292-df31a6a8fc82', 'Sounds of Lyari Festival', 'Curating the first neighborhood hip-hop festival.', 'concert', 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=1200&h=800&fit=crop', 'T2F Garden', 'Karachi', NOW() + INTERVAL '5 days', 'live'),
  ('b732485c-f6a7-4b6c-9d8e-1f2a3b4c5d6e', 'eea7e977-8d2b-4bca-830f-224184a2f5e4', 'Intro to Riso Printing', 'Experimental printmaking workshop.', 'workshop', 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&h=800&fit=crop', 'Stagd Studio', 'Karachi', NOW() + INTERVAL '10 days', 'live')
ON CONFLICT (id) DO NOTHING;

-- 5. Create Ticket Tiers
INSERT INTO ticket_tiers (event_id, name, price, capacity)
VALUES 
  ('59368d4c-9f8e-4b72-88d4-59e519234850', 'General Admission', 1500, 200),
  ('59368d4c-9f8e-4b72-88d4-59e519234850', 'Early Bird', 1000, 50),
  ('b732485c-f6a7-4b6c-9d8e-1f2a3b4c5d6e', 'Standard Workshop', 3500, 15);
