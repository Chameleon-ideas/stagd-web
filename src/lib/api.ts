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

// ── MOCK DATA ────────────────────────────────────────────────

const MOCK_EVENTS: Record<string, Event> = {
  event_1: {
    id: 'event_1',
    organiser_id: 'osman_malik',
    organiser: { id: 'osman_malik', full_name: 'Osman Malik', username: 'osman_malik', avatar_url: '/images/osman_portrait.png' },
    organiser_disciplines: ['Music', 'Sound Design'],
    title: 'Glitch Heritage Live',
    description: 'An immersive live set blending granular synthesis with classical sitar and tabla samples. Osman Malik performs his acclaimed Glitch Heritage series live for the first time in Lahore — expect full A/V with realtime visuals mapped to the sound.',
    event_type: 'concert',
    cover_image_url: '/images/osman_project.png',
    venue_name: 'The Grid Lahore',
    city: 'Lahore',
    starts_at: '2026-05-12T20:00:00+05:00',
    doors_at: '2026-05-12T19:00:00+05:00',
    status: 'live',
    created_at: '',
    ticket_tiers: [
      { id: 'ga', event_id: 'event_1', name: 'General Admission', price: 1500, capacity: 200, spots_remaining: 42, is_door_only: false, sort_order: 0 },
      { id: 'vip', event_id: 'event_1', name: 'VIP — Front Rows', price: 3500, capacity: 40, spots_remaining: 8, is_door_only: false, sort_order: 1 },
    ],
    min_price: 1500,
    is_free: false,
    is_sold_out: false,
  },
  event_2: {
    id: 'event_2',
    organiser_id: 'hamza_qureshi',
    organiser: { id: 'hamza_qureshi', full_name: 'Hamza Qureshi', username: 'hamza_qureshi', avatar_url: '/images/hamza_portrait.png' },
    organiser_disciplines: ['Calligraphy', 'Visual Arts'],
    title: 'Modern Qalam Workshop',
    description: 'A hands-on calligraphy workshop led by Hamza Qureshi, exploring the intersection of classical Arabic script and contemporary abstract mark-making. All materials provided. Suitable for beginners and intermediate practitioners.',
    event_type: 'workshop',
    cover_image_url: '/images/hamza_project.png',
    venue_name: 'Stagd Studio Karachi',
    city: 'Karachi',
    starts_at: '2026-05-14T14:00:00+05:00',
    doors_at: '2026-05-14T13:30:00+05:00',
    status: 'live',
    created_at: '',
    ticket_tiers: [
      { id: 'ws', event_id: 'event_2', name: 'Workshop Seat', price: 3500, capacity: 20, spots_remaining: 5, is_door_only: false, sort_order: 0 },
    ],
    min_price: 3500,
    is_free: false,
    is_sold_out: false,
  },
  event_3: {
    id: 'event_3',
    organiser_id: 'bilal_ahmed',
    organiser: { id: 'bilal_ahmed', full_name: 'Bilal Ahmed', username: 'bilal_ahmed', avatar_url: '/images/bilal_portrait.png' },
    title: 'Street Jam Karachi',
    event_type: 'workshop',
    cover_image_url: '/images/bilal_project.png',
    venue_name: 'Lyari Public Walls',
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
  mairaj_ulhaq: {
    user: { id: 'm1', full_name: 'Mairaj Ulhaq', username: 'mairaj_ulhaq', city: 'Karachi', avatar_url: '/images/mairaj_ulhaq.png', role: 'creative', created_at: '2021-01-01', phone: '' },
    profile: { id: 'p_m1', bio: 'Editorial Photographer and Product specialist based in Karachi.', disciplines: ['Photography', 'Marketing Content'], availability: 'available', starting_rate: 65000, verified: true },
    detailed_bio: "Mairaj Ulhaq is a commercial photographer with over a decade of experience in capturing the intersection of grit and luxury. His work for brands like Khaadi and Edenrobe has defined a new cinematic standard for Pakistani product photography. Based in Karachi, he operates a boutique studio specializing in high-fidelity visual storytelling. His approach blends technical precision with an editorial soul, finding beauty in the most minimalist of subjects.",
    portfolio: [
       { id: 'port_m1', artist_id: 'm1', title: 'Fragrance Study', category: 'Product', image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1200&fit=crop', sort_order: 0, is_hidden: false, created_at: '' },
       { id: 'port_m2', artist_id: 'm1', title: 'Watch Details', category: 'Product', image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1200&fit=crop', sort_order: 1, is_hidden: false, created_at: '' },
       { id: 'port_m3', artist_id: 'm1', title: 'Minimalist Objects', category: 'Editorial', image_url: 'https://images.unsplash.com/photo-1511556820780-d912e42b4980?q=80&w=1200&fit=crop', sort_order: 2, is_hidden: false, created_at: '' },
       { id: 'port_m4', artist_id: 'm1', title: 'Leather Craft', category: 'Product', image_url: 'https://images.unsplash.com/photo-1490367532201-b9bc1dc483f6?q=80&w=1200&fit=crop', sort_order: 3, is_hidden: false, created_at: '' },
       { id: 'port_m5', artist_id: 'm1', title: 'Architectural Shadow', category: 'Editorial', image_url: 'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?q=80&w=1200&fit=crop', sort_order: 4, is_hidden: false, created_at: '' },
       { id: 'port_m6', artist_id: 'm1', title: 'Monochrome Still', category: 'Editorial', image_url: 'https://images.unsplash.com/photo-1505330622279-bf7d7fc918f4?q=80&w=1200&fit=crop', sort_order: 5, is_hidden: false, created_at: '' },
       { id: 'port_m7', artist_id: 'm1', title: 'Luxury Detail', category: 'Product', image_url: 'https://images.unsplash.com/photo-1526170315870-ef0d9406085a?q=80&w=1200&fit=crop', sort_order: 6, is_hidden: false, created_at: '' },
       { id: 'port_m8', artist_id: 'm1', title: 'Urban Geometry', category: 'Editorial', image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&fit=crop', sort_order: 7, is_hidden: false, created_at: '' },
    ], 
    projects: [
      { 
        id: 'proj_m1', 
        artist_id: 'm1', 
        title: 'Commercial Series', 
        description: 'A study in minimalist luxury branding and product interaction.', 
        discipline: 'Product Photography',
        cover_image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1200&fit=crop', 
        items: [
          { id: 'm-p1-1', project_id: 'proj_m1', title: 'No. 5 Study', image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1200&fit=crop' },
          { id: 'm-p1-2', project_id: 'proj_m1', title: 'Texture Detail', image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1200&fit=crop' },
        ], 
        created_at: '' 
      },
      { 
        id: 'proj_m2', 
        artist_id: 'm1', 
        title: 'Editorial Objects', 
        description: 'Exploring the sculptural qualities of everyday retail objects.', 
        discipline: 'Editorial',
        cover_image_url: 'https://images.unsplash.com/photo-1511556820780-d912e42b4980?q=80&w=1200&fit=crop', 
        items: [
          { id: 'm-p2-1', project_id: 'proj_m2', title: 'Abstract Forms', image_url: 'https://images.unsplash.com/photo-1490367532201-b9bc1dc483f6?q=80&w=1200&fit=crop' },
          { id: 'm-p2-2', project_id: 'proj_m2', title: 'Shadow Play', image_url: 'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?q=80&w=1200&fit=crop' },
        ], 
        created_at: '' 
      }
    ],
    past_projects: [], reviews: [], review_average: 4.9, review_count: 12, follower_count: 2400, project_count: 32,
  },
  hamza_qureshi: {
    user: { id: 'h1', full_name: 'Hamza Qureshi', username: 'hamza_qureshi', city: 'Karachi', avatar_url: '/images/hamza_portrait.png', role: 'creative', created_at: '', phone: '' },
    profile: { id: 'p_h1', bio: 'Contemporary Calligrapher exploring the intersection of traditional scripts and modern abstract expressionism.', disciplines: ['Calligraphy', 'Visual Arts'], availability: 'available', starting_rate: 45000, verified: true },
    detailed_bio: "Hamza Qureshi is a Karachi-based visual artist whose work reinterprets classical Arabic calligraphy through the lens of modern minimalism. A graduate of NCA, Hamza has spent the last five years creating large-scale murals and digital installations that bring ancient scripts into the 21st-century urban environment.",
    portfolio: [
      { id: 'port_h1', artist_id: 'h1', title: 'Golden Scripts', category: 'Calligraphy', image_url: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=1200&fit=crop', sort_order: 0, is_hidden: false, created_at: '' },
      { id: 'port_h2', artist_id: 'h1', title: 'Ink Study', category: 'Calligraphy', image_url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200&fit=crop', sort_order: 1, is_hidden: false, created_at: '' },
      { id: 'port_h3', artist_id: 'h1', title: 'Abstract Flow', category: 'Visual Arts', image_url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1200&fit=crop', sort_order: 2, is_hidden: false, created_at: '' },
      { id: 'port_h4', artist_id: 'h1', title: 'Urban Texture', category: 'Visual Arts', image_url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1200&fit=crop', sort_order: 3, is_hidden: false, created_at: '' },
      { id: 'port_h5', artist_id: 'h1', title: 'Minimalist Script', category: 'Calligraphy', image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=1200&fit=crop', sort_order: 4, is_hidden: false, created_at: '' },
      { id: 'port_h6', artist_id: 'h1', title: 'Modern Mural', category: 'Visual Arts', image_url: 'https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=1200&fit=crop', sort_order: 5, is_hidden: false, created_at: '' },
    ], 
    projects: [
      { 
        id: 'proj_h1', 
        artist_id: 'h1', 
        title: 'Modern Qalam', 
        description: 'A collection of script studies bridging traditional techniques and contemporary abstraction.', 
        discipline: 'Calligraphy',
        cover_image_url: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=1200&fit=crop', 
        items: [
          { id: 'h-p1-1', project_id: 'proj_h1', title: 'Script Study 01', image_url: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=1200&fit=crop' },
          { id: 'h-p1-2', project_id: 'proj_h1', title: 'Script Study 02', image_url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200&fit=crop' },
        ], 
        created_at: '' 
      },
      { 
        id: 'proj_h2', 
        artist_id: 'h1', 
        title: 'Karachi Murals', 
        description: 'Public installations reclaiming urban concrete across Karachi.', 
        discipline: 'Visual Arts',
        cover_image_url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200&fit=crop', 
        items: [
          { id: 'h-p2-1', project_id: 'proj_h2', title: 'Wall Study 01', image_url: 'https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=1200&fit=crop' },
        ], 
        created_at: '' 
      }
    ],
    past_projects: [], reviews: [], review_average: 4.9, review_count: 24, follower_count: 1200, project_count: 12,
  },
  zoya_khan: {
    user: { id: 'z1', full_name: 'Zoya Khan', username: 'zoya_khan', city: 'Lahore', avatar_url: '/images/zoya_portrait.png', role: 'creative', created_at: '', phone: '' },
    profile: { id: 'p_z1', bio: 'Fashion Designer specializing in architectural bridal silhouettes and sustainable luxury.', disciplines: ['Fashion', 'Textile Design'], availability: 'busy', starting_rate: 120000, verified: true },
    detailed_bio: "Zoya Khan is an avant-garde fashion designer based in Lahore. Known for her 'Architectural Bridal' series, she fuses traditional Pakistani embroidery with structural silhouettes inspired by Mughal architecture. Zoya is a vocal advocate for sustainable fashion and works exclusively with hand-loomed fabrics from rural Punjab.",
    portfolio: [
      { id: 'port_z1', artist_id: 'z1', title: 'Architectural Bridal', category: 'Fashion', image_url: 'https://images.unsplash.com/photo-1594465919760-441fe5908ab0?q=80&w=1200&fit=crop', sort_order: 0, is_hidden: false, created_at: '' },
      { id: 'port_z2', artist_id: 'z1', title: 'Loom Study', category: 'Fashion', image_url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1200&fit=crop', sort_order: 1, is_hidden: false, created_at: '' },
      { id: 'port_z3', artist_id: 'z1', title: 'Silk Draping', category: 'Textile Design', image_url: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=1200&fit=crop', sort_order: 2, is_hidden: false, created_at: '' },
      { id: 'port_z4', artist_id: 'z1', title: 'Embroidery Detail', category: 'Fashion', image_url: 'https://images.unsplash.com/photo-1605462863863-10d9e47e15ee?q=80&w=1200&fit=crop', sort_order: 3, is_hidden: false, created_at: '' },
      { id: 'port_z5', artist_id: 'z1', title: 'Modern Silhouette', category: 'Fashion', image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&fit=crop', sort_order: 4, is_hidden: false, created_at: '' },
      { id: 'port_z6', artist_id: 'z1', title: 'Textile Pattern', category: 'Textile Design', image_url: 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1200&fit=crop', sort_order: 5, is_hidden: false, created_at: '' },
    ], 
    projects: [
      { 
        id: 'proj_z1', 
        artist_id: 'z1', 
        title: 'Emerald Fusion', 
        description: 'A study in high-fashion bridal silhouettes inspired by Mughal structural architecture.', 
        discipline: 'Fashion',
        cover_image_url: 'https://images.unsplash.com/photo-1594465919760-441fe5908ab0?q=80&w=1200&fit=crop', 
        items: [
          { id: 'z-p1-1', project_id: 'proj_z1', title: 'Velvet Study', image_url: 'https://images.unsplash.com/photo-1594465919760-441fe5908ab0?q=80&w=1200&fit=crop' },
        ], 
        created_at: '' 
      },
      { 
        id: 'proj_z2', 
        artist_id: 'z1', 
        title: 'Digital Silhouettes', 
        description: 'Avant-garde 3D rendered fashion concepts exploring sustainable luxury.', 
        discipline: 'Textile Design',
        cover_image_url: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?q=80&w=1200&fit=crop', 
        items: [], 
        created_at: '' 
      }
    ],
    past_projects: [], reviews: [], review_average: 4.8, review_count: 18, follower_count: 2100, project_count: 8,
  },
  bilal_ahmed: {
    user: { id: 'b1', full_name: 'Bilal Ahmed', username: 'bilal_ahmed', city: 'Karachi', avatar_url: '/images/bilal_portrait.png', role: 'creative', created_at: '', phone: '' },
    profile: { id: 'p_b1', bio: 'Street Artist and Muralist blending truck art heritage with modern graffiti techniques.', disciplines: ['Street Art', 'Visual Arts'], availability: 'available', starting_rate: 25000, verified: true },
    detailed_bio: "Bilal Ahmed is a self-taught street artist from Lyari who has become the face of Karachi's modern mural movement. His work is characterized by the vibrant patterns of Pakistani truck art, reimagined as large-scale urban interventions. Bilal's mission is to reclaim public spaces and turn every wall into a canvas for social unity.",
    portfolio: [
      { id: 'port_b1', artist_id: 'b1', title: 'Truck Unity', category: 'Street Art', image_url: 'https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=1200&fit=crop', sort_order: 0, is_hidden: false, created_at: '' },
      { id: 'port_b2', artist_id: 'b1', title: 'Concrete Garden', category: 'Street Art', image_url: 'https://images.unsplash.com/photo-1494173853739-c21f58b16055?q=80&w=1200&fit=crop', sort_order: 1, is_hidden: false, created_at: '' },
      { id: 'port_b3', artist_id: 'b1', title: 'Lyari Colors', category: 'Street Art', image_url: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=1200&fit=crop', sort_order: 2, is_hidden: false, created_at: '' },
      { id: 'port_b4', artist_id: 'b1', title: 'Urban Flow', category: 'Visual Arts', image_url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200&fit=crop', sort_order: 3, is_hidden: false, created_at: '' },
    ], 
    projects: [
      { 
        id: 'proj_b1', 
        artist_id: 'b1', 
        title: 'Karachi Walls', 
        description: 'Large-scale urban interventions transforming concrete into canvases for social unity.', 
        discipline: 'Street Art',
        cover_image_url: 'https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=1200&fit=crop', 
        items: [], 
        created_at: '' 
      }
    ],
    past_projects: [], reviews: [], review_average: 5.0, review_count: 32, follower_count: 5500, project_count: 45,
  },
  sara_siddiqui: {
    user: { id: 's1', full_name: 'Sara Siddiqui', username: 'sara_siddiqui', city: 'Islamabad', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&fit=crop', role: 'creative', created_at: '2023-01-01', phone: '' },
    profile: { id: 'p_s1', bio: 'Documentary Photographer focusing on high-contrast street visual storytelling.', disciplines: ['Photography', 'Journalism'], availability: 'available', starting_rate: 65000, verified: true },
    detailed_bio: "Sara Siddiqui is an Islamabad-based documentary photographer whose lens captures the quiet, cinematic soul of Pakistan's streets. A former photojournalist, Sara transitioned to independent visual storytelling to focus on long-form projects documenting the lives of the working class. Her work is exclusively black and white, emphasizing light, shadow, and raw emotion.",
    portfolio: [
      { id: 'port_s1', artist_id: 's1', title: 'Lyari Chronicles', category: 'Photography', image_url: 'https://images.unsplash.com/photo-1554080353-a576cf803bda?q=80&w=1200&fit=crop', sort_order: 0, is_hidden: false, created_at: '' },
      { id: 'port_s2', artist_id: 's1', title: 'Shadow Play', category: 'Photography', image_url: 'https://images.unsplash.com/photo-1554080353-a576cf803bda?q=80&w=1200&fit=crop', sort_order: 1, is_hidden: false, created_at: '' },
    ], 
    projects: [
      { 
        id: 'proj_s1', 
        artist_id: 's1', 
        title: 'Street Studies', 
        description: 'Cinematic documentary studies focusing on light, shadow, and raw urban emotion.', 
        discipline: 'Photography',
        cover_image_url: 'https://images.unsplash.com/photo-1554080353-a576cf803bda?q=80&w=1200&fit=crop', 
        items: [], 
        created_at: '' 
      }
    ],
    past_projects: [], reviews: [], review_average: 4.7, review_count: 15, follower_count: 850, project_count: 22,
  },
  osman_malik: {
    user: { id: 'o1', full_name: 'Osman Malik', username: 'osman_malik', city: 'Lahore', avatar_url: '/images/osman_portrait.png', role: 'creative', created_at: '', phone: '' },
    profile: { id: 'p_o1', bio: 'Electronic Music Producer blending traditional sitar with futuristic glitch textures.', disciplines: ['Music', 'Sound Design'], availability: 'available', starting_rate: 80000, verified: true },
    detailed_bio: "Osman Malik is a sound architect based in Lahore. His work, which he calls 'Glitch Heritage', involves sampling classical Pakistani instruments—sitar, rubab, and tabla—and deconstructing them through digital granular synthesis. Osman's live performances are immersive audiovisual experiences that bridge the gap between ancient melody and modern electronics.",
    portfolio: [
      { id: 'port_o1', artist_id: 'o1', title: 'Glitch Heritage', category: 'Digital Art', image_url: '/images/osman_project.png', sort_order: 0, is_hidden: false, created_at: '' },
      { id: 'port_o2', artist_id: 'o1', title: 'Sonic Textures', category: 'Digital Art', image_url: 'https://images.unsplash.com/photo-1514525253344-96467a3608d0?q=80&w=1200&fit=crop', sort_order: 1, is_hidden: false, created_at: '' },
    ], 
    projects: [
      { id: 'proj_o1', artist_id: 'o1', title: 'Sonic Architecture', description: 'Visual studies of sound.', cover_image_url: '/images/osman_project.png', items: [], created_at: '' },
      { id: 'proj_o2', artist_id: 'o1', title: 'Electronic Punjab', description: 'A concept album visualizer.', cover_image_url: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1200&fit=crop', items: [], created_at: '' }
    ],
    past_projects: [], reviews: [], review_average: 4.9, review_count: 21, follower_count: 12000, project_count: 32,
  },
  risograph_khi: {
    user: { id: 'artist_2', full_name: 'Risograph Karachi', username: 'risograph_khi', city: 'Karachi', avatar_url: '/images/riso.png', role: 'creative', created_at: '', phone: '' },
    profile: { id: 'artist_2', bio: 'Independent print studio specializing in risograph techniques.', disciplines: ['Printmaking', 'Visual Arts'], availability: 'available', starting_rate: 15000, verified: true },
    detailed_bio: "Risograph Karachi is a community-focused print lab and experimental studio. We specialize in the unique aesthetic of risograph printing—a process that combines the speed of a photocopier with the tactile quality of screen printing. Our mission is to provide an accessible platform for local zine-makers, illustrators, and activists to bring their physical visions to life.",
    portfolio: [
       { id: 'r1', artist_id: 'artist_2', title: 'Riso Study 01', category: 'Print', image_url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200&fit=crop', sort_order: 0, is_hidden: false, created_at: '' },
       { id: 'r2', artist_id: 'artist_2', title: 'Zine Culture', category: 'Print', image_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=1200&fit=crop', sort_order: 1, is_hidden: false, created_at: '' },
    ], 
    projects: [], past_projects: [], reviews: [], review_average: 5.0, review_count: 8, follower_count: 850, project_count: 12,
  }
};
