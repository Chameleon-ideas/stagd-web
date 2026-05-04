// ============================================================
// STAGD — API Client
// Typed fetch wrappers for all /api/v1 endpoints.
// Web hits the same backend as the mobile app.
// ============================================================

import type {
  ArtistPublicProfile,
  ArtistSearchResult,
  Event,
  EventSearchResult,
  PaginatedResponse,
  VerifyResult,
} from './types';
import { supabase } from './supabase';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

// Switch to TRUE to work on UI/UX with local mock data
// Switch to FALSE to use live Supabase data
const MOCK_ENABLED = true; 

// ── Fetch helper (Legacy/Mock) ──────────────────────────────

async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `API error ${res.status}: ${path}`);
  }

  return res.json() as Promise<T>;
}

// ════════════════════════════════════════════════════════════
// USERS & PROFILES
// ════════════════════════════════════════════════════════════

export async function getArtistProfile(
  username: string,
): Promise<ArtistPublicProfile> {
  if (MOCK_ENABLED) {
    const mock = MOCK_ARTISTS[username.toLowerCase()];
    if (mock) return mock;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      profile:artist_profiles(*),
      portfolio:portfolio_items(*),
      past_projects(*),
      reviews(*)
    `)
    .eq('username', username)
    .single();

  if (error) {
    return apiFetch<ArtistPublicProfile>(`/users/${username}`);
  }
  
  return {
    user: data as any,
    profile: data.profile as any,
    portfolio: data.portfolio as any,
    projects: data.projects as any || [],
    past_projects: data.past_projects as any,
    reviews: data.reviews as any,
    review_average: 5.0,
    review_count: 0,
    follower_count: 0,
    project_count: data.past_projects?.length || 0,
  };
}

// ════════════════════════════════════════════════════════════
// EVENTS
// ════════════════════════════════════════════════════════════

export async function searchEvents(params?: {
  city?: string;
  type?: string;
  date?: string;
  price_max?: number;
  is_free?: boolean;
  page?: number;
  per_page?: number;
  sort?: string;
}): Promise<PaginatedResponse<EventSearchResult>> {
  if (MOCK_ENABLED) {
    let events = Object.values(MOCK_EVENTS);
    
    if (params?.city && params.city !== 'All') {
      events = events.filter(e => e.city?.toLowerCase() === params.city?.toLowerCase());
    }
    
    if (params?.type && params.type !== 'All') {
      events = events.filter(e => e.event_type.toLowerCase() === params.type?.toLowerCase());
    }

    if (params?.is_free) {
      events = events.filter(e => e.is_free);
    }

    if (params?.sort === 'Soonest') {
      events = events.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
    }

    return {
      data: events.map(e => ({
        event: e,
        organiser: e.organiser,
      })),
      total: events.length,
      page: 1,
      per_page: 20,
      has_more: false,
    };
  }

  return apiFetch<PaginatedResponse<EventSearchResult>>(`/search/events`);
}

export async function getEvent(id: string): Promise<Event> {
  if (MOCK_ENABLED) {
    const mock = MOCK_EVENTS[id];
    if (mock) return mock;
  }
  return apiFetch<Event>(`/events/${id}`);
}

export async function getArtistEvents(organiserId: string): Promise<PaginatedResponse<EventSearchResult>> {
  if (MOCK_ENABLED) {
    const events = Object.values(MOCK_EVENTS).filter(e => e.organiser_id === organiserId);
    return { data: events.map(e => ({ event: e, organiser: e.organiser })), total: events.length, page: 1, per_page: 20, has_more: false };
  }
  return apiFetch<PaginatedResponse<EventSearchResult>>(`/events?organiser=${organiserId}&status=live`);
}

// ════════════════════════════════════════════════════════════
// TICKETS & PURCHASES
// ════════════════════════════════════════════════════════════

export async function purchaseTicket(
  eventId: string,
  payload: {
    tier_id: string;
    quantity: number;
    buyer_name: string;
    buyer_email: string;
    payment_token?: string;
  },
): Promise<{ ticket_id: string; qr_url: string; total_paid: number }> {
  if (MOCK_ENABLED) {
    const ticket_id = `TKT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const qr_url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${ticket_id}`;
    return { ticket_id, qr_url, total_paid: 1500 * payload.quantity };
  }
  return apiFetch(`/events/${eventId}/tickets/purchase`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function verifyTicket(ticketId: string): Promise<VerifyResult> {
  if (MOCK_ENABLED) {
    if (ticketId === 'TKT-VALID') {
      return {
        status: 'valid',
        ticket_id: 'TKT-2026-X8392',
        buyer_name: 'Zia Ahmed',
        tier_name: 'General Admission',
        quantity: 1,
        event_title: 'Sounds of Lyari Festival',
      };
    }
    return { status: 'not_recognised' };
  }
  return apiFetch<VerifyResult>(`/verify/${ticketId}`, { cache: 'no-store' });
}

// ════════════════════════════════════════════════════════════
// SEARCH ARTISTS
// ════════════════════════════════════════════════════════════

export async function searchArtists(params?: {
  discipline?: string;
  city?: string;
  sort?: string;
}): Promise<PaginatedResponse<ArtistSearchResult>> {
  if (MOCK_ENABLED) {
    let artists = Object.values(MOCK_ARTISTS);
    
    if (params?.city && params.city !== 'All') {
      artists = artists.filter(a => a.user.city?.toLowerCase() === params.city?.toLowerCase());
    }
    
    if (params?.discipline && params.discipline !== 'All') {
      artists = artists.filter(a => a.profile.disciplines.some(d => d.toLowerCase() === params.discipline?.toLowerCase()));
    }

    return {
      data: artists.map(a => ({
        user: a.user,
        profile: a.profile,
        review_average: a.review_average,
        review_count: a.review_count,
        project_count: a.project_count,
      })),
      total: artists.length,
      page: 1,
      per_page: 20,
      has_more: false,
    };
  }
  return apiFetch<PaginatedResponse<ArtistSearchResult>>(`/search/artists`);
}

// ════════════════════════════════════════════════════════════
// MOCK DATA
// ════════════════════════════════════════════════════════════

const MOCK_EVENTS: Record<string, Event> = {
  event_1: {
    id: 'event_1',
    organiser_id: 'lyari_underground',
    organiser: { id: 'lyari_underground', full_name: 'Lyari Underground', username: 'lyari_underground', avatar_url: '/images/lyari.png' },
    title: 'Sounds of Lyari Festival',
    event_type: 'concert',
    cover_image_url: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?q=80&w=1200&fit=crop',
    venue_name: 'T2F Garden',
    city: 'Karachi',
    starts_at: '2026-05-12T20:00:00Z',
    status: 'live',
    created_at: '',
    ticket_tiers: [],
    min_price: 1500,
    is_free: false,
    is_sold_out: false,
  },
  event_2: {
    id: 'event_2',
    organiser_id: 'risograph_khi',
    organiser: { id: 'risograph_khi', full_name: 'Risograph Karachi', username: 'risograph_khi', avatar_url: '/images/riso.png' },
    title: 'Intro to Riso Printing',
    event_type: 'workshop',
    cover_image_url: 'https://images.unsplash.com/photo-1598301257982-0cf014dabbcd?q=80&w=1200&fit=crop',
    venue_name: 'Stagd Studio',
    city: 'Karachi',
    starts_at: '2026-05-14T14:00:00Z',
    status: 'live',
    created_at: '',
    ticket_tiers: [],
    min_price: 3500,
    is_free: false,
    is_sold_out: false,
  },
  event_3: {
    id: 'event_3',
    organiser_id: 'sanki_king',
    organiser: { id: 'sanki_king', full_name: 'Sanki King', username: 'sanki_king', avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddda0d7c75?q=80&w=150&fit=crop' },
    title: 'Street Art Jam Vol. 04',
    event_type: 'workshop',
    cover_image_url: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=1200&fit=crop',
    venue_name: 'Old City Walls',
    city: 'Karachi',
    starts_at: '2026-05-20T17:00:00Z',
    status: 'live',
    created_at: '',
    ticket_tiers: [],
    min_price: 0,
    is_free: true,
    is_sold_out: false,
  }
};

const MOCK_ARTISTS: Record<string, ArtistPublicProfile> = {
  lyari_underground: {
    user: { id: 'artist_1', full_name: 'Lyari Underground', username: 'lyari_underground', city: 'Karachi', avatar_url: '/images/lyari.png', role: 'creative', created_at: '', phone: '' },
    profile: { id: 'artist_1', bio: 'The sound of the streets.', disciplines: ['Music', 'Street Art'], availability: 'available', starting_rate: 50000, verified: true },
    portfolio: [], projects: [], past_projects: [], reviews: [], review_average: 4.9, review_count: 24, follower_count: 1200, project_count: 45,
  },
  risograph_khi: {
    user: { id: 'artist_2', full_name: 'Risograph Karachi', username: 'risograph_khi', city: 'Karachi', avatar_url: '/images/riso_new.png', role: 'creative', created_at: '', phone: '' },
    profile: { id: 'artist_2', bio: 'Independent print studio specializing in risograph techniques.', disciplines: ['Printmaking', 'Visual Arts'], availability: 'available', starting_rate: 15000, verified: true },
    portfolio: [
       { id: 'r1', artist_id: 'artist_2', title: 'Riso Study 01', category: 'Print', image_url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200&fit=crop', sort_order: 0, is_hidden: false, created_at: '' },
       { id: 'r2', artist_id: 'artist_2', title: 'Texture 02', category: 'Print', image_url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1200&fit=crop', sort_order: 1, is_hidden: false, created_at: '' },
    ], 
    projects: [
      {
        id: 'proj_riso_01', artist_id: 'artist_2', title: 'Mechanical Texture', description: 'Exploring granular imperfections.', cover_image_url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200&fit=crop', items: [], created_at: ''
      }
    ], 
    past_projects: [], reviews: [], review_average: 5.0, review_count: 8, follower_count: 850, project_count: 12,
  },
  mairaj_ulhaq: {
    user: { id: 'artist_3', full_name: 'Mairaj Ulhaq', username: 'mairaj_ulhaq', city: 'Karachi', avatar_url: '/images/mairaj_ulhaq.png', role: 'creative', created_at: '', phone: '' },
    profile: { id: 'artist_3', bio: 'Food and Product photographer specializing in high-fidelity Marketing Content.', disciplines: ['Photography', 'Marketing Content'], availability: 'available', starting_rate: 65000, verified: true },
    portfolio: [
      { id: 'm1', artist_id: 'artist_3', title: 'Fragrance Study', category: 'Product', image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1200&fit=crop', sort_order: 0, is_hidden: false, created_at: '' },
      { id: 'm2', artist_id: 'artist_3', title: 'Coffee Ritual', category: 'Lifestyle', image_url: 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?q=80&w=1200&fit=crop', sort_order: 1, is_hidden: false, created_at: '' },
      { id: 'm3', artist_id: 'artist_3', title: 'Modern Texture', category: 'Abstract', image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1200&fit=crop', sort_order: 2, is_hidden: false, created_at: '' },
      { id: 'm4', artist_id: 'artist_3', title: 'Culinary Art', category: 'Food', image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&fit=crop', sort_order: 3, is_hidden: false, created_at: '' },
    ], 
    projects: [
      { id: 'p1', artist_id: 'artist_3', title: 'Edenrobe Fragrance', description: 'Visual campaign.', cover_image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1200&fit=crop', items: [], created_at: '' }
    ],
    past_projects: [], reviews: [], review_average: 5.0, review_count: 12, follower_count: 2400, project_count: 32,
  },
  ali_rez: {
    user: { id: 'artist_7', full_name: 'Ali Rez', username: 'ali_rez', city: 'Karachi', avatar_url: '/Users/macbook/.gemini/antigravity/brain/5cf43a23-7749-4760-99a3-caf0b153db87/pakistani_creative_director_portrait_1777893345611.png', role: 'creative', created_at: '', phone: '' },
    profile: { id: 'artist_7', bio: 'Award-winning creative director focusing on social impact.', disciplines: ['Marketing Content', 'Visual Arts'], availability: 'busy', starting_rate: 250000, verified: true },
    portfolio: [], projects: [], past_projects: [], reviews: [], review_average: 5.0, review_count: 102, follower_count: 15000, project_count: 240,
  },
  sana_nasir: {
    user: { id: 'artist_10', full_name: 'Sana Nasir', username: 'sana_nasir', city: 'Karachi', avatar_url: '/Users/macbook/.gemini/antigravity/brain/5cf43a23-7749-4760-99a3-caf0b153db87/pakistani_female_illustrator_portrait_1777893367977.png', role: 'creative', created_at: '', phone: '' },
    profile: { id: 'artist_10', bio: 'Illustrator and art director specializing in dark, surreal world-building.', disciplines: ['Digital Art', 'Visual Arts'], availability: 'available', starting_rate: 55000, verified: true },
    portfolio: [], projects: [], past_projects: [], reviews: [], review_average: 4.9, review_count: 18, follower_count: 2100, project_count: 42,
  },
  zulfiqar_zulfi: {
    user: { id: 'artist_12', full_name: 'Zulfiqar Ali Zulfi', username: 'zulfiqar_zulfi', city: 'Lahore', avatar_url: '/Users/macbook/.gemini/antigravity/brain/5cf43a23-7749-4760-99a3-caf0b153db87/pakistani_master_painter_portrait_1777893384772.png', role: 'creative', created_at: '', phone: '' },
    profile: { id: 'artist_12', bio: 'Master landscape painter capturing the light and haze of the Punjab.', disciplines: ['Visual Arts'], availability: 'available', starting_rate: 200000, verified: true },
    portfolio: [], projects: [], past_projects: [], reviews: [], review_average: 5.0, review_count: 88, follower_count: 9000, project_count: 150,
  },
  abdullah_syed: {
    user: { id: 'artist_9', full_name: 'Abdullah M.I. Syed', username: 'abdullah_syed', city: 'Karachi', avatar_url: '/Users/macbook/.gemini/antigravity/brain/5cf43a23-7749-4760-99a3-caf0b153db87/pakistani_male_scholar_artist_portrait_1777893415330.png', role: 'creative', created_at: '', phone: '' },
    profile: { id: 'artist_9', bio: 'Visual artist and scholar investigating the relationship between text and body.', disciplines: ['Visual Arts', 'Calligraphy'], availability: 'available', starting_rate: 120000, verified: true },
    portfolio: [], projects: [], past_projects: [], reviews: [], review_average: 5.0, review_count: 31, follower_count: 3200, project_count: 88,
  },
  babar_sheikh: {
    user: { id: 'artist_11', full_name: 'Babar Sheikh', username: 'babar_sheikh', city: 'Karachi', avatar_url: '/Users/macbook/.gemini/antigravity/brain/5cf43a23-7749-4760-99a3-caf0b153db87/pakistani_male_filmmaker_portrait_1777893434096.png', role: 'creative', created_at: '', phone: '' },
    profile: { id: 'artist_11', bio: 'Film director and musician exploring the avant-garde in Pakistani cinema.', disciplines: ['Music', 'Marketing Content'], availability: 'available', starting_rate: 150000, verified: true },
    portfolio: [], projects: [], past_projects: [], reviews: [], review_average: 5.0, review_count: 27, follower_count: 4300, project_count: 52,
  },
  zainab_baloch: {
    user: { id: 'artist_4', full_name: 'Zainab Baloch', username: 'zainab_baloch', city: 'Karachi', avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddda0d7c75?q=80&w=150&fit=crop', role: 'creative', created_at: '', phone: '' },
    profile: { id: 'artist_4', bio: 'Contemporary textile artist exploring traditional weaving.', disciplines: ['Textile Design', 'Visual Arts'], availability: 'available', starting_rate: 40000, verified: true },
    portfolio: [], projects: [], past_projects: [], reviews: [], review_average: 4.8, review_count: 15, follower_count: 1800, project_count: 28,
  },
  sanki_king: {
    user: { id: 'artist_5', full_name: 'Sanki King', username: 'sanki_king', city: 'Karachi', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&fit=crop', role: 'creative', created_at: '', phone: '' },
    profile: { id: 'artist_5', bio: 'Graffiti pioneer and street artist.', disciplines: ['Street Art', 'Calligraphy'], availability: 'available', starting_rate: 80000, verified: true },
    portfolio: [], projects: [], past_projects: [], reviews: [], review_average: 5.0, review_count: 42, follower_count: 5500, project_count: 120,
  }
};
