// ============================================================
// STAGD — API Client
// Typed Supabase wrappers for all data access.
// Set MOCK_ENABLED = true to work with local mock data.
// ============================================================

import type {
  ArtistPublicProfile,
  ArtistSearchResult,
  Event,
  EventReview,
  EventSearchResult,
  PaginatedResponse,
  VerifyResult,
} from './types';
import { supabase, supabaseAdmin } from './supabase';

const MOCK_ENABLED = false;

// Server-side write proxy — keeps service key out of browser.
async function dbWrite(op: string, params: Record<string, unknown>): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch('/api/db', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({ op, ...params }),
  });
  return res.json();
}

// ════════════════════════════════════════════════════════════
// USERS & PROFILES
// ════════════════════════════════════════════════════════════

export async function getArtistProfile(username: string): Promise<ArtistPublicProfile> {
  if (MOCK_ENABLED) {
    const mock = MOCK_ARTISTS[username.toLowerCase()];
    if (mock) return mock;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id, full_name, username, city, avatar_url, role, created_at, phone,
      profile:artist_profiles(
        id, bio, detailed_bio, disciplines, availability,
        starting_rate, rates_on_request, travel_available, verified,
        featured_item_id, instagram_handle,
        behance_url, website_url, youtube_url, tiktok_url, linkedin_url, twitter_url,
        portfolio:portfolio_items!portfolio_items_artist_id_fkey(
          id, image_url, title, description, category, sort_order, is_hidden, created_at
        ),
        projects(
          id, title, description, discipline, location, format, year, cover_image_url, sort_order, created_at,
          items:project_items(id, image_url, title, description, sort_order)
        )
      ),
      reviews!reviewee_id(
        id, commission_id, event_id, reviewer_id, reviewee_id, rating, body, created_at,
        reviewer:profiles!reviewer_id(id, full_name, username, avatar_url)
      )
    `)
    .eq('username', username)
    .single();

  if (error || !data) return null as unknown as ArtistPublicProfile;

  const { count: followerCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('artist_id', data.id);

  const profile = Array.isArray(data.profile) ? data.profile[0] : data.profile;
  const rawPortfolio = (profile?.portfolio || []) as any[];
  const portfolio = rawPortfolio
    .filter((p: any) => !p.is_hidden)
    .sort((a: any, b: any) => a.sort_order - b.sort_order);
  const rawProjects = (profile?.projects || []) as any[];
  const projects = rawProjects
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
    .map((p: any) => ({
    ...p,
    artist_id: data.id,
    items: (p.items || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
  }));
  const reviews = (data.reviews || [])
    .filter((r: any) => !r.event_id)
    .map((r: any) => ({
      ...r,
      reviewer: Array.isArray(r.reviewer) ? r.reviewer[0] : r.reviewer,
    }));
  const reviewAverage = reviews.length > 0
    ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
    : 0;

  return {
    user: {
      id: data.id,
      full_name: data.full_name,
      username: data.username,
      city: data.city,
      avatar_url: data.avatar_url,
      role: data.role,
      created_at: data.created_at,
      phone: data.phone || '',
    },
    profile: {
      id: profile?.id ?? data.id,
      bio: profile?.bio,
      disciplines: profile?.disciplines || [],
      availability: profile?.availability ?? 'available',
      starting_rate: profile?.starting_rate,
      rates_on_request: profile?.rates_on_request,
      travel_available: profile?.travel_available,
      verified: profile?.verified ?? false,
      instagram_handle: profile?.instagram_handle,
      accent_color: undefined,
    },
    detailed_bio: profile?.detailed_bio,
    social_links: {
      instagram: profile?.instagram_handle,
      behance: profile?.behance_url,
      website: profile?.website_url,
      youtube: profile?.youtube_url,
      tiktok: profile?.tiktok_url,
      linkedin: profile?.linkedin_url,
      twitter: profile?.twitter_url,
    },
    portfolio,
    projects,
    past_projects: [],
    reviews,
    review_average: Math.round(reviewAverage * 10) / 10,
    review_count: reviews.length,
    follower_count: followerCount ?? 0,
    project_count: projects.length,
  };
}

export async function checkUsernameAvailable(username: string, currentUserId: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .neq('id', currentUserId)
    .maybeSingle();
  return !data;
}

export async function uploadAvatar(userId: string, file: File): Promise<{ url: string | null; error: string | null }> {
  const ext = file.name.split('.').pop();
  const path = `${userId}/avatar.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) return { url: null, error: uploadError.message };
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

export async function updateUserProfile(_userId: string, updates: {
  full_name?: string;
  username?: string;
  city?: string | null;
  phone?: string | null;
  avatar_url?: string;
}): Promise<{ error: string | null }> {
  return dbWrite('updateUserProfile', { updates });
}

export async function updateArtistProfile(_userId: string, updates: {
  bio?: string | null;
  detailed_bio?: string | null;
  disciplines?: string[];
  availability?: 'available' | 'busy' | 'unavailable';
  starting_rate?: number | null;
  rates_on_request?: boolean;
  travel_available?: boolean;
  instagram_handle?: string | null;
  behance_url?: string | null;
  website_url?: string | null;
  youtube_url?: string | null;
  tiktok_url?: string | null;
  linkedin_url?: string | null;
  twitter_url?: string | null;
}): Promise<{ error: string | null }> {
  return dbWrite('updateArtistProfile', { updates });
}

// ════════════════════════════════════════════════════════════
// SEARCH — ARTISTS
// ════════════════════════════════════════════════════════════

export async function searchArtists(params?: {
  discipline?: string;
  city?: string;
  sort?: string;
}): Promise<PaginatedResponse<ArtistSearchResult>> {
  if (MOCK_ENABLED) {
    let artists = Object.values(MOCK_ARTISTS);
    if (params?.city && params.city !== 'All')
      artists = artists.filter(a => a.user.city?.toLowerCase() === params.city?.toLowerCase());
    if (params?.discipline && params.discipline !== 'All')
      artists = artists.filter(a => a.profile.disciplines.some(d => d.toLowerCase() === params.discipline?.toLowerCase()));
    return {
      data: artists.map(a => ({ user: a.user, profile: a.profile, review_average: a.review_average, review_count: a.review_count, project_count: a.project_count })),
      total: artists.length, page: 1, per_page: 20, has_more: false,
    };
  }

  let query = supabase
    .from('profiles')
    .select(`
      id, full_name, username, avatar_url, city,
      profile:artist_profiles(disciplines, availability, starting_rate, rates_on_request, verified),
      reviews(rating),
      hero:portfolio_items(image_url)
    `)
    .in('role', ['creative', 'both']);

  if (params?.city && params.city !== 'All') {
    query = query.eq('city', params.city);
  }

  const { data, error } = await query.limit(50);
  if (error) return { data: [], total: 0, page: 1, per_page: 50, has_more: false };

  let results = data || [];

  if (params?.discipline && params.discipline !== 'All') {
    results = results.filter((a: any) =>
      (Array.isArray(a.profile) ? a.profile[0] : a.profile)
        ?.disciplines?.some((d: string) => d.toLowerCase() === params.discipline?.toLowerCase())
    );
  }

  const mapped = results.map((a: any) => {
    const profile = Array.isArray(a.profile) ? a.profile[0] : a.profile;
    const reviews = a.reviews || [];
    const reviewAverage = reviews.length > 0
      ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length
      : 0;
    return {
      user: { id: a.id, full_name: a.full_name, username: a.username, avatar_url: a.avatar_url, city: a.city },
      profile,
      hero_image: a.hero?.[0]?.image_url,
      review_average: Math.round(reviewAverage * 10) / 10,
      review_count: reviews.length,
      project_count: 0,
    };
  });

  return { data: mapped, total: mapped.length, page: 1, per_page: 50, has_more: false };
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
    if (params?.city && params.city !== 'All')
      events = events.filter(e => e.city?.toLowerCase() === params.city?.toLowerCase());
    if (params?.type && params.type !== 'All')
      events = events.filter(e => e.event_type.toLowerCase() === params.type?.toLowerCase());
    if (params?.is_free) events = events.filter(e => e.is_free);
    if (params?.sort === 'Soonest')
      events = events.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
    return {
      data: events.map(e => ({ event: e, organiser: e.organiser })),
      total: events.length, page: 1, per_page: 20, has_more: false,
    };
  }

  let query = supabase
    .from('events')
    .select(`
      *, organiser:profiles!organiser_id(id, full_name, username, avatar_url),
      ticket_tiers(id, name, price, capacity, is_door_only, sort_order)
    `)
    .eq('status', 'live')
    .order('starts_at', { ascending: true });

  if (params?.city && params.city !== 'All') query = query.eq('city', params.city);
  if (params?.type && params.type !== 'All') query = query.eq('event_type', params.type);

  const limit = params?.per_page || 20;
  const { data, error } = await query.limit(limit);
  if (error) return { data: [], total: 0, page: 1, per_page: limit, has_more: false };

  const events = await enrichTiersWithAvailability(data || []);

  return {
    data: events.map(e => ({ event: e, organiser: e.organiser })),
    total: events.length, page: 1, per_page: limit, has_more: false,
  };
}

export async function getEvent(id: string): Promise<Event> {
  if (MOCK_ENABLED) {
    const mock = MOCK_EVENTS[id];
    if (mock) return mock;
  }

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      organiser:profiles!organiser_id(
        id, full_name, username, avatar_url,
        artist_profile:artist_profiles(disciplines)
      ),
      ticket_tiers(id, name, price, capacity, is_door_only, sort_order)
    `)
    .eq('id', id)
    .single();

  if (error || !data) return null as unknown as Event;

  const [enriched] = await enrichTiersWithAvailability([data]);
  const org = Array.isArray(enriched.organiser) ? enriched.organiser[0] : enriched.organiser;
  const artistProfile = Array.isArray(org?.artist_profile) ? org.artist_profile[0] : org?.artist_profile;

  return {
    ...enriched,
    organiser: { id: org.id, full_name: org.full_name, username: org.username, avatar_url: org.avatar_url },
    organiser_disciplines: artistProfile?.disciplines || [],
  };
}

export async function getArtistEvents(organiserId: string): Promise<PaginatedResponse<EventSearchResult>> {
  if (MOCK_ENABLED) {
    const events = Object.values(MOCK_EVENTS).filter(e => e.organiser_id === organiserId);
    return { data: events.map(e => ({ event: e, organiser: e.organiser })), total: events.length, page: 1, per_page: 20, has_more: false };
  }

  const { data, error } = await supabase
    .from('events')
    .select(`
      *, organiser:profiles!organiser_id(id, full_name, username, avatar_url),
      ticket_tiers(id, name, price, capacity, is_door_only, sort_order)
    `)
    .eq('organiser_id', organiserId)
    .eq('status', 'live')
    .order('starts_at', { ascending: true });

  if (error) return { data: [], total: 0, page: 1, per_page: 20, has_more: false };

  const events = await enrichTiersWithAvailability(data || []);
  return {
    data: events.map(e => ({ event: e, organiser: e.organiser })),
    total: events.length, page: 1, per_page: 20, has_more: false,
  };
}

export async function getEventReviews(eventId: string): Promise<EventReview[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, event_id, reviewer_id, rating, body, created_at, reviewer:profiles!reviewer_id(id, full_name, username, avatar_url)')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map((r: any) => ({
    ...r,
    reviewer: Array.isArray(r.reviewer) ? r.reviewer[0] : r.reviewer,
  }));
}

export async function submitEventReview(
  eventId: string,
  rating: number,
  body?: string,
): Promise<{ error: string | null }> {
  return dbWrite('submitEventReview', { eventId, rating, body });
}

// ════════════════════════════════════════════════════════════
// TICKETS
// ════════════════════════════════════════════════════════════

export async function purchaseTicket(
  eventId: string,
  payload: { tier_id: string; quantity: number; buyer_name: string; buyer_email: string; payment_token?: string },
): Promise<{ ticket_id: string; qr_url: string; total_paid: number }> {
  if (MOCK_ENABLED) {
    const ticket_id = `TKT-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    return { ticket_id, qr_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${ticket_id}`, total_paid: 1500 * payload.quantity };
  }

  const { data: tier, error: tierError } = await supabase
    .from('ticket_tiers')
    .select('price, capacity')
    .eq('id', payload.tier_id)
    .single();

  if (tierError || !tier) throw new Error('Ticket tier not found');

  const { count: sold } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('tier_id', payload.tier_id);

  if (tier.capacity > 0 && (sold ?? 0) + payload.quantity > tier.capacity) {
    throw new Error('Not enough spots remaining');
  }

  const ticket_id = `TKT-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const total_paid = tier.price * payload.quantity;
  const qr_url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${ticket_id}`;

  const { error } = await supabase.from('tickets').insert({
    ticket_id,
    event_id: eventId,
    tier_id: payload.tier_id,
    buyer_name: payload.buyer_name,
    buyer_email: payload.buyer_email,
    quantity: payload.quantity,
    total_paid,
    qr_url,
  });

  if (error) throw new Error(`Purchase failed: ${error.message}`);

  return { ticket_id, qr_url, total_paid };
}

export async function verifyTicket(ticketId: string, eventId?: string): Promise<VerifyResult> {
  if (MOCK_ENABLED) {
    if (ticketId === 'TKT-VALID')
      return { status: 'valid', ticket_id: 'TKT-2026-X8392', buyer_name: 'Zia Ahmed', tier_name: 'General Admission', quantity: 1, event_title: 'Sounds of Lyari Festival' };
    return { status: 'not_recognised' };
  }

  const { data, error } = await supabaseAdmin
    .from('tickets')
    .select(`
      id, ticket_id, buyer_name, quantity, scanned_at, event_id,
      tier:ticket_tiers(name),
      event:events(title)
    `)
    .eq('ticket_id', ticketId)
    .single();

  if (error || !data) return { status: 'not_recognised' };

  if (eventId && data.event_id !== eventId) {
    const event = Array.isArray(data.event) ? data.event[0] : data.event;
    return { status: 'wrong_event', event_title: event?.title };
  }

  const tier = Array.isArray(data.tier) ? data.tier[0] : data.tier;
  const event = Array.isArray(data.event) ? data.event[0] : data.event;

  if (data.scanned_at) {
    return {
      status: 'already_used',
      ticket_id: data.ticket_id,
      buyer_name: data.buyer_name,
      tier_name: tier?.name,
      quantity: data.quantity,
      event_title: event?.title,
      scanned_at: data.scanned_at,
    };
  }

  await supabaseAdmin
    .from('tickets')
    .update({ scanned_at: new Date().toISOString() })
    .eq('ticket_id', ticketId);

  return {
    status: 'valid',
    ticket_id: data.ticket_id,
    buyer_name: data.buyer_name,
    tier_name: tier?.name,
    quantity: data.quantity,
    event_title: event?.title,
  };
}

// ════════════════════════════════════════════════════════════
// MESSAGES
// ════════════════════════════════════════════════════════════

export interface Conversation {
  commissionId: string;
  status: string;
  briefWhat: string | null;
  otherParty: { id: string; full_name: string; username: string; avatar_url: string | null };
  lastMessage: string;
  lastMessageAt: string;
}

export interface Message {
  id: string;
  body: string;
  type: string;
  sender_id: string;
  created_at: string;
  attachment_url?: string | null;
  attachment_type?: string | null; // 'image' | 'audio' | 'video'
  attachment_name?: string | null;
  attachment_size?: number | null;
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  const { data: commissions, error } = await supabase
    .from('commissions')
    .select('id, status, brief_what, client_id, artist_id, created_at, client:profiles!client_id(id, full_name, username, avatar_url)')
    .or(`client_id.eq.${userId},artist_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error || !commissions?.length) return [];

  // Collect all "other party" IDs (artist_id when user is client, client_id when user is artist)
  const otherIds = commissions.map(c => c.client_id === userId ? c.artist_id : c.client_id);
  const { data: otherProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url')
    .in('id', otherIds);

  const profileMap: Record<string, any> = {};
  (otherProfiles || []).forEach(p => { profileMap[p.id] = p; });

  // Get last message per commission
  const ids = commissions.map(c => c.id);
  const { data: msgs } = await supabase
    .from('messages')
    .select('commission_id, body, created_at')
    .in('commission_id', ids)
    .order('created_at', { ascending: false });

  const lastMsg: Record<string, any> = {};
  (msgs || []).forEach(m => { if (!lastMsg[m.commission_id]) lastMsg[m.commission_id] = m; });

  const all = commissions.map(c => {
    const otherId = c.client_id === userId ? c.artist_id : c.client_id;
    const other = profileMap[otherId] || { id: otherId, full_name: 'Unknown', username: '', avatar_url: null };
    const lm = lastMsg[c.id];
    return {
      commissionId: c.id,
      status: c.status,
      briefWhat: c.brief_what,
      otherParty: other,
      lastMessage: lm?.body ?? c.brief_what ?? 'Commission enquiry',
      lastMessageAt: lm?.created_at ?? c.created_at,
    };
  });

  // Sort by most recent activity, then deduplicate by the other user — one thread per person
  all.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  const seen = new Set<string>();
  return all.filter(c => {
    if (seen.has(c.otherParty.id)) return false;
    seen.add(c.otherParty.id);
    return true;
  });
}

export async function getMessages(commissionId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, body, type, sender_id, created_at, attachment_url, attachment_type, attachment_name, attachment_size')
    .eq('commission_id', commissionId)
    .order('created_at', { ascending: true });
  if (error) return [];
  return data || [];
}

export async function sendMessage(
  commissionId: string,
  senderId: string,
  body: string,
  attachment?: { url: string; type: string; name: string; size: number } | null,
): Promise<Message | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      commission_id: commissionId,
      sender_id: senderId,
      body,
      type: 'text',
      attachment_url: attachment?.url ?? null,
      attachment_type: attachment?.type ?? null,
      attachment_name: attachment?.name ?? null,
      attachment_size: attachment?.size ?? null,
    })
    .select('id, body, type, sender_id, created_at, attachment_url, attachment_type, attachment_name, attachment_size')
    .single();
  if (error) throw error;
  return data;
}

export async function uploadMessageAttachment(file: File, userId: string): Promise<string> {
  // Ensure session is loaded so the storage request includes the auth header
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated. Please log in again.');

  const ext = file.name.split('.').pop() ?? 'bin';
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from('message-attachments')
    .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
  if (error) {
    const msg = typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : JSON.stringify(error);
    throw new Error(`Upload failed: ${msg}`);
  }
  const { data } = supabase.storage.from('message-attachments').getPublicUrl(path);
  return data.publicUrl;
}

// ════════════════════════════════════════════════════════════
// COMMISSIONS
// ════════════════════════════════════════════════════════════

export async function submitCommission(
  artistProfileId: string,
  clientId: string,
  data: {
    discipline: string;
    deliverable: string;
    brief: string;
    deadline: string;
    duration: string;
    budget: number;
  }
): Promise<string> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Commission request timed out. Please try again.')), 12000)
  );
  const insert = supabase
    .from('commissions')
    .insert({
      artist_id: artistProfileId,
      client_id: clientId,
      status: 'enquiry',
      brief_what: `${data.discipline}: ${data.deliverable}${data.brief ? '\n\n' + data.brief : ''}`,
      brief_budget: `PKR ${data.budget.toLocaleString()}`,
      brief_timeline: `${data.deadline} (${data.duration})`,
    })
    .select('id')
    .single()
    .then(({ data: row, error }) => {
      if (error) throw error;
      return row.id as string;
    });
  return Promise.race([insert, timeout]);
}

// ════════════════════════════════════════════════════════════
// FOLLOW SYSTEM
// ════════════════════════════════════════════════════════════

export async function followArtist(artistId: string, followerId: string): Promise<void> {
  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, artist_id: artistId });
  if (error) throw error;
}

export async function unfollowArtist(artistId: string, followerId: string): Promise<void> {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('artist_id', artistId);
  if (error) throw error;
}

export async function isFollowing(artistId: string, followerId: string): Promise<boolean> {
  const { count } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', followerId)
    .eq('artist_id', artistId);
  return (count ?? 0) > 0;
}

export async function getFollowerCount(artistId: string): Promise<number> {
  const { count } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('artist_id', artistId);
  return count ?? 0;
}

// ════════════════════════════════════════════════════════════
// PORTFOLIO & PROJECT MANAGEMENT
// ════════════════════════════════════════════════════════════

export async function getMyPortfolio(artistId: string): Promise<import('./types').PortfolioItem[]> {
  const { data, error } = await supabase
    .from('portfolio_items')
    .select('id, image_url, title, description, category, sort_order, is_hidden, created_at')
    .eq('artist_id', artistId)
    .eq('is_hidden', false)
    .order('sort_order', { ascending: true });
  if (error) return [];
  return data || [];
}

export async function updatePortfolioItem(
  _itemId: string,
  updates: { title?: string; description?: string },
): Promise<{ error: string | null }> {
  return dbWrite('syncItemMetadata', { imageUrl: _itemId, updates });
}

export async function updateProjectItem(
  _itemId: string,
  updates: { title?: string; description?: string },
): Promise<{ error: string | null }> {
  return dbWrite('syncItemMetadata', { imageUrl: _itemId, updates });
}

export async function syncItemMetadataByUrl(
  imageUrl: string,
  updates: { title?: string; description?: string },
): Promise<void> {
  await dbWrite('syncItemMetadata', { imageUrl, updates });
}

export async function uploadPortfolioImage(
  artistId: string,
  file: File,
  title?: string,
  category?: string,
): Promise<{ item: import('./types').PortfolioItem | null; error: string | null }> {
  const ext = file.name.split('.').pop();
  const path = `${artistId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from('portfolio')
    .upload(path, file, { upsert: false, contentType: file.type });
  if (uploadError) return { item: null, error: uploadError.message };
  const { data: urlData } = supabase.storage.from('portfolio').getPublicUrl(path);

  const { count } = await supabase
    .from('portfolio_items')
    .select('*', { count: 'exact', head: true })
    .eq('artist_id', artistId);

  const { data, error } = await supabase
    .from('portfolio_items')
    .insert({ artist_id: artistId, image_url: urlData.publicUrl, title, category, sort_order: count ?? 0 })
    .select('id, image_url, title, category, sort_order, is_hidden, created_at')
    .single();
  if (error) return { item: null, error: error.message };
  return { item: data, error: null };
}

export async function deletePortfolioItem(itemId: string): Promise<{ error: string | null }> {
  return dbWrite('deletePortfolioItem', { itemId });
}

export async function getMyProjects(artistId: string): Promise<import('./types').Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('id, title, description, discipline, location, format, year, cover_image_url, sort_order, created_at, items:project_items(id, image_url, title, description, sort_order)')
    .eq('artist_id', artistId)
    .order('sort_order', { ascending: true });
  if (error) return [];
  return (data || []).map((p: any) => ({
    ...p,
    artist_id: artistId,
    items: (p.items || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
  }));
}

export async function createProject(
  _artistId: string,
  data: { title: string; description?: string; discipline?: string; location?: string; format?: string; year?: number },
): Promise<{ project: import('./types').Project | null; error: string | null }> {
  return dbWrite('createProject', { data });
}

export async function addImageToProject(
  projectId: string,
  artistId: string,
  file: File,
  title?: string,
): Promise<{ imageUrl: string | null; error: string | null }> {
  const ext = file.name.split('.').pop();
  const path = `${artistId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from('portfolio')
    .upload(path, file, { upsert: false, contentType: file.type });
  if (uploadError) return { imageUrl: null, error: uploadError.message };
  const { data: urlData } = supabase.storage.from('portfolio').getPublicUrl(path);
  const imageUrl = urlData.publicUrl;

  const { count: portCount } = await supabase
    .from('portfolio_items')
    .select('*', { count: 'exact', head: true })
    .eq('artist_id', artistId);
  const { count: projCount } = await supabase
    .from('project_items')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);

  const result = await dbWrite('addImageToProject', { projectId, artistId, imageUrl, title, portCount, projCount });
  return { imageUrl: result.error ? null : imageUrl, error: result.error ?? null };
}

export async function deleteProject(projectId: string): Promise<{ error: string | null }> {
  return dbWrite('deleteProject', { projectId });
}

export async function linkPortfolioItemToProject(
  projectId: string,
  items: { image_url: string; title?: string }[],
): Promise<{ error: string | null }> {
  return dbWrite('linkPortfolioItemToProject', { projectId, items });
}

export async function updateProject(
  projectId: string,
  updates: {
    title?: string;
    description?: string | null;
    discipline?: string | null;
    location?: string | null;
    format?: string | null;
    year?: number | null;
  },
): Promise<{ error: string | null }> {
  return dbWrite('updateProject', { projectId, updates });
}

export async function updateProjectCover(
  projectId: string,
  coverImageUrl: string,
): Promise<{ error: string | null }> {
  return dbWrite('updateProjectCover', { projectId, coverImageUrl });
}

export async function removeImageFromProject(
  _projectId: string,
  itemId: string,
): Promise<{ error: string | null }> {
  return dbWrite('removeImageFromProject', { itemId });
}

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

async function enrichTiersWithAvailability(events: any[]): Promise<any[]> {
  if (!events.length) return [];

  const allTierIds = events.flatMap(e => (e.ticket_tiers || []).map((t: any) => t.id));

  let soldByTier: Record<string, number> = {};
  if (allTierIds.length > 0) {
    const { data: tickets } = await supabase
      .from('tickets')
      .select('tier_id, quantity')
      .in('tier_id', allTierIds);

    soldByTier = (tickets || []).reduce((acc: Record<string, number>, t: any) => {
      acc[t.tier_id] = (acc[t.tier_id] || 0) + t.quantity;
      return acc;
    }, {});
  }

  return events.map(e => {
    const tiers = (e.ticket_tiers || [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((t: any) => ({
        ...t,
        event_id: e.id,
        spots_remaining: t.capacity > 0 ? Math.max(0, t.capacity - (soldByTier[t.id] || 0)) : 0,
      }));

    const prices = tiers.map((t: any) => t.price);
    return {
      ...e,
      ticket_tiers: tiers,
      min_price: prices.length ? Math.min(...prices) : 0,
      is_free: tiers.length === 0 || tiers.every((t: any) => t.price === 0),
      is_sold_out: tiers.length > 0 && tiers.every((t: any) => t.capacity > 0 && t.spots_remaining === 0),
    };
  });
}

// ════════════════════════════════════════════════════════════
// MOCK DATA (kept for MOCK_ENABLED = true)
// ════════════════════════════════════════════════════════════

const MOCK_EVENTS: Record<string, Event> = {
  event_1: {
    id: 'event_1', organiser_id: 'osman_malik',
    organiser: { id: 'osman_malik', full_name: 'Osman Malik', username: 'osman_malik', avatar_url: '/images/osman_portrait.png' },
    organiser_disciplines: ['Music', 'Sound Design'],
    title: 'Glitch Heritage Live',
    description: 'An immersive live set blending granular synthesis with classical sitar and tabla samples.',
    event_type: 'concert', cover_image_url: '/images/osman_project.png',
    venue_name: 'The Grid Lahore', city: 'Lahore',
    starts_at: '2026-05-12T20:00:00+05:00', doors_at: '2026-05-12T19:00:00+05:00',
    status: 'live', created_at: '',
    ticket_tiers: [
      { id: 'ga', event_id: 'event_1', name: 'General Admission', price: 1500, capacity: 200, spots_remaining: 42, is_door_only: false, sort_order: 0 },
      { id: 'vip', event_id: 'event_1', name: 'VIP — Front Rows', price: 3500, capacity: 40, spots_remaining: 8, is_door_only: false, sort_order: 1 },
    ],
    min_price: 1500, is_free: false, is_sold_out: false,
  },
  event_2: {
    id: 'event_2', organiser_id: 'hamza_qureshi',
    organiser: { id: 'hamza_qureshi', full_name: 'Hamza Qureshi', username: 'hamza_qureshi', avatar_url: '/images/hamza_portrait.png' },
    organiser_disciplines: ['Calligraphy', 'Visual Arts'],
    title: 'Modern Qalam Workshop', description: 'A hands-on calligraphy workshop.',
    event_type: 'workshop', cover_image_url: '/images/hamza_project.png',
    venue_name: 'Stagd Studio Karachi', city: 'Karachi',
    starts_at: '2026-05-14T14:00:00+05:00', doors_at: '2026-05-14T13:30:00+05:00',
    status: 'live', created_at: '',
    ticket_tiers: [{ id: 'ws', event_id: 'event_2', name: 'Workshop Seat', price: 3500, capacity: 20, spots_remaining: 5, is_door_only: false, sort_order: 0 }],
    min_price: 3500, is_free: false, is_sold_out: false,
  },
  event_3: {
    id: 'event_3', organiser_id: 'bilal_ahmed',
    organiser: { id: 'bilal_ahmed', full_name: 'Bilal Ahmed', username: 'bilal_ahmed', avatar_url: '/images/bilal_portrait.png' },
    title: 'Street Jam Karachi', event_type: 'workshop', cover_image_url: '/images/bilal_project.png',
    venue_name: 'Lyari Public Walls', city: 'Karachi',
    starts_at: '2026-05-20T17:00:00Z', status: 'live', created_at: '',
    ticket_tiers: [], min_price: 0, is_free: true, is_sold_out: false,
  },
};

const MOCK_ARTISTS: Record<string, ArtistPublicProfile> = {
  mairaj_ulhaq: {
    user: { id: 'm1', full_name: 'Mairaj Ulhaq', username: 'mairaj_ulhaq', city: 'Karachi', avatar_url: '/images/mairaj_ulhaq.png', role: 'creative', created_at: '2021-01-01', phone: '' },
    profile: { id: 'p_m1', bio: 'Editorial Photographer and Product specialist based in Karachi.', disciplines: ['Photography', 'Marketing Content'], availability: 'available', starting_rate: 65000, verified: true },
    detailed_bio: "Mairaj Ulhaq is a commercial photographer with over a decade of experience.",
    portfolio: [
      { id: 'port_m1', artist_id: 'm1', title: 'Fragrance Study', category: 'Product', image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1200&fit=crop', sort_order: 0, is_hidden: false, created_at: '' },
      { id: 'port_m2', artist_id: 'm1', title: 'Watch Details', category: 'Product', image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1200&fit=crop', sort_order: 1, is_hidden: false, created_at: '' },
    ],
    projects: [
      { id: 'proj_m1', artist_id: 'm1', title: 'Commercial Series', description: 'A study in minimalist luxury branding.', discipline: 'Product Photography', cover_image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1200&fit=crop', items: [], created_at: '' },
    ],
    past_projects: [], reviews: [], review_average: 4.9, review_count: 12, follower_count: 2400, project_count: 32,
  },
  hamza_qureshi: {
    user: { id: 'h1', full_name: 'Hamza Qureshi', username: 'hamza_qureshi', city: 'Karachi', avatar_url: '/images/hamza_portrait.png', role: 'creative', created_at: '', phone: '' },
    profile: { id: 'p_h1', bio: 'Contemporary Calligrapher.', disciplines: ['Calligraphy', 'Visual Arts'], availability: 'available', starting_rate: 45000, verified: true },
    detailed_bio: "Hamza Qureshi is a Karachi-based visual artist.",
    portfolio: [
      { id: 'port_h1', artist_id: 'h1', title: 'Golden Scripts', category: 'Calligraphy', image_url: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=1200&fit=crop', sort_order: 0, is_hidden: false, created_at: '' },
    ],
    projects: [], past_projects: [], reviews: [], review_average: 4.9, review_count: 24, follower_count: 1200, project_count: 12,
  },
};
