import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Clock, Calendar, ArrowRight, Users } from 'lucide-react';
import { getEvent } from '@/lib/api';
import { TicketButton } from '@/components/event/TicketButton';
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
          <Image
            src={event.cover_image_url || '/images/default-event.jpg'}
            alt={event.title}
            fill
            className={styles.coverImage}
            priority
          />
          {/* Overlay meta */}
          <div className={styles.coverOverlay}>
            <div className={styles.coverMeta}>
              <span className={styles.typeChip}>{typeLabel.toUpperCase()}</span>
              {event.is_sold_out && <span className={styles.soldOutChip}>SOLD OUT</span>}
            </div>
            <p className={styles.coverCity}>{event.city?.toUpperCase() ?? ''}</p>
          </div>
        </aside>

        {/* ── RIGHT: SCROLLABLE CONTENT ────────────────────── */}
        <main id="main-content" className={styles.contentPanel}>

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

          {/* Ticket card */}
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
