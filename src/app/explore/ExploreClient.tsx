"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, MapPin, Briefcase, Filter, Search } from 'lucide-react';
import { searchArtists, searchEvents } from '@/lib/api';
import { formatPKR, formatDate } from '@/lib/utils';
import styles from './page.module.css';

// ── CONSTANTS ────────────────────────────────────────────────

const CITIES = ['All', 'Karachi', 'Lahore', 'Islamabad'];
const DISCIPLINES = ['Music', 'Printmaking', 'Street Art', '3D Art', 'Fashion', 'Calligraphy', 'Visual Arts', 'Photography'];
const EVENT_DATES = ['Any', 'Today', 'This Week'];
const EVENT_TYPES = ['All', 'Concert', 'Workshop', 'Exhibition', 'Talk'];

const ARTIST_SORT = ['Relevance', 'Rating', 'Most reviewed'];
const EVENT_SORT = ['Soonest', 'Price low-high', 'Price high-low'];

// ── COMPONENTS ───────────────────────────────────────────────

export default function ExploreClient({
  initialTab,
  initialQuery = '',
  initialDiscipline = 'All',
}: {
  initialTab: string;
  initialQuery?: string;
  initialDiscipline?: string;
}) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [filters, setFilters] = useState<any>({
    city: 'All',
    discipline: initialDiscipline,
    type: 'All',
    date: 'Any',
    sort: initialTab === 'creatives' ? 'Relevance' : 'Soonest',
    query: initialQuery,
  });

  const [results, setResults] = useState<any>({ data: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        if (activeTab === 'creatives') {
          const data = await searchArtists({
            city: filters.city !== 'All' ? filters.city : undefined,
            discipline: filters.discipline !== 'All' ? filters.discipline : undefined,
            sort: filters.sort,
            query: filters.query || undefined,
          });
          setResults(data);
        } else {
          const data = await searchEvents({
            city: filters.city !== 'All' ? filters.city : undefined,
            type: filters.type !== 'All' ? filters.type : undefined,
            date: filters.date !== 'Any' ? filters.date : undefined,
            sort: filters.sort,
            query: filters.query || undefined,
          });
          setResults(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [filters, activeTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setOpenDropdown(null);
    setFilters({
      city: 'All',
      discipline: 'All',
      type: 'All',
      date: 'Any',
      sort: tab === 'creatives' ? 'Relevance' : 'Soonest',
      query: '',
    });
  };

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const handleFilterSelect = (group: string, value: string) => {
    setFilters((prev: any) => ({ ...prev, [group]: value }));
    setOpenDropdown(null);
  };

  const handleSurpriseMe = () => {
    if (results.data.length > 0) {
      const randomIndex = Math.floor(Math.random() * results.data.length);
      const randomItem = results.data[randomIndex];
      const targetUrl = activeTab === 'events'
        ? `/events/${randomItem.event?.id}`
        : `/${randomItem.user?.username}`;

      if (targetUrl !== '/' && targetUrl !== '/events/undefined') {
        router.push(targetUrl);
      }
    }
  };

  return (
    <div className={styles.exploreMain}>
      {/* ── LEFT PANE: CONTROL ────────────────────────── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarContent}>
          <h1 className={styles.sidebarTitle}>EXPLORE</h1>

          <div className={styles.sidebarScrollArea} data-lenis-prevent>
            {/* Search Bar */}
            <div className={styles.searchContainer}>
              <div className={styles.searchInputWrapper}>
                <Search size={16} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="SEARCH ARCHIVE..."
                  className={styles.searchInput}
                  value={filters.query}
                  onChange={e => setFilters((prev: any) => ({ ...prev, query: e.target.value }))}
                />
              </div>
            </div>

            <div className={styles.navLabel}>// DISCOVERY TYPE</div>
            {/* Segmented Tab Switcher */}
            <div className={styles.segmentedControl}>
              <button
                className={`${styles.segment} ${activeTab === 'creatives' ? styles.activeSegment : ''}`}
                onClick={() => handleTabChange('creatives')}
              >
                Creatives
              </button>
              <button
                className={`${styles.segment} ${activeTab === 'events' ? styles.activeSegment : ''}`}
                onClick={() => handleTabChange('events')}
              >
                Events
              </button>
            </div>

            <div className={styles.navLabel}>// PARAMETERS</div>

            <div className={styles.filterVertical}>
              {/* Shared City Filter */}
              <div className={styles.dropdownWrapper}>
                <button
                  className={`${styles.filterBtn} ${filters.city !== 'All' ? styles.activeBtn : ''}`}
                  onClick={() => toggleDropdown('city')}
                >
                  <MapPin size={14} />
                  {filters.city === 'All' ? 'Location' : filters.city}
                  <ChevronDown size={14} className={styles.chevron} />
                </button>
                {openDropdown === 'city' && (
                  <div className={styles.dropdown}>
                    {CITIES.map(c => (
                      <button key={c} className={styles.dropdownItem} onClick={() => handleFilterSelect('city', c)}>
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Artist: Discipline */}
              {activeTab === 'creatives' && (
                <div className={styles.dropdownWrapper}>
                  <button
                    className={`${styles.filterBtn} ${filters.discipline !== 'All' ? styles.activeBtn : ''}`}
                    onClick={() => toggleDropdown('discipline')}
                  >
                    <Briefcase size={14} />
                    {filters.discipline === 'All' ? 'Discipline' : filters.discipline}
                    <ChevronDown size={14} className={styles.chevron} />
                  </button>
                  {openDropdown === 'discipline' && (
                    <div className={styles.dropdown}>
                      {DISCIPLINES.map(d => (
                        <button key={d} className={styles.dropdownItem} onClick={() => handleFilterSelect('discipline', d)}>
                          {d}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Event: Type & Date */}
              {activeTab === 'events' && (
                <>
                  <div className={styles.dropdownWrapper}>
                    <button
                      className={`${styles.filterBtn} ${filters.type !== 'All' ? styles.activeBtn : ''}`}
                      onClick={() => toggleDropdown('type')}
                    >
                      <Filter size={14} />
                      {filters.type === 'All' ? 'Type' : filters.type}
                      <ChevronDown size={14} className={styles.chevron} />
                    </button>
                    {openDropdown === 'type' && (
                      <div className={styles.dropdown}>
                        {EVENT_TYPES.map(t => (
                          <button key={t} className={styles.dropdownItem} onClick={() => handleFilterSelect('type', t)}>
                            {t}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className={styles.dropdownWrapper}>
                    <button
                      className={`${styles.filterBtn} ${filters.date !== 'Any' ? styles.activeBtn : ''}`}
                      onClick={() => toggleDropdown('date')}
                    >
                      <span className={styles.monoLabel}>DATE:</span>
                      {filters.date === 'Any' ? 'ANYTIME' : filters.date}
                      <ChevronDown size={14} className={styles.chevron} />
                    </button>
                    {openDropdown === 'date' && (
                      <div className={styles.dropdown}>
                        {EVENT_DATES.map(d => (
                          <button key={d} className={styles.dropdownItem} onClick={() => handleFilterSelect('date', d)}>
                            {d}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className={styles.dropdownWrapper}>
                <button className={styles.filterBtn} onClick={() => toggleDropdown('sort')}>
                  <span className={styles.monoLabel}>SORT:</span> {filters.sort.toUpperCase()}
                  <ChevronDown size={14} className={styles.chevron} />
                </button>
                {openDropdown === 'sort' && (
                  <div className={styles.dropdown}>
                    {(activeTab === 'creatives' ? ARTIST_SORT : EVENT_SORT).map(s => (
                      <button key={s} className={styles.dropdownItem} onClick={() => handleFilterSelect('sort', s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.sidebarFooter}>
            <div className={styles.statusLine}>
              <span className={styles.statusDot} />
              {loading ? 'SYNCING ARCHIVE...' : `${results.total} ${activeTab === 'creatives' ? 'CREATIVES' : activeTab.toUpperCase()} ONLINE`}
            </div>

            {activeTab === 'events' && (
              <button className={styles.surpriseBtn} onClick={handleSurpriseMe}>
                Surprise me
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ── RIGHT PANE: RESULTS ──────────────────────── */}
      <section className={styles.resultsPane}>
        <div className={styles.resultsHeader}>
          <div className={styles.resultsMeta}>
            // {activeTab === 'creatives' ? 'CREATIVES' : activeTab.toUpperCase()} / {filters.city.toUpperCase()} / {filters.sort.toUpperCase()}
          </div>
        </div>

        <div className={styles.resultsScrollArea}>
          {!loading && results.data.length > 0 ? (
            <div className={activeTab === 'creatives' ? styles.uniformGrid : styles.eventEditorialGrid}>
              {results.data.map((item: any, i: number) => (
                <div key={i} className={styles.cardReveal} style={{ '--delay': `${i * 40}ms` } as any}>
                  {activeTab === 'creatives' ? (
                    <ArtistCard artist={item} />
                  ) : (
                    <EventCard item={item} />
                  )}
                </div>
              ))}
            </div>
          ) : !loading && results.data.length === 0 ? (
            <div className={styles.empty}>
              <p>NO RESULTS FOUND FOR YOUR SELECTION.</p>
            </div>
          ) : (
            <div className={styles.empty}>
              <p>SEARCHING...</p>
            </div>
          )}

        </div>
      </section>
    </div>
  );
}

function ArtistCard({ artist }: { artist: any }) {
  if (!artist?.user) return null;
  const initials = (artist.user.full_name as string)
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase();

  return (
    <Link href={`/${artist.user.username}`} className={styles.technicalCard}>
      <div className={styles.cardCover}>
        {artist.user.avatar_url ? (
          <Image
            src={artist.user.avatar_url}
            alt={artist.user.full_name}
            fill
            className={styles.cardImg}
            sizes="33vw"
          />
        ) : (
          <div className={styles.cardImgPlaceholder}>
            <span>{initials}</span>
          </div>
        )}
        <div className={styles.cardBadge}>
          <span className={styles.tag}>{artist.profile?.disciplines?.[0] || 'CREATIVE'}</span>
        </div>
      </div>
      <div className={styles.cardInfo}>
        <div className={styles.cardMeta}>
          <span>{artist.user.city?.toUpperCase() || '// LOCATION N/A'}</span>
          <span>{artist.profile?.verified ? '// VERIFIED' : ''}</span>
        </div>
        <h3 className={styles.cardName}>
          {artist.user.full_name}
        </h3>
      </div>
    </Link>
  );
}

function EventCard({ item }: { item: any }) {
  const { event } = item;
  if (!event) return null;

  return (
    <Link href={`/events/${event.slug ?? event.id}`} className={styles.editorialEventCard}>
      <div className={styles.editorialCover}>
        {event.cover_image_url && (
          <Image
            src={event.cover_image_url}
            alt={event.title}
            fill
            className={styles.editorialImg}
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        )}

        {/* Top Badges */}
        <div className={styles.editorialTopLeft}>
          <span className={styles.editorialTag}>{event.event_type.toUpperCase()}</span>
        </div>
        <div className={styles.editorialTopRight}>
          <span className={styles.editorialPrice}>
            {event.is_free ? 'FREE' : formatPKR(event.min_price)}
          </span>
        </div>

        {/* Bottom Content Overlay */}
        <div className={styles.editorialOverlay}>
          <div className={styles.editorialStatus}>// LIVE EVENT</div>
          <h3 className={styles.editorialTitle}>{event.title}</h3>
          <div className={styles.editorialMeta}>
            <span>{formatDate(event.starts_at).toUpperCase()}</span>
            <span className={styles.editorialDot}>·</span>
            <span>{event.venue_name.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
