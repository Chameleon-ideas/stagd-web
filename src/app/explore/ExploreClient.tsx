"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, MapPin, Briefcase, Filter } from 'lucide-react';
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

export default function ExploreClient({ initialData, initialTab }: { initialData: any, initialTab: string }) {
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [filters, setFilters] = useState<any>({
    city: 'All',
    discipline: 'All',
    type: 'All',
    date: 'Any',
    sort: activeTab === 'artists' ? 'Relevance' : 'Soonest'
  });
  
  const [results, setResults] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Fetch results
  useEffect(() => {
    async function updateResults() {
      setLoading(true);
      try {
        if (activeTab === 'artists') {
          const data = await searchArtists({
            city: filters.city !== 'All' ? filters.city : undefined,
            discipline: filters.discipline !== 'All' ? filters.discipline : undefined,
            sort: filters.sort
          });
          setResults(data);
        } else {
          const data = await searchEvents({
            city: filters.city !== 'All' ? filters.city : undefined,
            type: filters.type !== 'All' ? filters.type : undefined,
            date: filters.date !== 'Any' ? filters.date : undefined,
            sort: filters.sort
          });
          setResults(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    updateResults();
  }, [filters, activeTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setOpenDropdown(null);
    setFilters({
      city: 'All',
      discipline: 'All',
      type: 'All',
      date: 'Any',
      sort: tab === 'artists' ? 'Relevance' : 'Soonest'
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
    <div className={styles.containerLarge}>
      {/* ── Background Watermark ── */}
      <div className={styles.title}>Explore</div>

      {/* ── Integrated Navigation & Filter Row ── */}
      <div className={styles.filterRowUnified}>
        <div className={styles.filterControls}>
          
          {/* Segmented Tab Switcher (Pill Style) */}
          <div className={styles.segmentedControl}>
            <button 
              className={`${styles.segment} ${activeTab === 'artists' ? styles.activeSegment : ''}`}
              onClick={() => handleTabChange('artists')}
            >
              Artists
            </button>
            <button 
              className={`${styles.segment} ${activeTab === 'events' ? styles.activeSegment : ''}`}
              onClick={() => handleTabChange('events')}
            >
              Events
            </button>
          </div>

          <div className={styles.dividerV} />

          {/* Shared City Filter */}
          <div className={styles.dropdownWrapper}>
            <button 
              className={`${styles.filterBtn} ${filters.city !== 'All' ? styles.activeBtn : ''}`}
              onClick={() => toggleDropdown('city')}
            >
              <MapPin size={14} />
              {filters.city === 'All' ? 'Location' : filters.city}
              <ChevronDown size={14} />
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
          {activeTab === 'artists' && (
            <div className={styles.dropdownWrapper}>
              <button 
                className={`${styles.filterBtn} ${filters.discipline !== 'All' ? styles.activeBtn : ''}`}
                onClick={() => toggleDropdown('discipline')}
              >
                <Briefcase size={14} />
                {filters.discipline === 'All' ? 'Discipline' : filters.discipline}
                <ChevronDown size={14} />
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
                  <ChevronDown size={14} />
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
                  {filters.date === 'Any' ? 'Date' : filters.date}
                  <ChevronDown size={14} />
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
        </div>

        <div className={styles.filterActions}>
          {activeTab === 'events' && (
            <button className={styles.surpriseBtn} onClick={handleSurpriseMe}>
              Surprise me
            </button>
          )}
        </div>
      </div>



      {/* ── Utility Row (Results Count & Sort) ── */}
      <div className={styles.utilityRow}>
        <div className={styles.resultsCount}>
          {loading ? 'Searching...' : `${results.total} ${activeTab} available`}
        </div>

        <div className={styles.dropdownWrapper}>
          <button className={styles.sortBtn} onClick={() => toggleDropdown('sort')}>
            Sort: {filters.sort} <ChevronDown size={14} />
          </button>
          {openDropdown === 'sort' && (
            <div className={styles.dropdown} style={{ right: 0, left: 'auto' }}>
              {(activeTab === 'artists' ? ARTIST_SORT : EVENT_SORT).map(s => (
                <button key={s} className={styles.dropdownItem} onClick={() => handleFilterSelect('sort', s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Results Grid (Uniform Layout) ── */}
      <section className={styles.results}>
        {!loading && results.data.length > 0 ? (
          <div className={styles.uniformGrid}>
            {results.data.map((item: any, i: number) => {
              // Race condition safety check
              const isArtistData = !!item.user;
              const isEventData = !!item.event;

              if (activeTab === 'artists' && !isArtistData) return null;
              if (activeTab === 'events' && !isEventData) return null;

              return (
                <div key={i} className={styles.cardReveal} style={{ '--delay': `${i * 40}ms` } as any}>
                  {activeTab === 'artists' ? (
                    <ArtistCard artist={item} />
                  ) : (
                    <EventCard item={item} />
                  )}
                </div>
              );
            })}
          </div>
        ) : !loading && results.data.length === 0 ? (
          <div className={styles.empty}>
            <p>No results found for your selection.</p>
          </div>
        ) : (
          <div className={styles.empty}>
            <p>Searching...</p>
          </div>
        )}
      </section>

      {/* ── Discipline Scrollable Row (Below results) ── */}
      {activeTab === 'artists' && (
        <section className={styles.disciplineSection}>
          <div className={styles.disciplineScrollWrapper}>
            <div className={styles.disciplineGrid}>
              {DISCIPLINES.map((d, i) => {
                const colorClass = 
                  d === 'Music' ? styles.cardYellow :
                  d === 'Printmaking' ? styles.cardGreen :
                  d === 'Fashion' ? styles.cardCyan :
                  d === 'Photography' ? styles.cardYellow :
                  styles.cardNeutral;

                const counts: Record<string, number> = {
                  'Music': 4, 'Printmaking': 3, 'Street Art': 6, '3D Art': 5,
                  'Fashion': 8, 'Calligraphy': 4, 'Visual Arts': 12, 'Photography': 7
                };

                return (
                  <button 
                    key={d} 
                    className={`${styles.disciplineCard} ${colorClass}`}
                    onClick={() => handleFilterSelect('discipline', d)}
                  >
                    <span className={styles.cardMeta}>// {counts[d] || 0}</span>
                    <h3 className={styles.cardTitle}>{d}</h3>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function ArtistCard({ artist }: { artist: any }) {
  if (!artist?.user) return null;

  return (
    <Link href={`/${artist.user.username}`} className="event-card" style={{ display: 'block' }}>
      <div className="event-card__cover" style={{ position: 'relative', width: '100%', aspectRatio: '4/5' }}>
        <Image
          src={artist.user.avatar_url || '/images/default-avatar.png'}
          alt={artist.user.full_name}
          fill
          className="avatar"
          sizes="33vw"
          style={{ objectFit: 'cover' }}
        />
        <div className="event-card__top">
          <span className="chip chip-ink">{artist.profile?.disciplines?.[0] || 'Artist'}</span>
          {artist.profile?.verified && <span className="chip chip-yellow">VERIFIED</span>}
        </div>
        <div className="event-card__body">
          <span className="event-card__meta">{artist.user.city}</span>
          <h3 className="event-card__title">
            {artist.user.full_name}
          </h3>
        </div>
      </div>
    </Link>
  );
}

function EventCard({ item }: { item: any }) {
  const { event } = item;
  if (!event) return null;

  return (
    <Link href={`/events/${event.id}`} className="event-card" style={{ display: 'block' }}>
      <div className="event-card__cover" style={{ position: 'relative', width: '100%', aspectRatio: '1/1' }}>
        <Image
          src={event.cover_image_url ?? ""}
          alt={event.title}
          fill
          className="avatar"
          sizes="33vw"
          style={{ objectFit: 'cover' }}
        />
        <div className="event-card__top">
          <span className={`chip chip-${event.event_type.toLowerCase()}`}>{event.event_type}</span>
          <span className="chip chip-price">{event.is_free ? 'FREE' : formatPKR(event.min_price)}</span>
        </div>
        <div className="event-card__body">
          <span className="event-card__meta">{formatDate(event.starts_at)} · {event.venue_name}</span>
          <h3 className="event-card__title">
            {event.title}
          </h3>
        </div>
      </div>
    </Link>
  );
}
