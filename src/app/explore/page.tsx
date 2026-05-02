import { searchArtists, searchEvents } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import Image from 'next/image';
import Link from 'next/link';
import { formatPKR, formatDate } from '@/lib/utils';
import styles from './page.module.css';

interface ExplorePageProps {
  searchParams: Promise<{ 
    tab?: string;
    discipline?: string;
    type?: string;
    city?: string;
  }>;
}

/**
 * Explore Page
 * Tabbed interface for discovering Artists and Events.
 */
export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;
  const activeTab = params.tab || 'artists';
  const isArtists = activeTab === 'artists';

  let results;
  if (isArtists) {
    results = await searchArtists({
      discipline: params.discipline,
      city: params.city
    });
  } else {
    results = await searchEvents({
      type: params.type,
      city: params.city
    });
  }

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.main}>
        {/* ─── Header ────────────────────────────────────────── */}
        <section className={styles.header}>
          <div className="container">
            <h1 className={styles.title}>Explore</h1>
            
            <div className={styles.tabs}>
              <Link 
                href="/explore?tab=artists" 
                className={`${styles.tab} ${isArtists ? styles.activeTab : ''}`}
              >
                Artists
              </Link>
              <Link 
                href="/explore?tab=events" 
                className={`${styles.tab} ${!isArtists ? styles.activeTab : ''}`}
              >
                Events
              </Link>
            </div>

            {/* Filters Row */}
            <div className={styles.filters}>
              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>City</span>
                <div className={styles.filterChips}>
                  <Link href={`/explore?tab=${activeTab}`} className={`${styles.filterChip} ${!params.city ? styles.activeChip : ''}`}>All</Link>
                  <Link href={`/explore?tab=${activeTab}&city=Karachi`} className={`${styles.filterChip} ${params.city === 'Karachi' ? styles.activeChip : ''}`}>Karachi</Link>
                  <Link href={`/explore?tab=${activeTab}&city=Lahore`} className={`${styles.filterChip} ${params.city === 'Lahore' ? styles.activeChip : ''}`}>Lahore</Link>
                  <Link href={`/explore?tab=${activeTab}&city=Islamabad`} className={`${styles.filterChip} ${params.city === 'Islamabad' ? styles.activeChip : ''}`}>Islamabad</Link>
                </div>
              </div>

              {isArtists ? (
                <div className={styles.filterGroup}>
                  <span className={styles.filterLabel}>Discipline</span>
                  <div className={styles.filterChips}>
                    <Link href={`/explore?tab=artists`} className={`${styles.filterChip} ${!params.discipline ? styles.activeChip : ''}`}>All</Link>
                    <Link href={`/explore?tab=artists&discipline=Music`} className={`${styles.filterChip} ${params.discipline === 'Music' ? styles.activeChip : ''}`}>Music</Link>
                    <Link href={`/explore?tab=artists&discipline=Design`} className={`${styles.filterChip} ${params.discipline === 'Design' ? styles.activeChip : ''}`}>Design</Link>
                    <Link href={`/explore?tab=artists&discipline=Print`} className={`${styles.filterChip} ${params.discipline === 'Print' ? styles.activeChip : ''}`}>Print</Link>
                  </div>
                </div>
              ) : (
                <div className={styles.filterGroup}>
                  <span className={styles.filterLabel}>Type</span>
                  <div className={styles.filterChips}>
                    <Link href={`/explore?tab=events`} className={`${styles.filterChip} ${!params.type ? styles.activeChip : ''}`}>All</Link>
                    <Link href={`/explore?tab=events&type=concert`} className={`${styles.filterChip} ${params.type === 'concert' ? styles.activeChip : ''}`}>Concerts</Link>
                    <Link href={`/explore?tab=events&type=workshop`} className={`${styles.filterChip} ${params.type === 'workshop' ? styles.activeChip : ''}`}>Workshops</Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ─── Results Grid ─────────────────────────────────── */}
        <section className={styles.results}>
          <div className="container">
            <div className={styles.grid}>
              {isArtists ? (
                (results.data as any[]).map((artist, i) => (
                  <Link 
                    key={artist.user.id} 
                    href={`/${artist.user.username}`}
                    className={styles.artistCard}
                    style={{ '--delay': `${i * 40}ms` } as React.CSSProperties}
                  >
                    <div className={styles.cardImageWrapper}>
                      <Image
                        src={artist.user.avatar_url || '/images/default-avatar.png'}
                        alt={artist.user.full_name}
                        fill
                        className={styles.cardImage}
                      />
                    </div>
                    <div className={styles.cardInfo}>
                      <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>{artist.user.full_name}</h3>
                        {artist.profile.verified && <span className={styles.verified}>✓</span>}
                      </div>
                      <p className={styles.cardMeta}>
                        {artist.profile.disciplines.join(' · ')}
                      </p>
                      <div className={styles.cardFooter}>
                        <span className={styles.cardLocation}>{artist.user.city}</span>
                        <span className={styles.cardRating}>★ {artist.review_average}</span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                (results.data as any[]).map((ev, i) => (
                  <Link 
                    key={ev.event.id} 
                    href={`/events/${ev.event.id}`}
                    className={styles.eventCard}
                    style={{ '--delay': `${i * 40}ms` } as React.CSSProperties}
                  >
                    <div className={styles.cardImageWrapper}>
                      <Image
                        src={ev.event.cover_image_url}
                        alt={ev.event.title}
                        fill
                        className={styles.cardImage}
                      />
                      <div className={styles.eventBadge}>
                        {ev.event.event_type}
                      </div>
                    </div>
                    <div className={styles.cardInfo}>
                      <span className={styles.eventDate}>{formatDate(ev.event.starts_at)}</span>
                      <h3 className={styles.cardTitle}>{ev.event.title}</h3>
                      <p className={styles.eventVenue}>{ev.event.venue_name} · {ev.event.city}</p>
                      <div className={styles.cardFooter}>
                        <span className={styles.eventPrice}>
                          {ev.event.is_free ? 'Free' : `From ${formatPKR(ev.event.min_price)}`}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>

            {results.data.length === 0 && (
              <div className={styles.empty}>
                <p>No results found for your selection.</p>
                <Link href="/explore" className="btn btn-secondary btn-md">Clear Filters</Link>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
