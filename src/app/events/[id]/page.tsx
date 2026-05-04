import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getEvent } from '@/lib/api';
import { TicketButton } from '@/components/event/TicketButton';
import { formatPKR, formatDate, formatTime } from '@/lib/utils';
import styles from './page.module.css';

interface EventPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Event Detail Page
 * Route: /events/[id]
 */
export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;

  try {
    const event = await getEvent(id);
    if (!event) return notFound();

    const isConcert = event.event_type === 'concert';
    const accentColor = isConcert ? 'var(--color-concert)' : 'var(--color-workshop)';

    return (
      <div className={styles.page} style={{ '--event-accent': accentColor } as React.CSSProperties}>

        <main className={styles.main}>
          {/* ─── Hero Section ─────────────────────────────────── */}
          <section className={styles.hero}>
            <div className={styles.heroImageWrapper}>
              <Image
                src={event.cover_image_url || '/images/default-event.jpg'}
                alt={event.title}
                fill
                className={styles.heroImage}
                priority
              />
              <div className={styles.editorialGradient} />
            </div>
            
            <div className="container">
              <div className={styles.heroContent}>
                <div className={styles.badgeRow}>
                  <span className={`chip chip-outlined ${styles.typeChip}`}>
                    {event.event_type}
                  </span>
                  {event.is_sold_out && (
                    <span className="chip chip-ink">Sold Out</span>
                  )}
                </div>
                <h1 className={styles.title}>{event.title}</h1>
                <div className={styles.organizerRow}>
                  <Link href={`/${event.organiser.username}`} className={styles.organizer}>
                    <div className={styles.organizerAvatar}>
                      <Image
                        src={event.organiser.avatar_url || '/images/default-avatar.png'}
                        alt={event.organiser.full_name}
                        width={32}
                        height={32}
                      />
                    </div>
                    <span>Organised by {event.organiser.full_name}</span>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* ─── Event Content ────────────────────────────────── */}
          <section className={styles.content}>
            <div className="container">
              <div className={styles.layout}>
                
                {/* Left: Info */}
                <div className={styles.info}>
                  <div className={styles.detailsGrid}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Date</span>
                      <span className={styles.detailValue}>{formatDate(event.starts_at)}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Time</span>
                      <span className={styles.detailValue}>{formatTime(event.starts_at)}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Location</span>
                      <span className={styles.detailValue}>{event.venue_name}</span>
                      <span className={styles.detailSubValue}>{event.city}</span>
                    </div>
                  </div>

                  <div className={styles.description}>
                    <h2 className={styles.sectionTitle}>About the event</h2>
                    <div className={styles.bio}>
                      {event.description || 'Join us for this exclusive event on Stagd.'}
                    </div>
                  </div>
                </div>

                {/* Right: Ticketing Sidebar */}
                <aside className={styles.sidebar}>
                  <div className={styles.ticketCard}>
                    <div className={styles.ticketHeader}>
                      <h3 className={styles.sidebarTitle}>Tickets</h3>
                      <span className={styles.priceRange}>
                        {event.is_free ? 'Free' : `From ${formatPKR(event.min_price)}`}
                      </span>
                    </div>

                    <div className={styles.tiers}>
                      <div className={styles.tierPlaceholder}>
                        <p>Secure your spot now.</p>
                      </div>
                    </div>

                    <TicketButton 
                      event={event}
                      className={`btn btn-primary btn-md ${styles.buyBtn}`}
                    />
                    
                    <p className={styles.guarantee}>
                      Secure payments via Safepay. Instant QR delivery.
                    </p>
                  </div>
                </aside>

              </div>
            </div>
          </section>
        </main>
      </div>
    );
  } catch (err) {
    console.error(`Error fetching event ${id}:`, err);
    return notFound();
  }
}

// ISR configuration
export const revalidate = 60;

export async function generateStaticParams() {
  return [
    { id: 'event_1' },
    { id: 'event_2' },
  ];
}
