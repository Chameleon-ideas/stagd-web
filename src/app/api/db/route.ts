import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { sendMail } from '@/lib/mail';

async function generateEventSlug(title: string, admin: SupabaseClient): Promise<string> {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const suffix = Math.random().toString(36).slice(2, 6);
  const candidate = `${base}-${suffix}`;
  const { data } = await admin.from('events').select('id').eq('slug', candidate).single();
  // retry on collision (astronomically unlikely but safe)
  return data ? generateEventSlug(title, admin) : candidate;
}

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
  const body = await req.json();
  const { op } = body;

  // Public ops — door staff may not be logged in.
  if (op === 'getRecentScans') {
    const { eventId: evId, limit = 30 } = body;
    let query = supabaseAdmin
      .from('tickets')
      .select(`
        ticket_id, buyer_name, scanned_at,
        tier:ticket_tiers(name),
        event:events(title)
      `)
      .not('scanned_at', 'is', null)
      .order('scanned_at', { ascending: false })
      .limit(limit);
    if (evId) query = query.eq('event_id', evId);
    const { data } = await query;
    const scans = (data ?? []).map((row: any) => {
      const tier = Array.isArray(row.tier) ? row.tier[0] : row.tier;
      const event = Array.isArray(row.event) ? row.event[0] : row.event;
      return {
        status: 'valid' as const,
        ticket_id: row.ticket_id,
        buyer_name: row.buyer_name,
        tier_name: tier?.name,
        event_title: event?.title,
        scanned_at: row.scanned_at,
      };
    });
    return NextResponse.json({ scans });
  }

  if (op === 'verifyTicket') {
    const { ticketId, eventId: evId } = body;
    if (!ticketId) return NextResponse.json({ status: 'not_recognised' });

    const { data: ticket, error: ticketErr } = await supabaseAdmin
      .from('tickets')
      .select(`
        id, ticket_id, buyer_name, quantity, scanned_at, event_id,
        tier:ticket_tiers(name),
        event:events(title)
      `)
      .eq('ticket_id', ticketId)
      .single();

    if (ticketErr || !ticket) return NextResponse.json({ status: 'not_recognised' });

    if (evId && ticket.event_id !== evId) {
      const ev = Array.isArray(ticket.event) ? ticket.event[0] : ticket.event;
      return NextResponse.json({ status: 'wrong_event', event_title: ev?.title });
    }

    const tier = Array.isArray(ticket.tier) ? ticket.tier[0] : ticket.tier;
    const event = Array.isArray(ticket.event) ? ticket.event[0] : ticket.event;

    if (ticket.scanned_at) {
      return NextResponse.json({
        status: 'already_used',
        ticket_id: ticket.ticket_id,
        buyer_name: ticket.buyer_name,
        tier_name: tier?.name,
        quantity: ticket.quantity,
        event_title: event?.title,
        scanned_at: ticket.scanned_at,
      });
    }

    await supabaseAdmin
      .from('tickets')
      .update({ scanned_at: new Date().toISOString() })
      .eq('ticket_id', ticketId);

    return NextResponse.json({
      status: 'valid',
      ticket_id: ticket.ticket_id,
      buyer_name: ticket.buyer_name,
      tier_name: tier?.name,
      quantity: ticket.quantity,
      event_title: event?.title,
    });
  }

  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
        const slug = await generateEventSlug(eventData.title, supabaseAdmin);
        const { data: event, error: eventError } = await supabaseAdmin
          .from('events')
          .insert({ ...eventData, organiser_id: userId, status: 'live', slug })
          .select('id, slug')
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
        console.log('[createEvent] done, returning eventId:', event.id, 'slug:', event.slug);
        return NextResponse.json({ eventId: event.id, eventSlug: event.slug, error: null });
      }
      case 'saveDraftEvent': {
        const { eventData, tiers } = body;
        const placeholder = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
        const draftSlug = await generateEventSlug(eventData.title || 'draft', supabaseAdmin);
        const { data: event, error: eventError } = await supabaseAdmin
          .from('events')
          .insert({
            ...eventData,
            organiser_id: userId,
            status: 'draft',
            slug: draftSlug,
            starts_at: eventData.starts_at ?? placeholder,
          })
          .select('id, slug')
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

      // ── COMMISSIONS FLOW ──────────────────────────────────

      case 'submitCommission': {
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const { artistProfileId, data: cd } = body;

        const { data: row, error: insertErr } = await supabaseAdmin
          .from('commissions')
          .insert({
            artist_id: artistProfileId,
            client_id: userId,
            status: 'enquiry',
            payment_status: 'unpaid',
            brief_what: `${cd.discipline}: ${cd.deliverable}${cd.brief ? '\n\n' + cd.brief : ''}`,
            brief_budget: `PKR ${Number(cd.budget).toLocaleString()}`,
            brief_timeline: `${cd.deadline} (${cd.duration})`,
            brief_discipline: cd.discipline,
            brief_deliverable: cd.deliverable,
            brief_description: cd.brief || null,
            brief_deadline: cd.deadline || null,
            brief_duration: cd.duration,
            brief_budget_amount: cd.budget,
            brief_reference: cd.referenceImageUrl ?? null,
          })
          .select('id')
          .single();
        if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

        // Fetch emails for both parties
        const [{ data: { user: clientAuth } }, { data: artistRow }] = await Promise.all([
          supabaseAdmin.auth.admin.getUserById(userId),
          supabaseAdmin
            .from('artist_profiles')
            .select('id, profiles!inner(full_name, username)')
            .eq('id', artistProfileId)
            .single(),
        ]);
        const artistProfile = artistRow as any;
        const artistUserId: string = artistProfile?.id;
        const artistName: string = artistProfile?.profiles?.full_name ?? 'the creative';
        const artistUsername: string = artistProfile?.profiles?.username ?? '';
        const clientName: string = clientAuth?.user_metadata?.full_name ?? 'Someone';
        const clientEmail: string | undefined = clientAuth?.email;

        const { data: { user: artistAuth } } = await supabaseAdmin.auth.admin.getUserById(artistUserId);
        const artistEmail: string | undefined = artistAuth?.email;

        const messagesUrl = 'https://stagd.app/messages';

        // Email to client
        if (clientEmail) {
          sendMail({
            to: clientEmail,
            subject: `Brief sent to ${artistName} — Stag'd`,
            html: `
              <p>Hi ${clientName},</p>
              <p>Your brief has been sent to <strong>${artistName}</strong>. They'll review it and get back to you shortly.</p>
              <p><strong>What you sent:</strong><br/>
              ${cd.discipline} — ${cd.deliverable}<br/>
              Budget: PKR ${Number(cd.budget).toLocaleString()}<br/>
              Timeline: ${cd.deadline} (${cd.duration})</p>
              <p><a href="${messagesUrl}">View your conversation →</a></p>
              <p style="color:#888;font-size:12px;">Stag'd · stagd.app</p>
            `,
          }).catch(() => {});
        }

        // Email to artist
        if (artistEmail) {
          sendMail({
            to: artistEmail,
            subject: `New commission enquiry from ${clientName} — Stag'd`,
            html: `
              <p>Hi ${artistName},</p>
              <p>You have a new commission enquiry from <strong>${clientName}</strong>.</p>
              <p><strong>Brief:</strong><br/>
              ${cd.discipline} — ${cd.deliverable}<br/>
              Budget: PKR ${Number(cd.budget).toLocaleString()}<br/>
              Timeline: ${cd.deadline} (${cd.duration})</p>
              <p><a href="${messagesUrl}">Respond in messages →</a></p>
              <p style="color:#888;font-size:12px;">Stag'd · stagd.app</p>
            `,
          }).catch(() => {});
        }

        return NextResponse.json({ id: row.id, error: null });
      }

      case 'sendProposal': {
        const { commissionId, data: propData } = body;
        // Verify caller is the artist on this commission
        const { data: commission } = await supabaseAdmin
          .from('commissions').select('artist_id, client_id, status').eq('id', commissionId).single();
        if (!commission || commission.artist_id !== userId)
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        // Supersede previous pending proposals
        await supabaseAdmin
          .from('proposals')
          .update({ status: 'superseded' })
          .eq('commission_id', commissionId)
          .eq('status', 'pending');

        const { data: proposal, error: propError } = await supabaseAdmin
          .from('proposals')
          .insert({ commission_id: commissionId, ...propData })
          .select('id')
          .single();
        if (propError || !proposal)
          return NextResponse.json({ error: propError?.message ?? 'Failed to create proposal' });

        // Insert proposal message
        await supabaseAdmin.from('messages').insert({
          commission_id: commissionId,
          sender_id: userId,
          body: proposal.id,
          type: 'proposal',
        });

        // Insert system message for revisions (version > 1)
        if (propData.version > 1) {
          const { data: profile } = await supabaseAdmin.from('profiles').select('full_name').eq('id', userId).single();
          const msgs: any[] = [{
            commission_id: commissionId,
            sender_id: userId,
            body: `${profile?.full_name ?? 'The creative'} sent a revised proposal`,
            type: 'status_update',
          }];
          // Soft nudge on 3rd+ proposal
          if (propData.version >= 3) {
            msgs.push({
              commission_id: commissionId,
              sender_id: userId,
              body: `This is proposal revision ${propData.version}. Consider locking scope before starting.`,
              type: 'status_update',
            });
          }
          await supabaseAdmin.from('messages').insert(msgs);
        }

        // Update commission status to in_discussion if still enquiry
        if (commission.status === 'enquiry') {
          await supabaseAdmin.from('commissions').update({ status: 'in_discussion' }).eq('id', commissionId);
        }

        return NextResponse.json({ proposalId: proposal.id, error: null });
      }

      case 'acceptProposal': {
        const { commissionId, proposalId } = body;
        const { data: commission } = await supabaseAdmin
          .from('commissions').select('artist_id, client_id').eq('id', commissionId).single();
        if (!commission || commission.client_id !== userId)
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const { data: profile } = await supabaseAdmin.from('profiles').select('full_name').eq('id', userId).single();

        await Promise.all([
          supabaseAdmin.from('proposals').update({ status: 'accepted' }).eq('id', proposalId),
          supabaseAdmin.from('commissions').update({ status: 'in_progress' }).eq('id', commissionId),
          supabaseAdmin.from('messages').insert({
            commission_id: commissionId,
            sender_id: userId,
            body: `${profile?.full_name ?? 'The client'} accepted the proposal. Project is now In Progress.`,
            type: 'status_update',
          }),
        ]);

        // Check if artist has invoice auto-send enabled
        const { data: artistProfile } = await supabaseAdmin
          .from('artist_profiles').select('invoice_auto_send').eq('id', commission.artist_id).single();

        if (artistProfile?.invoice_auto_send) {
          // Auto-send invoice — generate invoice number
          const { data: proposal } = await supabaseAdmin
            .from('proposals').select('total_price').eq('id', proposalId).single();
          const { data: clientUser } = await supabaseAdmin
            .from('profiles').select('email, full_name').eq('id', commission.client_id).single();
          if (proposal && clientUser?.email) {
            const year = new Date().getFullYear();
            const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
            const invoiceNumber = `INV-${year}-${rand}`;
            await supabaseAdmin.from('invoices').insert({
              commission_id: commissionId,
              invoice_number: invoiceNumber,
              sent_to_email: clientUser.email,
              total_amount: proposal.total_price,
            });
            await supabaseAdmin.from('messages').insert({
              commission_id: commissionId,
              sender_id: commission.artist_id,
              body: `Invoice ${invoiceNumber} sent to ${clientUser.email}`,
              type: 'payment_confirmation',
            });
          }
        }

        return NextResponse.json({ error: null });
      }

      case 'declineProposal': {
        const { commissionId, proposalId } = body;
        const { data: commission } = await supabaseAdmin
          .from('commissions').select('client_id').eq('id', commissionId).single();
        if (!commission || commission.client_id !== userId)
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        await supabaseAdmin.from('proposals').update({ status: 'declined' }).eq('id', proposalId);
        return NextResponse.json({ error: null });
      }

      case 'updatePaymentStatus': {
        const { commissionId, status: payStatus } = body;
        const { data: commission } = await supabaseAdmin
          .from('commissions').select('artist_id').eq('id', commissionId).single();
        if (!commission || commission.artist_id !== userId)
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const { data: profile } = await supabaseAdmin.from('profiles').select('full_name').eq('id', userId).single();
        const label = payStatus === 'fully_paid' ? 'Fully Paid' : 'Partially Paid';

        await Promise.all([
          supabaseAdmin.from('commissions').update({ payment_status: payStatus }).eq('id', commissionId),
          supabaseAdmin.from('payment_status_log').insert({
            commission_id: commissionId, status: payStatus, updated_by: userId,
          }),
          supabaseAdmin.from('messages').insert({
            commission_id: commissionId,
            sender_id: userId,
            body: `${profile?.full_name ?? 'The creative'} marked payment as ${label}`,
            type: 'payment_confirmation',
          }),
        ]);

        return NextResponse.json({ error: null });
      }

      case 'updateCommissionStatus': {
        const { commissionId, status: newStatus } = body;
        const { data: commission } = await supabaseAdmin
          .from('commissions').select('artist_id, client_id, status').eq('id', commissionId).single();
        if (!commission) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Only artist can move to delivered
        if (newStatus === 'delivered' && commission.artist_id !== userId)
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const { data: profile } = await supabaseAdmin.from('profiles').select('full_name').eq('id', userId).single();

        await Promise.all([
          supabaseAdmin.from('commissions').update({ status: newStatus }).eq('id', commissionId),
          supabaseAdmin.from('messages').insert({
            commission_id: commissionId,
            sender_id: userId,
            body: `${profile?.full_name ?? 'User'} marked the project as ${newStatus === 'delivered' ? 'Delivered' : 'Completed'}`,
            type: 'status_update',
          }),
        ]);

        return NextResponse.json({ error: null });
      }

      case 'requestCompletion': {
        const { commissionId } = body;
        const { data: commission } = await supabaseAdmin
          .from('commissions').select('artist_id, client_id, completion_requested_by').eq('id', commissionId).single();
        if (!commission) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        if (commission.artist_id !== userId && commission.client_id !== userId)
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const { data: profile } = await supabaseAdmin.from('profiles').select('full_name').eq('id', userId).single();
        const otherId = commission.artist_id === userId ? commission.client_id : commission.artist_id;
        const { data: other } = await supabaseAdmin.from('profiles').select('full_name').eq('id', otherId).single();

        await Promise.all([
          supabaseAdmin.from('commissions').update({ completion_requested_by: userId }).eq('id', commissionId),
          supabaseAdmin.from('messages').insert({
            commission_id: commissionId,
            sender_id: userId,
            body: `${profile?.full_name ?? 'User'} marked this project as complete. Waiting for ${other?.full_name ?? 'the other party'} to confirm.`,
            type: 'status_update',
          }),
        ]);

        return NextResponse.json({ error: null });
      }

      case 'confirmCompletion': {
        const { commissionId } = body;
        const { data: commission } = await supabaseAdmin
          .from('commissions').select('artist_id, client_id, completion_requested_by, payment_status').eq('id', commissionId).single();
        if (!commission) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        if (commission.artist_id !== userId && commission.client_id !== userId)
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        await Promise.all([
          supabaseAdmin.from('commissions').update({ status: 'completed', completion_requested_by: null }).eq('id', commissionId),
          supabaseAdmin.from('messages').insert({
            commission_id: commissionId,
            sender_id: userId,
            body: 'Project completed. Leave a review when you\'re ready.',
            type: 'status_update',
          }),
        ]);

        return NextResponse.json({ error: null });
      }

      case 'rejectCompletion': {
        const { commissionId } = body;
        const { data: commission } = await supabaseAdmin
          .from('commissions').select('artist_id, client_id').eq('id', commissionId).single();
        if (!commission) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const { data: profile } = await supabaseAdmin.from('profiles').select('full_name').eq('id', userId).single();

        await Promise.all([
          supabaseAdmin.from('commissions').update({ completion_requested_by: null }).eq('id', commissionId),
          supabaseAdmin.from('messages').insert({
            commission_id: commissionId,
            sender_id: userId,
            body: `${profile?.full_name ?? 'User'} indicated the project is not yet complete.`,
            type: 'status_update',
          }),
        ]);

        return NextResponse.json({ error: null });
      }

      case 'sendInvoice': {
        const { commissionId } = body;
        const { data: commission } = await supabaseAdmin
          .from('commissions').select('artist_id, client_id').eq('id', commissionId).single();
        if (!commission || commission.artist_id !== userId)
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        // Get latest accepted proposal
        const { data: proposal } = await supabaseAdmin
          .from('proposals').select('total_price').eq('commission_id', commissionId).eq('status', 'accepted').single();
        const { data: clientUser } = await supabaseAdmin
          .from('profiles').select('email').eq('id', commission.client_id).single();

        if (!proposal || !clientUser?.email)
          return NextResponse.json({ error: 'Missing proposal or client email' });

        const year = new Date().getFullYear();
        const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
        const invoiceNumber = `INV-${year}-${rand}`;

        await Promise.all([
          supabaseAdmin.from('invoices').insert({
            commission_id: commissionId,
            invoice_number: invoiceNumber,
            sent_to_email: clientUser.email,
            total_amount: proposal.total_price,
          }),
          supabaseAdmin.from('messages').insert({
            commission_id: commissionId,
            sender_id: userId,
            body: `Invoice ${invoiceNumber} sent to ${clientUser.email}`,
            type: 'payment_confirmation',
          }),
        ]);

        return NextResponse.json({ invoiceNumber, error: null });
      }

      case 'submitCommissionReview': {
        const { commissionId, revieweeId, rating, body: reviewBody } = body;
        if (!revieweeId || !rating || rating < 1 || rating > 5)
          return NextResponse.json({ error: 'Invalid review data' });
        if (revieweeId === userId)
          return NextResponse.json({ error: 'You cannot review yourself' });

        const { data: commission } = await supabaseAdmin
          .from('commissions')
          .select('status, payment_status, artist_id, client_id')
          .eq('id', commissionId)
          .single();

        if (!commission) return NextResponse.json({ error: 'Commission not found' });
        if (commission.status !== 'completed' || commission.payment_status !== 'fully_paid')
          return NextResponse.json({ error: 'Review only unlocks when project is completed and fully paid' });

        const { error } = await supabaseAdmin.from('reviews').insert({
          commission_id: commissionId,
          reviewer_id: userId,
          reviewee_id: revieweeId,
          rating,
          body: reviewBody || null,
        });
        if (error?.code === '23505')
          return NextResponse.json({ error: 'You have already reviewed this person for this commission' });
        return NextResponse.json({ error: error?.message ?? null });
      }

      case 'reorderProjects': {
        const { projectIds } = body;
        
        for (let i = 0; i < projectIds.length; i++) {
          const { error } = await supabaseAdmin
            .from('projects')
            .update({ sort_order: i })
            .eq('id', projectIds[i])
            .eq('artist_id', userId); // Security check
            
          if (error) return NextResponse.json({ error: error.message });
        }
          
        return NextResponse.json({ error: null });
      }

      case 'reorderProjectItems': {
        const { itemIds } = body;
        for (let i = 0; i < itemIds.length; i++) {
          const { error } = await supabaseAdmin
            .from('project_items')
            .update({ sort_order: i })
            .eq('id', itemIds[i]);
          if (error) return NextResponse.json({ error: error.message });
        }
        return NextResponse.json({ error: null });
      }

      case 'submitReport': {
        const { reportedUserId, commissionId, reason } = body;
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { error } = await supabaseAdmin.from('reports').insert({
          reporter_id: userId,
          reported_user_id: reportedUserId,
          commission_id: commissionId ?? null,
          reason: reason ?? null,
        });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        // Slack DM to admin
        const slackToken = process.env.SLACK_BOT_TOKEN;
        if (slackToken) {
          const { data: reporter } = await supabaseAdmin
            .from('profiles').select('username, full_name').eq('id', userId).single();
          const { data: reported } = await supabaseAdmin
            .from('profiles').select('username, full_name').eq('id', reportedUserId).single();
          await fetch('https://slack.com/api/chat.postMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${slackToken}` },
            body: JSON.stringify({
              channel: 'D0AP9DR4BC0',
              text: `🚩 *User Report — Stag'd*\n*Reporter:* ${reporter?.full_name ?? 'unknown'} (@${reporter?.username ?? userId})\n*Reported:* ${reported?.full_name ?? 'unknown'} (@${reported?.username ?? reportedUserId})\n*Reason:* ${reason?.trim() || '_(no reason given)_'}${commissionId ? `\n*Commission ID:* ${commissionId}` : ''}`,
            }),
          });
        }

        return NextResponse.json({ error: null });
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
