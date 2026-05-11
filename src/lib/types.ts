// ============================================================
// STAGD — Shared TypeScript Types
// Mirrors the backend /api/v1 schema exactly.
// Keep in sync with Node/Express API as it evolves.
// ============================================================

// ── Enums ──────────────────────────────────────────────────

export type UserRole = 'creative' | 'general' | 'both';
export type City = 'Karachi' | 'Lahore' | 'Islamabad';
export type AvailabilityStatus = 'available' | 'busy' | 'unavailable';
export type EventType = 'concert' | 'workshop' | 'gallery' | 'spoken_word' | 'exhibition' | 'talk' | 'other';
export type EventStatus = 'draft' | 'live' | 'cancelled' | 'completed';
export type CommissionStatus = 'enquiry' | 'in_discussion' | 'in_progress' | 'completed' | 'cancelled';
export type ProposalStatus = 'pending' | 'accepted' | 'tweaking' | 'superseded';
export type MessageType = 'text' | 'proposal' | 'payment_confirmation' | 'status_update';
export type PaymentType = 'deposit' | 'balance';

// ── User / Profile ──────────────────────────────────────────

export interface User {
  id: string;
  phone: string;
  email?: string;
  full_name: string;
  username: string;
  role: UserRole;
  city?: City;
  avatar_url?: string;
  created_at: string;
}

export interface ArtistProfile {
  id: string; // FK → users.id
  bio?: string;
  detailed_bio?: string;
  disciplines: string[];
  availability: AvailabilityStatus;
  starting_rate?: number; // PKR
  rates_on_request?: boolean;
  travel_available?: boolean;
  accent_color?: string; // hex — web profile tint
  instagram_handle?: string;
  behance_url?: string;
  website_url?: string;
  youtube_url?: string;
  tiktok_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  verified: boolean;
}

export interface PortfolioItem {
  id: string;
  artist_id?: string;
  project_id?: string;
  image_url: string;
  title?: string;
  description?: string;
  category?: string;
  is_hidden?: boolean;
  sort_order?: number;
  created_at?: string;
}

export interface PastProject {
  id: string;
  artist_id: string;
  title: string;
  description?: string;
  image_url?: string;
  value_range?: string;
  created_at: string;
}

export interface ProjectItem {
  id: string;
  project_id?: string;
  image_url: string;
  title?: string;
  description?: string;
  sort_order?: number;
}

export interface Project {
  id: string;
  artist_id: string;
  title: string;
  description?: string;
  cover_image_url: string;
  discipline?: string;
  location?: string;
  format?: string;
  year?: number;
  items: ProjectItem[];
  created_at: string;
}

export interface Review {
  id: string;
  commission_id: string;
  reviewer_id: string;
  reviewer: Pick<User, 'id' | 'full_name' | 'username' | 'avatar_url'>;
  reviewee_id: string;
  rating: number; // 1–5
  body?: string;
  created_at: string;
}

export interface EventReview {
  id: string;
  event_id: string;
  reviewer_id: string;
  reviewer: Pick<User, 'id' | 'full_name' | 'username' | 'avatar_url'>;
  rating: number; // 1–5
  body?: string;
  created_at: string;
}

// Combined public artist page data
export interface ArtistPublicProfile {
  user: User;
  profile: ArtistProfile;
  portfolio: PortfolioItem[];
  projects: Project[];
  past_projects: PastProject[];
  reviews: Review[];
  review_average: number;
  review_count: number;
  follower_count: number;
  project_count: number;
  social_links?: SocialLinks;
  detailed_bio?: string;
}

export interface SocialLinks {
  instagram?: string;
  behance?: string;
  linkedin?: string;
  twitter?: string;
  website?: string;
  youtube?: string;
  tiktok?: string;
}

// ── Events ──────────────────────────────────────────────────

export interface Event {
  id: string;
  organiser_id: string;
  organiser: Pick<User, 'id' | 'full_name' | 'username' | 'avatar_url'>;
  organiser_disciplines?: string[];
  title: string;
  description?: string;
  event_type: EventType;
  cover_image_url?: string;
  venue_name?: string;
  venue_address?: string;
  city?: City;
  maps_pin?: string;
  starts_at: string;
  doors_at?: string;
  is_recurring?: boolean;
  status: EventStatus;
  created_at: string;
  ticket_tiers: TicketTier[];
  min_price: number; // PKR — derived
  is_free: boolean;
  is_sold_out: boolean;
}

export interface TicketTier {
  id: string;
  event_id: string;
  name: string;
  price: number; // PKR
  capacity: number;
  spots_remaining: number; // derived
  is_door_only: boolean;
  sort_order: number;
}

// ── Tickets ──────────────────────────────────────────────────

export interface Ticket {
  id: string;
  ticket_id: string; // TKT-YYYY-XXXXX
  event_id: string;
  event: Pick<Event, 'id' | 'title' | 'venue_name' | 'city' | 'starts_at' | 'doors_at' | 'cover_image_url'>;
  tier_id: string;
  tier: Pick<TicketTier, 'id' | 'name' | 'price'>;
  buyer_id?: string;
  buyer_name: string;
  buyer_email: string;
  quantity: number;
  total_paid: number;
  qr_url?: string;
  scanned_at?: string;
  purchased_at: string;
}

// ── Ticket Verification ──────────────────────────────────────

export type VerifyStatus = 'valid' | 'already_used' | 'not_recognised' | 'wrong_event';

export interface VerifyResult {
  status: VerifyStatus;
  ticket_id?: string;
  buyer_name?: string;
  tier_name?: string;
  quantity?: number;
  event_title?: string;
  scanned_at?: string; // ISO — only on already_used
}

// ── Commissions ──────────────────────────────────────────────

export interface Commission {
  id: string;
  client_id: string;
  client: Pick<User, 'id' | 'full_name' | 'username' | 'avatar_url'>;
  artist_id: string;
  artist: Pick<User, 'id' | 'full_name' | 'username' | 'avatar_url'>;
  status: CommissionStatus;
  brief_what?: string;
  brief_budget?: string;
  brief_timeline?: string;
  brief_reference?: string;
  created_at: string;
}

export interface Proposal {
  id: string;
  commission_id: string;
  title: string;
  description?: string;
  total_price: number; // PKR
  deposit_amount?: number; // PKR
  delivery_date?: string;
  revisions?: number;
  deliverables?: string;
  status: ProposalStatus;
  created_at: string;
}

// ── Search ──────────────────────────────────────────────────

export interface ArtistSearchResult {
  user: Pick<User, 'id' | 'full_name' | 'username' | 'avatar_url' | 'city'>;
  profile: Pick<ArtistProfile, 'disciplines' | 'availability' | 'starting_rate' | 'rates_on_request' | 'verified'>;
  hero_image?: string; // first portfolio item
  review_average: number;
  review_count: number;
}

export interface EventSearchResult {
  event: Pick<Event, 'id' | 'title' | 'event_type' | 'cover_image_url' | 'venue_name' | 'city' | 'starts_at' | 'min_price' | 'is_free' | 'is_sold_out'>;
  organiser: Pick<User, 'id' | 'full_name' | 'username' | 'avatar_url'>;
}

// ── API Response wrappers ────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}
