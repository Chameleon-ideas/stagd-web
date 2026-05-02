import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getArtistProfile, getArtistEvents } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HireButton } from '@/components/portfolio/HireButton';
import { formatPKR, formatDate } from '@/lib/utils';
import styles from './page.module.css';

interface ArtistPageProps {
  params: Promise<{ username: string }>;
}

export default async function ArtistPage({ params }: ArtistPageProps) {
  const { username } = await params;

  try {
    const data = await getArtistProfile(username);
    if (!data) return notFound();

    const { user, profile, portfolio, review_average, review_count, follower_count, project_count } = data;
    const eventsResponse = await getArtistEvents(user.id);
    const events = eventsResponse.data;

    const accentColor = profile.accent_color || 'var(--color-yellow)';

    return (
      <div className={styles.page} style={{ '--accent': accentColor } as React.CSSProperties}>
        <Header />

        <main className={styles.main}>
          {/* ─── Profile Header ─────────────────────────────────── */}
          <section className={styles.header}>
            <div className="container">
              <div className={styles.headerInner}>
                <div className={styles.profileInfo}>
                  <div className={styles.avatarWrapper}>
                    <Image
                      src={user.avatar_url || '/images/default-avatar.png'}
                      alt={user.full_name}
                      width={120}
                      height={120}
                      className={styles.avatar}
                      priority
                    />
                    {profile.verified && (
                      <div className={styles.verifiedBadge} title="Verified Artist">
                        ✓
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.details}>
                    <div className={styles.nameRow}>
                      <h1 className={styles.name}>{user.full_name}</h1>
                      <div className={styles.disciplines}>
                        {profile.disciplines.map(d => (
                          <span key={d} className="chip chip-outlined">{d}</span>
                        ))}
                      </div>
                    </div>
                    
                    <p className={styles.bio}>{profile.bio}</p>
                    
                    <div className={styles.meta}>
                      <span className={styles.metaItem}>
                        <span className={styles.metaLabel}>Location</span>
                        <span className={styles.metaValue}>{user.city || 'Karachi'}</span>
                      </span>
                      <span className={styles.metaItem}>
                        <span className={styles.metaLabel}>Availability</span>
                        <span className={`${styles.metaValue} ${styles[profile.availability]}`}>
                          {profile.availability}
                        </span>
                      </span>
                      {profile.starting_rate && (
                        <span className={styles.metaItem}>
                          <span className={styles.metaLabel}>Starting at</span>
                          <span className={styles.metaValue}>{formatPKR(profile.starting_rate)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.actions}>
                  <HireButton artist={data} className="btn btn-primary btn-md" />
                  <button className="btn btn-secondary btn-md">
                    Follow
                  </button>
                </div>
              </div>

              {/* Stats Bar */}
              <div className={styles.statsBar}>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{project_count}</span>
                  <span className={styles.statLabel}>Projects</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{follower_count}</span>
                  <span className={styles.statLabel}>Followers</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{review_average}</span>
                  <span className={styles.statLabel}>Rating ({review_count})</span>
                </div>
              </div>
            </div>
          </section>

          {/* ─── Main Content Grid ─────────────────────────────── */}
          <section className={styles.content}>
            <div className="container">
              <div className={styles.layout}>
                
                {/* Left: Portfolio + Events */}
                <div className={styles.contentLeft}>
                  {/* Portfolio */}
                  <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                      <h2 className="text-tag font-mono text-muted">Selected Works</h2>
                    </div>
                    <div className={styles.grid}>
                      {portfolio.map((item, i) => (
                        <div 
                          key={item.id} 
                          className={`${styles.gridItem} ${i % 3 === 0 ? styles.gridWide : ''}`}
                          style={{ '--delay': `${i * 40}ms` } as React.CSSProperties}
                        >
                          <div className={styles.imageWrapper}>
                            <Image
                              src={item.image_url}
                              alt={item.title || 'Portfolio item'}
                              fill
                              className={styles.image}
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                            <div className={styles.imageOverlay}>
                              <span className={styles.itemTitle}>{item.title}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Events */}
                  {events.length > 0 && (
                    <div className={styles.section}>
                      <div className={styles.sectionHeader}>
                        <h2 className="text-tag font-mono text-muted">Upcoming Events</h2>
                      </div>
                      <div className={styles.eventList}>
                        {events.map((ev, i) => (
                          <Link 
                            key={ev.event.id} 
                            href={`/events/${ev.event.id}`}
                            className={styles.eventRow}
                            style={{ '--delay': `${i * 40}ms` } as React.CSSProperties}
                          >
                            <div className={styles.eventDate}>
                              <span className={styles.dateDay}>{formatDate(ev.event.starts_at).split(',')[0]}</span>
                              <span className={styles.dateNum}>{formatDate(ev.event.starts_at).split(',')[1]}</span>
                            </div>
                            <div className={styles.eventInfo}>
                              <span className={styles.eventTitle}>{ev.event.title}</span>
                              <span className={styles.eventMeta}>
                                {ev.event.venue_name} · {ev.event.city}
                              </span>
                            </div>
                            <div className={styles.eventPrice}>
                              {ev.event.is_free ? 'Free' : formatPKR(ev.event.min_price)}
                            </div>
                            <div className={styles.eventArrow}>→</div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Commission Sidebar (Desktop) */}
                <aside className={styles.sidebar}>
                  <div className={styles.stickyCard}>
                    <h3 className={styles.sidebarTitle}>Start a commission</h3>
                    <p className={styles.sidebarBody}>
                      Hire {user.full_name} for your next project. All communications, payments, and files are handled through Stagd.
                    </p>
                    <div className={styles.sidebarPricing}>
                      <span className={styles.priceLabel}>Starting at</span>
                      <span className={styles.priceValue}>{formatPKR(profile.starting_rate || 0)}</span>
                    </div>
                    <HireButton 
                      artist={data} 
                      className="btn btn-accent btn-md" 
                      label="Send Enquiry"
                    />
                  </div>
                </aside>

              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    );
  } catch (err) {
    console.error(`Error fetching artist ${username}:`, err);
    return notFound();
  }
}

// ISR configuration
export const revalidate = 60;

// Pre-render popular profiles for faster initial load
export async function generateStaticParams() {
  return [
    { username: 'lyari_underground' },
    { username: 'risograph_khi' },
  ];
}
