import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabaseAdmin: SupabaseClient | null = null;
function getAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _supabaseAdmin;
}
// alias used throughout this file
const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    return (getAdmin() as any)[prop];
  },
});

// Verify the caller's JWT and return their user ID.
async function getUserId(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  return user?.id ?? null;
}

// POST /api/db — single endpoint for all owner-gated writes.
// Body: { op, ...params }
export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { op } = body;

  try {
    switch (op) {
      case 'updateUserProfile': {
        const { updates } = body;
        const { error } = await supabaseAdmin.from('profiles').update(updates).eq('id', userId);
        return NextResponse.json({ error: error?.message ?? null });
      }
      case 'updateArtistProfile': {
        const { updates } = body;
        const { error } = await supabaseAdmin.from('artist_profiles').update(updates).eq('id', userId);
        return NextResponse.json({ error: error?.message ?? null });
      }
      case 'updateProject': {
        const { projectId, updates } = body;
        const { error } = await supabaseAdmin.from('projects').update(updates).eq('id', projectId).eq('artist_id', userId);
        return NextResponse.json({ error: error?.message ?? null });
      }
      case 'updateProjectCover': {
        const { projectId, coverImageUrl } = body;
        const { error } = await supabaseAdmin.from('projects').update({ cover_image_url: coverImageUrl }).eq('id', projectId).eq('artist_id', userId);
        return NextResponse.json({ error: error?.message ?? null });
      }
      case 'createProject': {
        const { data } = body;
        const { count } = await supabaseAdmin.from('projects').select('*', { count: 'exact', head: true }).eq('artist_id', userId);
        const { data: row, error } = await supabaseAdmin
          .from('projects')
          .insert({ artist_id: userId, ...data, cover_image_url: '', sort_order: count ?? 0 })
          .select('id, title, description, discipline, location, format, year, cover_image_url, sort_order, created_at')
          .single();
        return NextResponse.json({ project: row ? { ...row, artist_id: userId, items: [] } : null, error: error?.message ?? null });
      }
      case 'deleteProject': {
        const { projectId } = body;
        const { error } = await supabaseAdmin.from('projects').delete().eq('id', projectId).eq('artist_id', userId);
        return NextResponse.json({ error: error?.message ?? null });
      }
      case 'deletePortfolioItem': {
        const { itemId } = body;
        const { error } = await supabaseAdmin.from('portfolio_items').delete().eq('id', itemId).eq('artist_id', userId);
        return NextResponse.json({ error: error?.message ?? null });
      }
      case 'syncItemMetadata': {
        const { imageUrl, updates } = body;
        await Promise.all([
          supabaseAdmin.from('portfolio_items').update(updates).eq('image_url', imageUrl).eq('artist_id', userId),
          supabaseAdmin.from('project_items').update(updates).eq('image_url', imageUrl),
        ]);
        return NextResponse.json({ error: null });
      }
      case 'linkPortfolioItemToProject': {
        const { projectId, items } = body;
        const { count } = await supabaseAdmin.from('project_items').select('*', { count: 'exact', head: true }).eq('project_id', projectId);
        const rows = items.map((item: any, i: number) => ({
          project_id: projectId,
          image_url: item.image_url,
          title: item.title,
          sort_order: (count ?? 0) + i,
        }));
        const { error } = await supabaseAdmin.from('project_items').insert(rows);
        if (!error && (count ?? 0) === 0 && items.length > 0) {
          await supabaseAdmin.from('projects').update({ cover_image_url: items[0].image_url }).eq('id', projectId);
        }
        return NextResponse.json({ error: error?.message ?? null });
      }
      case 'removeImageFromProject': {
        const { itemId } = body;
        const { error } = await supabaseAdmin.from('project_items').delete().eq('id', itemId);
        return NextResponse.json({ error: error?.message ?? null });
      }
      case 'addImageToProject': {
        const { projectId, artistId, imageUrl, title, portCount, projCount } = body;
        const [portResult, projResult] = await Promise.all([
          supabaseAdmin.from('portfolio_items').insert({ artist_id: artistId, image_url: imageUrl, title, sort_order: portCount ?? 0 }),
          supabaseAdmin.from('project_items').insert({ project_id: projectId, image_url: imageUrl, title, sort_order: projCount ?? 0 }),
        ]);
        if ((projCount ?? 0) === 0) {
          await supabaseAdmin.from('projects').update({ cover_image_url: imageUrl }).eq('id', projectId);
        }
        const err = portResult.error || projResult.error;
        return NextResponse.json({ error: err?.message ?? null });
      }
      case 'createEvent': {
        const { eventData, tiers, doorStaff } = body;
        console.log('[createEvent] inserting event:', eventData.title, 'for user:', userId);
        const { data: event, error: eventError } = await supabaseAdmin
          .from('events')
          .insert({ ...eventData, organiser_id: userId, status: 'live' })
          .select('id')
          .single();
        if (eventError || !event) {
          console.error('[createEvent] event insert error:', eventError?.message);
          return NextResponse.json({ error: eventError?.message ?? 'Failed to create event' });
        }
        console.log('[createEvent] event created:', event.id);
        if (tiers?.length > 0) {
          const { error: tiersError } = await supabaseAdmin
            .from('ticket_tiers')
            .insert(tiers.map((t: any, i: number) => ({ ...t, event_id: event.id, sort_order: i })));
          if (tiersError) {
            console.error('[createEvent] tiers insert error:', tiersError.message);
            return NextResponse.json({ error: tiersError.message });
          }
        }
        if (doorStaff?.length > 0) {
          console.log('[createEvent] inserting door staff:', doorStaff);
          await insertDoorStaff(supabaseAdmin, event.id, doorStaff);
        }
        console.log('[createEvent] done, returning eventId:', event.id);
        return NextResponse.json({ eventId: event.id, error: null });
      }
      case 'saveDraftEvent': {
        const { eventData, tiers } = body;
        const placeholder = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
        const { data: event, error: eventError } = await supabaseAdmin
          .from('events')
          .insert({
            ...eventData,
            organiser_id: userId,
            status: 'draft',
            starts_at: eventData.starts_at ?? placeholder,
          })
          .select('id')
          .single();
        if (eventError || !event) return NextResponse.json({ error: eventError?.message ?? 'Failed to save draft' });
        if (tiers?.length > 0) {
          await supabaseAdmin
            .from('ticket_tiers')
            .insert(tiers.map((t: any, i: number) => ({ ...t, event_id: event.id, sort_order: i })));
        }
        return NextResponse.json({ eventId: event.id, error: null });
      }
      case 'updateDraftEvent': {
        const { eventId, eventData, tiers } = body;
        const placeholder = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
        const { error: updateError } = await supabaseAdmin
          .from('events')
          .update({ ...eventData, starts_at: eventData.starts_at ?? placeholder })
          .eq('id', eventId)
          .eq('organiser_id', userId);
        if (updateError) return NextResponse.json({ error: updateError.message });
        // Replace tiers
        await supabaseAdmin.from('ticket_tiers').delete().eq('event_id', eventId);
        if (tiers?.length > 0) {
          await supabaseAdmin
            .from('ticket_tiers')
            .insert(tiers.map((t: any, i: number) => ({ ...t, event_id: eventId, sort_order: i })));
        }
        return NextResponse.json({ eventId, error: null });
      }
      case 'publishDraftEvent': {
        const { eventId, eventData, tiers, doorStaff } = body;
        const { error: updateError } = await supabaseAdmin
          .from('events')
          .update({ ...eventData, status: 'live' })
          .eq('id', eventId)
          .eq('organiser_id', userId);
        if (updateError) return NextResponse.json({ error: updateError.message });
        await supabaseAdmin.from('ticket_tiers').delete().eq('event_id', eventId);
        if (tiers?.length > 0) {
          await supabaseAdmin
            .from('ticket_tiers')
            .insert(tiers.map((t: any, i: number) => ({ ...t, event_id: eventId, sort_order: i })));
        }
        if (doorStaff?.length > 0) {
          await supabaseAdmin.from('door_staff').delete().eq('event_id', eventId);
          await insertDoorStaff(supabaseAdmin, eventId, doorStaff);
        }
        return NextResponse.json({ eventId, error: null });
      }
      case 'getMyDraftEvents': {
        const { data, error } = await supabaseAdmin
          .from('events')
          .select('id, title, event_type, city, venue_name, starts_at, created_at, updated_at')
          .eq('organiser_id', userId)
          .eq('status', 'draft')
          .order('updated_at', { ascending: false });
        return NextResponse.json({ drafts: data ?? [], error: error?.message ?? null });
      }
      case 'getDraftEventById': {
        const { eventId } = body;
        const { data, error } = await supabaseAdmin
          .from('events')
          .select('*, tiers:ticket_tiers(id, name, price, capacity, sort_order)')
          .eq('id', eventId)
          .eq('organiser_id', userId)
          .eq('status', 'draft')
          .single();
        return NextResponse.json({ event: data ?? null, error: error?.message ?? null });
      }
      case 'cancelEvent': {
        const { eventId } = body;
        const { error } = await supabaseAdmin
          .from('events')
          .update({ status: 'cancelled' })
          .eq('id', eventId)
          .eq('organiser_id', userId);
        return NextResponse.json({ error: error?.message ?? null });
      }
      case 'getMyDoorAssignments': {
        // Returns events where current user is assigned as door staff and doors are open
        const { data } = await supabaseAdmin
          .from('door_staff')
          .select('event_id, events(id, title, doors_at, starts_at, venue_name)')
          .eq('user_id', userId);
        return NextResponse.json({ assignments: data ?? [], error: null });
      }
      case 'submitProfileReview': {
        const { revieweeId, rating, body: reviewBody } = body;
        if (!revieweeId || !rating || rating < 1 || rating > 5)
          return NextResponse.json({ error: 'Invalid review data' });
        if (revieweeId === userId)
          return NextResponse.json({ error: 'You cannot review yourself' });
        const { error } = await supabaseAdmin.from('reviews').insert({
          reviewer_id: userId,
          reviewee_id: revieweeId,
          rating,
          body: reviewBody || null,
        });
        if (error?.code === '23505')
          return NextResponse.json({ error: 'You have already reviewed this creative' });
        return NextResponse.json({ error: error?.message ?? null });
      }
      case 'checkProfileReviewEligibility': {
        const { revieweeId } = body;
        const { count } = await supabaseAdmin
          .from('reviews')
          .select('*', { count: 'exact', head: true })
          .eq('reviewer_id', userId)
          .eq('reviewee_id', revieweeId)
          .is('commission_id', null)
          .is('event_id', null);
        return NextResponse.json({ hasReviewed: (count ?? 0) > 0 });
      }
      case 'submitEventReview': {
        const { eventId, rating, body: reviewBody } = body;
        if (!eventId || !rating || rating < 1 || rating > 5)
          return NextResponse.json({ error: 'Invalid review data' });
        const { data: event } = await supabaseAdmin
          .from('events').select('organiser_id').eq('id', eventId).single();
        if (!event) return NextResponse.json({ error: 'Event not found' });
        if (event.organiser_id === userId)
          return NextResponse.json({ error: 'Organisers cannot review their own event' });
        const { count: ticketCount } = await supabaseAdmin
          .from('tickets').select('*', { count: 'exact', head: true })
          .eq('event_id', eventId).eq('buyer_id', userId);
        if (!ticketCount || ticketCount === 0)
          return NextResponse.json({ error: 'You need a ticket to review this event' });
        const { error } = await supabaseAdmin.from('reviews').insert({
          event_id: eventId,
          reviewer_id: userId,
          reviewee_id: event.organiser_id,
          rating,
          body: reviewBody || null,
        });
        if (error?.code === '23505')
          return NextResponse.json({ error: 'You have already reviewed this event' });
        return NextResponse.json({ error: error?.message ?? null });
      }
      case 'checkEventReviewEligibility': {
        const { eventId } = body;
        const [{ count: ticketCount }, { count: reviewCount }, { data: event }] = await Promise.all([
          supabaseAdmin.from('tickets').select('*', { count: 'exact', head: true })
            .eq('event_id', eventId).eq('buyer_id', userId),
          supabaseAdmin.from('reviews').select('*', { count: 'exact', head: true })
            .eq('event_id', eventId).eq('reviewer_id', userId),
          supabaseAdmin.from('events').select('organiser_id').eq('id', eventId).single(),
        ]);
        return NextResponse.json({
          hasTicket: (ticketCount ?? 0) > 0,
          hasReviewed: (reviewCount ?? 0) > 0,
          isOrganiser: event?.organiser_id === userId,
        });
      }
      default:
        return NextResponse.json({ error: `Unknown op: ${op}` }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}

// Resolve usernames → user_ids and insert door_staff rows
async function insertDoorStaff(
  admin: SupabaseClient,
  eventId: string,
  doorStaff: Array<{ type: 'username' | 'phone'; value: string }>,
) {
  const rows: any[] = [];
  for (const s of doorStaff) {
    if (s.type === 'username') {
      const { data: profile } = await admin.from('profiles').select('id').eq('username', s.value.replace(/^@/, '')).single();
      if (profile) rows.push({ event_id: eventId, user_id: profile.id });
    } else {
      rows.push({ event_id: eventId, phone: s.value });
    }
  }
  if (rows.length > 0) await admin.from('door_staff').insert(rows);
}
