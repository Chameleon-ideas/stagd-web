// ============================================================
// STAGD — API Client
// Typed Supabase wrappers for all data access.
// ============================================================

import type {
  ArtistPublicProfile,
  ArtistSearchResult,
  CommissionDetails,
  Event,
  EventReview,
  EventSearchResult,
  PaginatedResponse,
  Proposal,
  VerifyResult,
} from './types';
import { supabase, supabaseAdmin } from './supabase';

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
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id, full_name, username, city, avatar_url, role, created_at, phone,
      profile:artist_profiles(
        id, bio, detailed_bio, disciplines, availability, available_from,
        starting_rate, rates_on_request, travel_available, verified,
        featured_item_id, instagram_handle,
        invoice_auto_send, bank_account_title, bank_name, bank_account_number, bank_iban,
        behance_url, website_url, youtube_url, tiktok_url, linkedin_url, twitter_url,
        portfolio:portfolio_items!portfolio_items_artist_id_fkey(
          id, image_url, title, description, category, sort_order, is_hidden, created_at
        ),
        projects(
          id, title, description, discipline, location, format, year, cover_image_url, sort_order, created_at,
          items:project_items(id, image_url, title, description, sort_order)
        )
      ),
      reviews!reviews_reviewee_id_fkey(
        id, commission_id, event_id, reviewer_id, reviewee_id, rating, body, created_at,
        reviewer:profiles!reviews_reviewer_id_fkey(id, full_name, username, avatar_url)
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
      available_from: profile?.available_from ?? undefined,
      starting_rate: profile?.starting_rate,
      rates_on_request: profile?.rates_on_request,
      travel_available: profile?.travel_available,
      verified: profile?.verified ?? false,
      is_public: (profile as any)?.is_public ?? true,
      instagram_handle: profile?.instagram_handle,
      accent_color: undefined,
      invoice_auto_send: profile?.invoice_auto_send ?? true,
      bank_account_title: profile?.bank_account_title ?? undefined,
      bank_name: profile?.bank_name ?? undefined,
      bank_account_number: profile?.bank_account_number ?? undefined,
      bank_iban: profile?.bank_iban ?? undefined,
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
  role?: import('./types').UserRole;
}): Promise<{ error: string | null }> {
  return dbWrite('updateUserProfile', { updates });
}

export async function updateArtistProfile(_userId: string, updates: {
  bio?: string | null;
  detailed_bio?: string | null;
  disciplines?: string[];
  availability?: 'available' | 'busy' | 'unavailable';
  available_from?: string | null;
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
  invoice_auto_send?: boolean;
  bank_account_title?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_iban?: string | null;
  is_public?: boolean;
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
  query?: string;
}): Promise<PaginatedResponse<ArtistSearchResult>> {


  let query = supabase
    .from('profiles')
    .select(`
      id, full_name, username, avatar_url, city,
      profile:artist_profiles(disciplines, availability, starting_rate, rates_on_request, verified),
      reviews!reviews_reviewee_id_fkey(rating)
    `)
    .in('role', ['creative', 'both']);

  // TODO: uncomment after running: ALTER TABLE artist_profiles ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;
  // query = query.filter('profile.is_public', 'eq', true);

  if (params?.city && params.city !== 'All') {
    query = query.eq('city', params.city);
  }

  if (params?.query?.trim()) {
    const q = params.query.trim();
    query = query.or(`full_name.ilike.%${q}%,username.ilike.%${q}%`);
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
  query?: string;
}): Promise<PaginatedResponse<EventSearchResult>> {


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
  if (params?.query?.trim()) query = query.ilike('title', `%${params.query.trim()}%`);

  const limit = params?.per_page || 20;
  const { data, error } = await query.limit(limit);
  if (error) return { data: [], total: 0, page: 1, per_page: limit, has_more: false };

  const events = await enrichTiersWithAvailability(data || []);

  return {
    data: events.map(e => ({ event: e, organiser: e.organiser })),
    total: events.length, page: 1, per_page: limit, has_more: false,
  };
}

export async function getEvent(idOrSlug: string): Promise<Event> {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  const select = `
    *,
    organiser:profiles!organiser_id(
      id, full_name, username, avatar_url,
      artist_profile:artist_profiles(disciplines)
    ),
    ticket_tiers(id, name, price, capacity, is_door_only, sort_order)
  `;
  const { data, error } = isUUID
    ? await supabase.from('events').select(select).eq('id', idOrSlug).single()
    : await supabase.from('events').select(select).eq('slug', idOrSlug).single();

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
    .select('id, event_id, reviewer_id, rating, body, created_at, reviewer:profiles!reviews_reviewer_id_fkey(id, full_name, username, avatar_url)')
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
  return dbWrite('verifyTicket', { ticketId, eventId });
}

export async function getRecentScans(eventId?: string): Promise<(VerifyResult & { scanned_at: string })[]> {
  const { scans } = await dbWrite('getRecentScans', { eventId, limit: 30 });
  return scans ?? [];
}

// ════════════════════════════════════════════════════════════
// MESSAGES
// ════════════════════════════════════════════════════════════

export interface Conversation {
  commissionId: string;
  status: string;
  paymentStatus: string;
  briefWhat: string | null;
  clientId: string;
  artistId: string;
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

export async function hideConversation(commissionId: string, userId: string): Promise<void> {
  await supabase.rpc('hide_commission_for_user', { p_commission_id: commissionId, p_user_id: userId });
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  const { data: commissions, error } = await supabase
    .from('commissions')
    .select('id, status, payment_status, brief_what, client_id, artist_id, created_at, hidden_for, client:profiles!client_id(id, full_name, username, avatar_url)')
    .or(`client_id.eq.${userId},artist_id.eq.${userId}`)
    .not('hidden_for', 'cs', `{${userId}}`)
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
      paymentStatus: c.payment_status ?? 'unpaid',
      briefWhat: c.brief_what,
      clientId: c.client_id,
      artistId: c.artist_id,
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
  _clientId: string,
  data: {
    discipline: string;
    deliverable: string;
    brief: string;
    deadline: string;
    duration: string;
    budget: number;
    referenceImageUrl?: string;
  }
): Promise<string> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Commission request timed out. Please try again.')), 12000)
  );
  const insert = dbWrite('submitCommission', { artistProfileId, data })
    .then((res: any) => {
      if (res.error) throw new Error(res.error);
      return res.id as string;
    });
  return Promise.race([insert, timeout]);
}

export async function uploadBriefReference(
  userId: string,
  file: File,
): Promise<{ url: string | null; error: string | null }> {
  const ext = file.name.split('.').pop();
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const uploadTimeout = new Promise<{ url: null; error: string }>((resolve) =>
    setTimeout(() => resolve({ url: null, error: 'Upload timed out' }), 10000)
  );
  const uploadWork = supabase.storage
    .from('brief-references')
    .upload(path, file, { upsert: false, contentType: file.type })
    .then(({ error: uploadError }) => {
      if (uploadError) return { url: null, error: uploadError.message };
      const { data } = supabase.storage.from('brief-references').getPublicUrl(path);
      return { url: data.publicUrl, error: null };
    });
  return Promise.race([uploadWork, uploadTimeout]);
}

export async function getCommissionDetails(commissionId: string): Promise<CommissionDetails | null> {
  const { data, error } = await supabase
    .from('commissions')
    .select(`
      id, client_id, artist_id, status, payment_status,
      brief_discipline, brief_deliverable, brief_description,
      brief_deadline, brief_duration, brief_budget_amount, brief_reference,
      brief_what, completion_requested_by, created_at
    `)
    .eq('id', commissionId)
    .single();
  if (error || !data) return null;
  return data as CommissionDetails;
}

export async function getProposalsForCommission(commissionId: string): Promise<Proposal[]> {
  const { data, error } = await supabase
    .from('proposals')
    .select('id, commission_id, title, description, total_price, deposit_amount, delivery_date, revisions, deliverables, status, version, created_at')
    .eq('commission_id', commissionId)
    .order('version', { ascending: true });
  if (error || !data) return [];
  return data as Proposal[];
}

export async function sendProposal(
  commissionId: string,
  _senderId: string,
  data: {
    title: string;
    description?: string;
    total_price: number;
    deposit_amount?: number;
    delivery_date?: string;
    revisions?: number;
    deliverables?: string;
    version: number;
  },
): Promise<{ proposalId: string | null; error: string | null }> {
  return dbWrite('sendProposal', { commissionId, data });
}

export async function acceptProposal(
  commissionId: string,
  proposalId: string,
): Promise<{ error: string | null }> {
  return dbWrite('acceptProposal', { commissionId, proposalId });
}

export async function declineProposal(
  commissionId: string,
  proposalId: string,
): Promise<{ error: string | null }> {
  return dbWrite('declineProposal', { commissionId, proposalId });
}

export async function updatePaymentStatus(
  commissionId: string,
  status: 'partially_paid' | 'fully_paid',
): Promise<{ error: string | null }> {
  return dbWrite('updatePaymentStatus', { commissionId, status });
}

export async function updateCommissionStatus(
  commissionId: string,
  status: 'delivered' | 'completed',
): Promise<{ error: string | null }> {
  return dbWrite('updateCommissionStatus', { commissionId, status });
}

export async function requestCompletion(
  commissionId: string,
): Promise<{ error: string | null }> {
  return dbWrite('requestCompletion', { commissionId });
}

export async function confirmCompletion(
  commissionId: string,
): Promise<{ error: string | null }> {
  return dbWrite('confirmCompletion', { commissionId });
}

export async function rejectCompletion(
  commissionId: string,
): Promise<{ error: string | null }> {
  return dbWrite('rejectCompletion', { commissionId });
}

export async function sendInvoice(
  commissionId: string,
): Promise<{ invoiceNumber: string | null; error: string | null }> {
  return dbWrite('sendInvoice', { commissionId });
}

export async function submitCommissionReview(
  commissionId: string,
  revieweeId: string,
  rating: number,
  body?: string,
): Promise<{ error: string | null }> {
  return dbWrite('submitCommissionReview', { commissionId, revieweeId, rating, body });
}

export async function insertSystemMessage(
  commissionId: string,
  senderId: string,
  body: string,
): Promise<void> {
  await supabase.from('messages').insert({
    commission_id: commissionId,
    sender_id: senderId,
    body,
    type: 'status_update',
  });
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

export async function reorderProjects(projectIds: string[]): Promise<{ error: string | null }> {
  return dbWrite('reorderProjects', { projectIds });
}

export async function reorderProjectItems(itemIds: string[]): Promise<{ error: string | null }> {
  return dbWrite('reorderProjectItems', { itemIds });
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

export async function deleteAccount(): Promise<{ error: string | null }> {
  return dbWrite('deleteAccount', {});
}

export async function submitReport(
  reportedUserId: string,
  commissionId: string | null,
  reason: string,
): Promise<{ error: string | null }> {
  return dbWrite('submitReport', { reportedUserId, commissionId, reason });
}

