import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// POST /api/purchase — public endpoint, no auth required (guest checkout supported)
export async function POST(req: NextRequest) {
  try {
    const { eventId, tierId, quantity, buyerName, buyerEmail, buyerId } = await req.json();

    if (!eventId || !tierId || !quantity || !buyerName || !buyerEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: tier, error: tierError } = await supabaseAdmin
      .from('ticket_tiers')
      .select('price, capacity, event_id')
      .eq('id', tierId)
      .single();

    if (tierError || !tier) return NextResponse.json({ error: 'Ticket tier not found' }, { status: 404 });
    if (tier.event_id !== eventId) return NextResponse.json({ error: 'Tier does not belong to this event' }, { status: 400 });

    if (tier.capacity > 0) {
      const { count: sold } = await supabaseAdmin
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('tier_id', tierId);
      if ((sold ?? 0) + quantity > tier.capacity) {
        return NextResponse.json({ error: 'Not enough spots remaining' }, { status: 409 });
      }
    }

    const ticketId = `TKT-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const totalPaid = tier.price * quantity;

    const { error: insertError } = await supabaseAdmin.from('tickets').insert({
      ticket_id: ticketId,
      event_id: eventId,
      tier_id: tierId,
      ...(buyerId ? { buyer_id: buyerId } : {}),
      buyer_name: buyerName,
      buyer_email: buyerEmail,
      quantity,
      total_paid: totalPaid,
      qr_url: '',
    });

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'You already have a ticket for this event.' }, { status: 409 });
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ ticket_id: ticketId, total_paid: totalPaid });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}
