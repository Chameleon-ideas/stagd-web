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

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
const MOCK_ENABLED = true; // For development without backend

// ── Fetch helper ─────────────────────────────────────────────

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

// ── Auth header helper (for authenticated requests) ──────────

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

// ════════════════════════════════════════════════════════════
// USERS & PROFILES
// ════════════════════════════════════════════════════════════

/**
 * Get a public artist profile by username.
 */
export async function getArtistProfile(
  username: string,
): Promise<ArtistPublicProfile> {
  if (MOCK_ENABLED) {
    const mock = MOCK_ARTISTS[username.toLowerCase()];
    if (mock) return mock;
  }
  return apiFetch<ArtistPublicProfile>(`/users/${username}`);
}

// ════════════════════════════════════════════════════════════
// EVENTS
// ════════════════════════════════════════════════════════════

/**
 * Get a single event by ID.
 */
export async function getEvent(id: string): Promise<Event> {
  if (MOCK_ENABLED) {
    const mock = MOCK_EVENTS[id];
    if (mock) return mock;
  }
  return apiFetch<Event>(`/events/${id}`);
}

/**
 * List events with optional filters.
 */
export async function searchEvents(params?: {
  city?: string;
  type?: string;
  date?: string;
  price_max?: number;
  page?: number;
  per_page?: number;
}): Promise<PaginatedResponse<EventSearchResult>> {
  if (MOCK_ENABLED) {
    let events = Object.values(MOCK_EVENTS);

    if (params?.city) {
      events = events.filter(e => e.city.toLowerCase() === params.city?.toLowerCase());
    }
    if (params?.type) {
      events = events.filter(e => e.event_type.toLowerCase() === params.type?.toLowerCase());
    }

    return {
      data: events.map(e => ({
        event: {
          id: e.id,
          title: e.title,
          event_type: e.event_type,
          cover_image_url: e.cover_image_url,
          venue_name: e.venue_name,
          city: e.city,
          starts_at: e.starts_at,
          min_price: e.min_price,
          is_free: e.is_free,
          is_sold_out: e.is_sold_out,
        },
        organiser: e.organiser,
      })),
      total: events.length,
      page: 1,
      per_page: 20,
      has_more: false,
    };
  }
  const qs = new URLSearchParams(
    Object.entries(params ?? {})
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  return apiFetch<PaginatedResponse<EventSearchResult>>(
    `/search/events${qs ? `?${qs}` : ''}`,
  );
}

/**
 * Get events organised by a specific user.
 */
export async function getArtistEvents(
  organiserId: string,
): Promise<PaginatedResponse<EventSearchResult>> {
  if (MOCK_ENABLED) {
    const events = Object.values(MOCK_EVENTS).filter(e => e.organiser_id === organiserId);
    return {
      data: events.map(e => ({
        event: {
          id: e.id,
          title: e.title,
          event_type: e.event_type,
          cover_image_url: e.cover_image_url,
          venue_name: e.venue_name,
          city: e.city,
          starts_at: e.starts_at,
          min_price: e.min_price,
          is_free: e.is_free,
          is_sold_out: e.is_sold_out,
        },
        organiser: e.organiser,
      })),
      total: events.length,
      page: 1,
      per_page: 20,
      has_more: false,
    };
  }
  return apiFetch<PaginatedResponse<EventSearchResult>>(
    `/events?organiser=${organiserId}&status=live`,
  );
}

// ════════════════════════════════════════════════════════════
// TICKETS
// ════════════════════════════════════════════════════════════

/**
 * Purchase a ticket.
 */
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
  return apiFetch(`/events/${eventId}/tickets/purchase`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Verify a ticket.
 */
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
    if (ticketId === 'TKT-USED') {
      return {
        status: 'already_used',
        ticket_id: 'TKT-2026-U1122',
        buyer_name: 'Sara Khan',
        scanned_at: new Date(Date.now() - 3600000).toISOString(),
      };
    }
    return { status: 'not_recognised' };
  }
  return apiFetch<VerifyResult>(`/verify/${ticketId}`, {
    cache: 'no-store',
  });
}

// ════════════════════════════════════════════════════════════
// SEARCH
// ════════════════════════════════════════════════════════════

/**
 * Search artists with filters.
 */
export async function searchArtists(params?: {
  discipline?: string;
  city?: string;
  availability?: string;
  page?: number;
  per_page?: number;
}): Promise<PaginatedResponse<ArtistSearchResult>> {
  if (MOCK_ENABLED) {
    let artists = Object.values(MOCK_ARTISTS);
    
    if (params?.city) {
      artists = artists.filter(a => a.user.city?.toLowerCase() === params.city?.toLowerCase());
    }
    if (params?.discipline) {
      artists = artists.filter(a => a.profile.disciplines.some(d => d.toLowerCase() === params.discipline?.toLowerCase()));
    }

    return {
      data: artists.map(a => ({
        user: a.user,
        profile: a.profile,
        review_average: a.review_average,
        project_count: a.project_count,
      })),
      total: artists.length,
      page: 1,
      per_page: 20,
      has_more: false,
    };
  }
  const qs = new URLSearchParams(
    Object.entries(params ?? {})
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  return apiFetch<PaginatedResponse<ArtistSearchResult>>(
    `/search/artists${qs ? `?${qs}` : ''}`,
  );
}

// ── Mock Data ────────────────────────────────────────────────

const MOCK_EVENTS: Record<string, Event> = {
  event_1: {
    id: 'event_1',
    organiser_id: 'artist_1',
    organiser: { id: 'artist_1', full_name: 'Lyari Underground', username: 'lyari_underground', avatar_url: 'https://images.unsplash.com/photo-1520110120385-ad291a104bc2?w=400&h=400&fit=crop' },
    title: 'Sounds of Lyari Festival',
    event_type: 'concert',
    cover_image_url: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=1200&h=800&fit=crop',
    venue_name: 'T2F Garden',
    city: 'Karachi',
    starts_at: new Date(Date.now() + 86400000 * 5).toISOString(),
    status: 'live',
    created_at: '',
    ticket_tiers: [],
    min_price: 1500,
    is_free: false,
    is_sold_out: false,
  },
  event_2: {
    id: 'event_2',
    organiser_id: 'artist_2',
    organiser: { id: 'artist_2', full_name: 'Risograph Karachi', username: 'risograph_khi', avatar_url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=400&fit=crop' },
    title: 'Intro to Riso Printing',
    event_type: 'workshop',
    cover_image_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&h=800&fit=crop',
    venue_name: 'Stagd Studio',
    city: 'Karachi',
    starts_at: new Date(Date.now() + 86400000 * 10).toISOString(),
    status: 'live',
    created_at: '',
    ticket_tiers: [],
    min_price: 3500,
    is_free: false,
    is_sold_out: false,
  }
};

const MOCK_ARTISTS: Record<string, ArtistPublicProfile> = {
  lyari_underground: {
    user: {
      id: 'artist_1',
      phone: '+923001234567',
      full_name: 'Lyari Underground',
      username: 'lyari_underground',
      role: 'creative',
      city: 'Karachi',
      avatar_url: 'https://images.unsplash.com/photo-1520110120385-ad291a104bc2?w=400&h=400&fit=crop',
      created_at: new Date().toISOString(),
    },
    profile: {
      id: 'artist_1',
      bio: 'The sound of the streets. Lyari Underground is a hip-hop collective bringing the raw energy of Karachi\'s most vibrant neighborhood to the global stage.',
      disciplines: ['Music', 'Hip-hop', 'Community'],
      availability: 'available',
      starting_rate: 50000,
      verified: true,
      accent_color: '#649839', // Karachi Green
      instagram_handle: 'lyari_ug',
    },
    portfolio: [
      { id: 'p1', artist_id: 'artist_1', image_url: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=800&h=1000&fit=crop', title: 'Live at T2F', sort_order: 0, is_hidden: false, created_at: '' },
      { id: 'p2', artist_id: 'artist_1', image_url: 'https://images.unsplash.com/photo-1514525253361-bee8a187499b?w=800&h=800&fit=crop', title: 'Studio Session', sort_order: 1, is_hidden: false, created_at: '' },
      { id: 'p3', artist_id: 'artist_1', image_url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&h=600&fit=crop', title: 'Street Mural', sort_order: 2, is_hidden: false, created_at: '' },
      { id: 'p4', artist_id: 'artist_1', image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=1200&fit=crop', title: 'Backstage', sort_order: 3, is_hidden: false, created_at: '' },
    ],
    past_projects: [
      { id: 'proj1', artist_id: 'artist_1', title: 'Sounds of Lyari Festival', description: 'Curating the first neighborhood hip-hop festival.', created_at: '' }
    ],
    reviews: [],
    review_average: 4.9,
    review_count: 24,
    follower_count: 1200,
    project_count: 45,
    social_links: { instagram: 'lyari_ug', youtube: 'lyari_underground' }
  },
  risograph_khi: {
    user: {
      id: 'artist_2',
      phone: '+923007654321',
      full_name: 'Risograph Karachi',
      username: 'risograph_khi',
      role: 'creative',
      city: 'Karachi',
      avatar_url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=400&fit=crop',
      created_at: new Date().toISOString(),
    },
    profile: {
      id: 'artist_2',
      bio: 'Independent print studio specializing in risograph techniques. Experimental, tactile, and community-driven.',
      disciplines: ['Printmaking', 'Graphic Design', 'Workshop'],
      availability: 'available',
      starting_rate: 15000,
      verified: true,
      accent_color: '#1CAEE5', // Sky Cyan
    },
    portfolio: [
      { id: 'r1', artist_id: 'artist_2', image_url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=1000&fit=crop', title: 'Cyan Overlay', sort_order: 0, is_hidden: false, created_at: '' },
      { id: 'r2', artist_id: 'artist_2', image_url: 'https://images.unsplash.com/photo-1541462608141-ad603a1ee596?w=800&h=800&fit=crop', title: 'Texture Study', sort_order: 1, is_hidden: false, created_at: '' },
      { id: 'r3', artist_id: 'artist_2', image_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=600&fit=crop', title: 'Workshop Setup', sort_order: 2, is_hidden: false, created_at: '' },
    ],
    past_projects: [],
    reviews: [],
    review_average: 5.0,
    review_count: 8,
    follower_count: 850,
    project_count: 12,
  }
};
