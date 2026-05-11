import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Clock, Calendar, ArrowRight, Users } from 'lucide-react';
import { getEvent } from '@/lib/api';
import { supabaseAdmin } from '@/lib/supabase';
import { EventReviewsSection } from './EventReviewsSection';
import { TicketButton } from '@/components/event/TicketButton';
import { AttendeeCount } from './AttendeeCount';
import { DoorScannerButton } from './DoorScannerButton';
import { OrganizerBar } from './OrganizerBar';
import { formatPKR, eventTypeLabel } from '@/lib/utils';
import styles from './page.module.css';

interface EventPageProps {
  params: Promise<{ id: string }>;
}

/** Format date/time in Pakistan Standard Time (UTC+5) — SSR safe */
function formatPKT(iso: string, opts: Intl.DateTimeFormatOptions): string {
  return new Date(iso).toLocaleString('en-PK', {
    timeZone: 'Asia/Karachi',
    ...opts,
  });
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;

  try {
    const event = await getEvent(id);
    if (!event) return notFound();

    const { data: ticketRows } = await supabaseAdmin
      .from('tickets')
      .select('quantity, buyer_name, buyer_id')
      .eq('event_id', id)
      .limit(50);

    const initialAttendeeCount = (ticketRows ?? []).reduce((sum, t) => sum + (t.quantity ?? 1), 0);

    // Fetch avatars for buyers who have accounts
    const buyerIds = (ticketRows ?? []).map((t: any) => t.buyer_id).filter(Boolean);
    const profileMap: Record<string, string | null> = {};
    if (buyerIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, avatar_url')
        .in('id', buyerIds);
      (profiles ?? []).forEach((p: any) => { profileMap[p.id] = p.avatar_url ?? null; });
    }

    const { data: doorStaffRows } = await supabaseAdmin
      .from('door_staff')
      .select('user_id')
      .eq('event_id', id);
    const doorStaffUserIds = (doorStaffRows ?? []).map((r: any) => r.user_id).filter(Boolean);

    const { data: reviewRows } = await supabaseAdmin
      .from('reviews')
      .select('id, event_id, reviewer_id, rating, body, created_at, reviewer:profiles!reviewer_id(id, full_name, username, avatar_url)')
      .eq('event_id', id)
      .order('created_at', { ascending: false });
    const initialReviews = (reviewRows ?? []).map((r: any) => ({
      ...r,
      reviewer: Array.isArray(r.reviewer) ? r.reviewer[0] : r.reviewer,
    }));

    const initialAttendees = (ticketRows ?? []).slice(0, 5).map((t: any) => ({
      buyer_name: t.buyer_name,
      avatar_url: t.buyer_id ? (profileMap[t.buyer_id] ?? null) : null,
    }));

    const typeLabel = eventTypeLabel(event.event_type);
    const dateStr  = formatPKT(event.starts_at, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr  = formatPKT(event.starts_at, { hour: 'numeric', minute: '2-digit', hour12: true });
    const doorsStr = event.doors_at ? formatPKT(event.doors_at, { hour: 'numeric', minute: '2-digit', hour12: true }) : null;

    const tiers = event.ticket_tiers?.length
      ? event.ticket_tiers
      : event.is_free
        ? [{ id: 'free', name: 'General Admission', price: 0, capacity: 0, spots_remaining: 0, is_door_only: false, sort_order: 0, event_id: event.id }]
        : [{ id: 'ga', name: 'General Admission', price: event.min_price, capacity: 0, spots_remaining: 0, is_door_only: false, sort_order: 0, event_id: event.id }];

    return (
      <div className={styles.page}>

        {/* ── LEFT: COVER IMAGE ───────────────────────────── */}
        <aside className={styles.coverPanel} aria-hidden="true">
          {event.cover_image_url && (
            <Image
              src={event.cover_image_url}
              alt={event.title}
              fill
              className={styles.coverImage}
              priority
            />
          )}
          {/* Overlay meta */}
          <div className={styles.coverOverlay}>
            <div className={styles.coverMeta}>
              <span className={styles.typeChip}>{typeLabel.toUpperCase()}</span>
              {event.is_sold_out && <span className={styles.soldOutChip}>SOLD OUT</span>}
              {event.status === 'cancelled' && <span className={styles.cancelledChip}>CANCELLED</span>}
            </div>
            <p className={styles.coverCity}>{event.city?.toUpperCase() ?? ''}</p>
          </div>
        </aside>

        {/* ── RIGHT: SCROLLABLE CONTENT ────────────────────── */}
        <main id="main-content" className={styles.contentPanel}>

          <OrganizerBar eventId={event.id} organiserId={event.organiser.id} status={event.status ?? 'live'} />

          {event.status === 'cancelled' && (
            <div style={{
              background: 'rgba(230,57,70,0.08)',
              borderLeft: '3px solid #E63946',
              padding: '14px 20px',
              marginBottom: '20px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: '#E63946',
              letterSpacing: '0.06em',
            }}>
              THIS EVENT HAS BEEN CANCELLED BY THE ORGANISER.
            </div>
          )}

          {/* Title block */}
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>{event.title.toUpperCase()}</h1>
            <Link href={`/${event.organiser.username}`} className={styles.organizerLink}>
              <div className={styles.organizerAvatar}>
                <Image
                  src={event.organiser.avatar_url || '/images/default-avatar.png'}
                  alt={event.organiser.full_name}
                  width={28}
                  height={28}
                />
              </div>
              <div className={styles.organizerMeta}>
                <span className={styles.organizerName}>By {event.organiser.full_name}</span>
                {event.organiser_disciplines?.length ? (
                  <span className={styles.organizerDisciplines}>
                    {event.organiser_disciplines.join(' · ')}
                  </span>
                ) : null}
              </div>
              <ArrowRight size={12} className={styles.organizerArrow} />
            </Link>
          </div>

          <AttendeeCount eventId={event.id} initialCount={initialAttendeeCount} initialAttendees={initialAttendees} />

          {/* Fact row */}
          <div className={styles.factRow}>
            <div className={styles.fact}>
              <span className={styles.factLabel}>
                <Calendar size={11} /> DATE
              </span>
              <span className={styles.factValue}>{dateStr.toUpperCase()}</span>
            </div>
            <div className={styles.factDivider} />
            <div className={styles.fact}>
              <span className={styles.factLabel}>
                <Clock size={11} /> {doorsStr ? 'DOORS / SHOW' : 'TIME'}
              </span>
              <span className={styles.factValue}>
                {doorsStr ? `${doorsStr} / ${timeStr}` : timeStr}
              </span>
            </div>
            <div className={styles.factDivider} />
            <div className={styles.fact}>
              <span className={styles.factLabel}>
                <MapPin size={11} /> VENUE
              </span>
              <span className={styles.factValue}>{event.venue_name?.toUpperCase() ?? '—'}</span>
            </div>
          </div>

          <div className={styles.rule} />

          {/* About */}
          <section className={styles.section} aria-labelledby="about-heading">
            <p className={styles.sectionTag}>// ABOUT THE EVENT</p>
            <p className={styles.body}>
              {event.description ||
                `${event.title} is a ${typeLabel.toLowerCase()} at ${event.venue_name ?? 'a venue in'} ${event.city ?? 'Pakistan'}. Join us for an evening of craft, creativity, and culture — exclusively on Stagd.`}
            </p>
          </section>

          <div className={styles.rule} />

          {event.status !== 'cancelled' && (
            <DoorScannerButton eventId={event.id} doorsAt={event.doors_at ?? null} doorStaffUserIds={doorStaffUserIds} />
          )}

          {/* Ticket card */}
          {event.status !== 'cancelled' && (
          <section className={styles.section} aria-labelledby="tickets-heading">
            <p className={styles.sectionTag}>// TICKETS</p>
            <div className={styles.priceHeadline} id="tickets-heading">
              {event.is_free
                ? <span className={styles.priceDisplay}>FREE ENTRY</span>
                : <span className={styles.priceDisplay}>FROM {formatPKR(event.min_price)}</span>
              }
            </div>

            <div className={styles.tiers}>
              {tiers.map((tier) => (
                <div key={tier.id} className={styles.tier}>
                  <div className={styles.tierLeft}>
                    <span className={styles.tierName}>{tier.name.toUpperCase()}</span>
                    {tier.spots_remaining > 0 && tier.spots_remaining < 20 && (
                      <span className={styles.tierAlert}>
                        <Users size={10} /> {tier.spots_remaining} left
                      </span>
                    )}
                  </div>
                  <span className={styles.tierPrice}>
                    {tier.price === 0 ? 'FREE' : formatPKR(tier.price)}
                  </span>
                </div>
              ))}
            </div>

            <TicketButton
              event={event}
              className={`btn btn-primary btn-md ${styles.buyBtn}`}
            />
            <p className={styles.guarantee}>
              Secure payments via Safepay · Instant QR delivery
            </p>
          </section>
          )}

          {event.maps_pin && (
            <a
              href={event.maps_pin}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.mapLink}
            >
              <MapPin size={14} />
              <span>Get directions — {event.venue_name}</span>
              <ArrowRight size={12} />
            </a>
          )}

          <div className={styles.rule} />

          <EventReviewsSection
            eventId={event.id}
            organiserId={event.organiser.id}
            initialReviews={initialReviews}
            startsAt={event.starts_at}
          />

        </main>
      </div>
    );
  } catch (err) {
    console.error(`Error fetching event ${id}:`, err);
    return notFound();
  }
}

export const revalidate = 60;

export async function generateStaticParams() {
  return [{ id: 'event_1' }, { id: 'event_2' }];
}
