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

/**
 * List events with optional filters.
 */
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
    } else if (params?.price_max) {
      events = events.filter(e => e.min_price <= params.price_max!);
    }

    // Mock Date Logic
    if (params?.date && params.date !== 'Any') {
      const today = new Date();
      if (params.date === 'Today') {
        events = events.filter(e => new Date(e.starts_at).toDateString() === today.toDateString());
      } else if (params.date === 'This Week') {
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        events = events.filter(e => new Date(e.starts_at) <= nextWeek);
      }
    }

    // Sort Logic
    if (params?.sort === 'Price low-high') {
      events = events.sort((a, b) => a.min_price - b.min_price);
    } else if (params?.sort === 'Price high-low') {
      events = events.sort((a, b) => b.min_price - a.min_price);
    } else if (params?.sort === 'Soonest') {
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

  let query = supabase
    .from('events')
    .select('*, organiser:profiles(id, full_name, username, avatar_url)', { count: 'exact' });

  if (params?.city) query = query.eq('city', params.city);
  if (params?.type) query = query.eq('event_type', params.type);
  if (params?.price_max) query = query.lte('min_price', params.price_max);
  if (params?.is_free) query = query.eq('is_free', true);
  
  const page = params?.page ?? 1;
  const perPage = params?.per_page ?? 20;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  
  const { data, error, count } = await query
    .order('starts_at', { ascending: true })
    .range(from, to);

  if (error) {
    return apiFetch<PaginatedResponse<EventSearchResult>>(`/search/events`);
  }

  return {
    data: (data || []).map(d => ({
      event: d as any,
      organiser: d.organiser as any,
    })),
    total: count || 0,
    page,
    per_page: perPage,
    has_more: (count || 0) > to + 1,
  };
}

// ════════════════════════════════════════════════════════════
// TICKETS & PURCHASES
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
  if (MOCK_ENABLED) {
    const ticket_id = `TKT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const qr_url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${ticket_id}`;
    return {
      ticket_id,
      qr_url,
      total_paid: 1500 * payload.quantity
    };
  }

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
  budget_max?: number;
  availability?: string;
  page?: number;
  per_page?: number;
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

    if (params?.budget_max) {
      artists = artists.filter(a => (a.profile.starting_rate ?? Infinity) <= params.budget_max!);
    }

    if (params?.availability === 'available') {
      artists = artists.filter(a => a.profile.availability === 'available');
    }

    // Sort Logic
    if (params?.sort === 'Rating') {
      artists = artists.sort((a, b) => b.review_average - a.review_average);
    } else if (params?.sort === 'Most reviewed') {
      artists = artists.sort((a, b) => b.review_count - a.review_count);
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

  let query = supabase
    .from('artist_profiles')
    .select(`
      *,
      user:profiles(id, full_name, username, avatar_url, city),
      portfolio_items(image_url)
    `, { count: 'exact' });

  if (params?.city) query = query.eq('user.city', params.city);
  if (params?.discipline) query = query.contains('disciplines', [params.discipline]);
  if (params?.budget_max) query = query.lte('starting_rate', params.budget_max);
  if (params?.availability) query = query.eq('availability', params.availability);
  
  const page = params?.page ?? 1;
  const perPage = params?.per_page ?? 20;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data, error, count } = await query
    .order('verified', { ascending: false })
    .range(from, to);

  if (error) {
    return apiFetch<PaginatedResponse<ArtistSearchResult>>(`/search/artists`);
  }

  return {
    data: (data || []).map(d => ({
      user: d.user as any,
      profile: d as any,
      hero_image: d.portfolio_items?.[0]?.image_url,
      review_average: 5.0,
      review_count: 0,
    })),
    total: count || 0,
    page,
    per_page: perPage,
    has_more: (count || 0) > to + 1,
  };
}

/**
 * Get a public event by ID.
 */
export async function getEvent(id: string): Promise<Event> {
  if (MOCK_ENABLED) {
    const mock = MOCK_EVENTS[id];
    if (mock) return mock;
  }
  
  const { data, error } = await supabase
    .from('events')
    .select('*, organiser:profiles(*), ticket_tiers(*)')
    .eq('id', id)
    .single();

  if (error) {
    return apiFetch<Event>(`/events/${id}`);
  }
  
  return {
    ...data,
    organiser: data.organiser as any,
    ticket_tiers: data.ticket_tiers as any,
  } as any;
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
        event: e,
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

// ── Mock Data ────────────────────────────────────────────────

const MOCK_EVENTS: Record<string, Event> = {
  event_1: {
    id: 'event_1',
    organiser_id: 'artist_1',
    organiser: { id: 'artist_1', full_name: 'Lyari Underground', username: 'lyari_underground', avatar_url: '/images/lyari.png' },
    title: 'Sounds of Lyari Festival',
    event_type: 'concert',
    cover_image_url: '/images/festival.png',
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
    organiser: { id: 'artist_2', full_name: 'Risograph Karachi', username: 'risograph_khi', avatar_url: '/images/riso.png' },
    title: 'Intro to Riso Printing',
    event_type: 'workshop',
    cover_image_url: '/images/workshop.png',
    venue_name: 'Stagd Studio',
    city: 'Karachi',
    starts_at: new Date(Date.now() + 86400000 * 10).toISOString(),
    status: 'live',
    created_at: '',
    ticket_tiers: [],
    min_price: 3500,
    is_free: false,
    is_sold_out: false,
  },
  event_3: {
    id: 'event_3',
    organiser_id: 'artist_3',
    organiser: { id: 'artist_3', full_name: 'The Last Exit', username: 'last_exit_lhr', avatar_url: '/images/lahore_street_art.png' },
    title: 'Lahore Mural Tour',
    event_type: 'exhibition',
    cover_image_url: '/images/mural_tour.png',
    venue_name: 'Walled City',
    city: 'Lahore',
    starts_at: new Date(Date.now() + 86400000 * 7).toISOString(),
    status: 'live',
    created_at: '',
    ticket_tiers: [],
    min_price: 500,
    is_free: false,
    is_sold_out: false,
  },
  event_4: {
    id: 'event_4',
    organiser_id: 'artist_6',
    organiser: { id: 'artist_6', full_name: 'Ali Raza', username: 'ali_raza_art', avatar_url: '/images/ali_raza.png' },
    title: 'Script & Sound',
    event_type: 'concert',
    cover_image_url: '/images/ali_raza.png',
    venue_name: 'Alhamra Arts Council',
    city: 'Lahore',
    starts_at: new Date(Date.now() + 86400000 * 15).toISOString(),
    status: 'live',
    created_at: '',
    ticket_tiers: [],
    min_price: 2000,
    is_free: false,
    is_sold_out: false,
  },
  event_5: {
    id: 'event_5',
    organiser_id: 'artist_7',
    organiser: { id: 'artist_7', full_name: 'Saad Siddiqui', username: 'saad_codes', avatar_url: '/images/saad_sid.png' },
    title: 'Syntax Error',
    event_type: 'talk',
    cover_image_url: '/images/saad_sid.png',
    venue_name: 'The Hive',
    city: 'Islamabad',
    starts_at: new Date(Date.now() + 86400000 * 3).toISOString(),
    status: 'live',
    created_at: '',
    ticket_tiers: [],
    min_price: 0,
    is_free: true,
    is_sold_out: false,
  },
  event_6: {
    id: 'event_6',
    organiser_id: 'artist_8',
    organiser: { id: 'artist_8', full_name: 'Zainab Baloch', username: 'zainab_baloch', avatar_url: '/images/zainab_baloch.png' },
    title: 'Warp & Weft',
    event_type: 'workshop',
    cover_image_url: '/images/zainab_baloch.png',
    venue_name: 'Koel Gallery',
    city: 'Karachi',
    starts_at: new Date(Date.now() + 86400000 * 20).toISOString(),
    status: 'live',
    created_at: '',
    ticket_tiers: [],
    min_price: 5000,
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
      avatar_url: '/images/lyari.png',
      created_at: new Date().toISOString(),
    },
    profile: {
      id: 'artist_1',
      bio: 'The sound of the streets. Lyari Underground is a hip-hop collective bringing the raw energy of Karachi\'s most vibrant neighborhood to the global stage.',
      disciplines: ['Music', 'Hip-hop', 'Community'],
      availability: 'available',
      starting_rate: 50000,
      verified: true,
      accent_color: '#649839',
      instagram_handle: 'lyari_ug',
    },
    portfolio: [
      { id: 'p1', artist_id: 'artist_1', image_url: '/images/festival.png', title: 'Live at T2F', sort_order: 0, is_hidden: false, created_at: '' },
      { id: 'p2', artist_id: 'artist_1', image_url: '/images/lyari.png', title: 'Studio Session', sort_order: 1, is_hidden: false, created_at: '' },
    ],
    past_projects: [
      { id: 'proj1', artist_id: 'artist_1', title: 'Sounds of Lyari Festival', description: 'Curating the first neighborhood hip-hop festival.', created_at: '' }
    ],
    reviews: [],
    review_average: 4.9,
    review_count: 24,
    follower_count: 1200,
    project_count: 45,
  },
  risograph_khi: {
    user: {
      id: 'artist_2',
      phone: '+923007654321',
      full_name: 'Risograph Karachi',
      username: 'risograph_khi',
      role: 'creative',
      city: 'Karachi',
      avatar_url: '/images/riso.png',
      created_at: new Date().toISOString(),
    },
    profile: {
      id: 'artist_2',
      bio: 'Independent print studio specializing in risograph techniques. Experimental, tactile, and community-driven.',
      disciplines: ['Printmaking', 'Graphic Design', 'Workshop'],
      availability: 'available',
      starting_rate: 15000,
      verified: true,
      accent_color: '#1CAEE5',
    },
    portfolio: [
      { id: 'r1', artist_id: 'artist_2', image_url: '/images/riso.png', title: 'Cyan Overlay', sort_order: 0, is_hidden: false, created_at: '' },
      { id: 'r2', artist_id: 'artist_2', image_url: '/images/workshop.png', title: 'Texture Study', sort_order: 1, is_hidden: false, created_at: '' },
    ],
    past_projects: [],
    reviews: [],
    review_average: 5.0,
    review_count: 8,
    follower_count: 850,
    project_count: 12,
  },
  last_exit_lhr: {
    user: {
      id: 'artist_3',
      phone: '+923001112223',
      full_name: 'The Last Exit',
      username: 'last_exit_lhr',
      role: 'creative',
      city: 'Lahore',
      avatar_url: '/images/lahore_street_art.png',
      created_at: new Date().toISOString(),
    },
    profile: {
      id: 'artist_3',
      bio: 'A street art collective transforming the walls of Lahore with vibrant murals and storytelling.',
      disciplines: ['Street Art', 'Muralism', 'Visual Arts'],
      availability: 'available',
      starting_rate: 25000,
      verified: true,
      accent_color: '#E91E63',
    },
    portfolio: [
      { id: 'l1', artist_id: 'artist_3', image_url: '/images/lahore_street_art.png', title: 'Walled City Mural', sort_order: 0, is_hidden: false, created_at: '' },
      { id: 'l2', artist_id: 'artist_3', image_url: '/images/mural_tour.png', title: 'Street Gallery', sort_order: 1, is_hidden: false, created_at: '' },
    ],
    past_projects: [],
    reviews: [],
    review_average: 4.8,
    review_count: 15,
    follower_count: 2100,
    project_count: 32,
  },
  nova_digital: {
    user: {
      id: 'artist_4',
      phone: '+923004445556',
      full_name: 'Nova Digital',
      username: 'nova_digital',
      role: 'creative',
      city: 'Islamabad',
      avatar_url: '/images/isb_digital.png',
      created_at: new Date().toISOString(),
    },
    profile: {
      id: 'artist_4',
      bio: 'Exploring the intersection of technology and art through 3D modeling and digital environments.',
      disciplines: ['3D Art', 'Digital Design', 'Animation'],
      availability: 'available',
      starting_rate: 40000,
      verified: true,
      accent_color: '#7C4DFF',
    },
    portfolio: [
      { id: 'n1', artist_id: 'artist_4', image_url: '/images/isb_digital.png', title: 'Abstract Flow', sort_order: 0, is_hidden: false, created_at: '' },
    ],
    past_projects: [],
    reviews: [],
    review_average: 5.0,
    review_count: 12,
    follower_count: 3400,
    project_count: 18,
  },
  amal_fashion: {
    user: {
      id: 'artist_5',
      phone: '+923007778889',
      full_name: 'Amal Sustainable',
      username: 'amal_fashion_khi',
      role: 'creative',
      city: 'Karachi',
      avatar_url: '/images/khi_fashion.png',
      created_at: new Date().toISOString(),
    },
    profile: {
      id: 'artist_5',
      bio: 'Slow fashion and sustainable textiles, handcrafted in the heart of Karachi.',
      disciplines: ['Fashion Design', 'Textiles', 'Sustainability'],
      availability: 'available',
      starting_rate: 30000,
      verified: true,
      accent_color: '#4CAF50',
    },
    portfolio: [
      { id: 'f1', artist_id: 'artist_5', image_url: '/images/khi_fashion.png', title: 'Organic Collection', sort_order: 0, is_hidden: false, created_at: '' },
    ],
    past_projects: [],
    reviews: [],
    review_average: 4.9,
    review_count: 21,
    follower_count: 1500,
    project_count: 24,
  },
  ali_raza_art: {
    user: {
      id: 'artist_6',
      phone: '+923001112224',
      full_name: 'Ali Raza',
      username: 'ali_raza_art',
      role: 'creative',
      city: 'Lahore',
      avatar_url: '/images/ali_raza.png',
      created_at: new Date().toISOString(),
    },
    profile: {
      id: 'artist_6',
      bio: 'Contemporary calligrapher merging traditional script with modern abstract forms.',
      disciplines: ['Calligraphy', 'Visual Arts', 'Design'],
      availability: 'available',
      starting_rate: 35000,
      verified: true,
      accent_color: '#000000',
    },
    portfolio: [
      { id: 'ali1', artist_id: 'artist_6', image_url: '/images/ali_raza.png', title: 'Ink Study', sort_order: 0, is_hidden: false, created_at: '' },
    ],
    past_projects: [],
    reviews: [],
    review_average: 5.0,
    review_count: 18,
    follower_count: 4200,
    project_count: 56,
  },
  saad_codes: {
    user: {
      id: 'artist_7',
      phone: '+923001112225',
      full_name: 'Saad Siddiqui',
      username: 'saad_codes',
      role: 'creative',
      city: 'Islamabad',
      avatar_url: '/images/saad_sid.png',
      created_at: new Date().toISOString(),
    },
    profile: {
      id: 'artist_7',
      bio: 'Creative coder exploring generative art and interactive installations.',
      disciplines: ['Generative Art', 'Code', 'Interactive'],
      availability: 'available',
      starting_rate: 45000,
      verified: true,
      accent_color: '#00FF00',
    },
    portfolio: [
      { id: 'saad1', artist_id: 'artist_7', image_url: '/images/saad_sid.png', title: 'Recursive Flow', sort_order: 0, is_hidden: false, created_at: '' },
    ],
    past_projects: [],
    reviews: [],
    review_average: 4.9,
    review_count: 14,
    follower_count: 2800,
    project_count: 22,
  },
  zainab_baloch: {
    user: {
      id: 'artist_8',
      phone: '+923001112226',
      full_name: 'Zainab Baloch',
      username: 'zainab_baloch',
      role: 'creative',
      city: 'Karachi',
      avatar_url: '/images/zainab_baloch.png',
      created_at: new Date().toISOString(),
    },
    profile: {
      id: 'artist_8',
      bio: 'Textile artist focused on sustainable weaving techniques and organic dyes.',
      disciplines: ['Textiles', 'Visual Arts', 'Workshop'],
      availability: 'available',
      starting_rate: 20000,
      verified: true,
      accent_color: '#8B4513',
    },
    portfolio: [
      { id: 'z1', artist_id: 'artist_8', image_url: '/images/zainab_baloch.png', title: 'Woven Earth', sort_order: 0, is_hidden: false, created_at: '' },
    ],
    past_projects: [],
    reviews: [],
    review_average: 5.0,
    review_count: 9,
    follower_count: 1900,
    project_count: 14,
  },
  mairaj_ulhaq: {
    user: {
      id: 'artist_9',
      phone: '',
      full_name: 'Mairaj Ulhaq',
      username: 'mairaj_ulhaq',
      role: 'creative',
      city: 'Karachi',
      avatar_url: '/images/mairaj/profile.jpg',
      created_at: new Date().toISOString(),
    },
    profile: {
      id: 'artist_9',
      bio: 'Food and Product photographer specializing in high-fidelity Marketing Content. I shoot goods, transforming culinary and luxury products into cinematic visual narratives.',
      disciplines: ['Food Photography', 'Product Design', 'Marketing Content'],
      availability: 'available',
      starting_rate: 65000,
      verified: true,
      accent_color: '#FFB800',
    },
    portfolio: [
      { id: 'm1', artist_id: 'artist_9', title: 'Edenrobe Fragrance', image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800&h=1000&fit=crop', sort_order: 0, is_hidden: false, created_at: '' },
      { id: 'm2', artist_id: 'artist_9', title: 'Mondo Culinary Series', image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&h=600&fit=crop', sort_order: 1, is_hidden: false, created_at: '' },
      { id: 'm3', artist_id: 'artist_9', title: 'After Five Coffee', image_url: 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?q=80&w=800&h=1000&fit=crop', sort_order: 2, is_hidden: false, created_at: '' },
      { id: 'm4', artist_id: 'artist_9', title: 'Siroc Contemporary', image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&h=600&fit=crop', sort_order: 3, is_hidden: false, created_at: '' },
      { id: 'm5', artist_id: 'artist_9', title: 'Liquid Texture Study', image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=800&h=1000&fit=crop', sort_order: 4, is_hidden: false, created_at: '' },
      { id: 'm6', artist_id: 'artist_9', title: 'Grao Lifestyle', image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800&h=600&fit=crop', sort_order: 5, is_hidden: false, created_at: '' },
    ],
    past_projects: [
      { id: 'mp1', artist_id: 'artist_9', title: 'Edenrobe Winter Campaign', description: 'Lead photographer for the 2024 fragrance launch.', created_at: '' }
    ],
    reviews: [],
    review_average: 5.0,
    review_count: 22,
    follower_count: 2400,
    project_count: 58,
  }
};
