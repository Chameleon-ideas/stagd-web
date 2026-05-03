"use client";

import { useState, useEffect, useRef, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Mail, ArrowRight } from 'lucide-react';
import { getArtistProfile, getArtistEvents } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { CommissionEnquiry } from '@/components/portfolio/CommissionEnquiry';
import styles from './page.module.css';

interface ArtistPageProps {
  params: Promise<{ username: string }>;
}

export default function ArtistPage({ params }: ArtistPageProps) {
  const { username } = use(params);
  const scrollRef = useRef<HTMLElement>(null);
  
  const [isCommissionOpen, setIsCommissionOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [events, setEvents] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const p = await getArtistProfile(username);
        setProfile(p);
        if (p) {
          const e = await getArtistEvents(p.user.id);
          setEvents(e);
        }
      } catch (err) {
        console.error('Failed to load artist profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [username]);

  // ─── SCROLL SYNC: Vertical to Horizontal ───
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (scrollRef.current && window.innerWidth > 1024) {
        // Prevent default vertical scroll and move horizontally
        e.preventDefault();
        scrollRef.current.scrollLeft += e.deltaY;
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  if (loading) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.main} style={{ alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase' }}>
            Initializing installation...
          </p>
        </main>
      </div>
    );
  }

  if (!profile) return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p>Portfolio not found</p>
      </main>
    </div>
  );

  return (
    <div className={styles.page}>
      <Header />
      
      <main className={styles.main}>
        {/* ─── Left Column: Editorial Info (Locked) ─── */}
        <aside className={styles.leftColumn}>
          <div className={styles.topMeta}>
            <div className={styles.idBlock}>
              <Image 
                src={profile.user.avatar_url || '/images/default-avatar.png'} 
                alt={profile.user.full_name}
                width={56}
                height={56}
                className={styles.avatarSquare}
              />
              <div className={styles.statusMetadata}>
                <div className={styles.availability}>
                  <span className={styles.dot}></span>
                  Available
                </div>
                <div className={styles.location}>{profile.user.city}</div>
              </div>
            </div>

            <div>
              <h1 className={styles.name}>{profile.user.full_name}</h1>
              <p className={styles.bio}>{profile.profile.bio}</p>
            </div>

            <div className={styles.stats}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{profile.project_count}</span>
                <span className={styles.statLabel}>Projects</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{profile.follower_count}</span>
                <span className={styles.statLabel}>Followers</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{profile.review_average}</span>
                <span className={styles.statLabel}>Rating</span>
              </div>
            </div>
          </div>

          {/* Upcoming Event (Clickable & Anchored) */}
          {events?.data?.length > 0 && (
            <div className={styles.eventsSection}>
              <div className={styles.sectionHeader}>// Upcoming Event</div>
              <Link href={`/events/${events.data[0].event.id}`} style={{ textDecoration: 'none' }}>
                <div className={styles.eventCard}>
                  <div className={styles.dateBlock}>
                    <span className={styles.day}>{new Date(events.data[0].event.starts_at).getDate()}</span>
                    <span className={styles.month}>{new Date(events.data[0].event.starts_at).toLocaleString('default', { month: 'short' })}</span>
                  </div>
                  <div className={styles.eventInfo}>
                    <span className={styles.eventTitle}>{events.data[0].event.title}</span>
                    <span className={styles.eventMeta}>
                      {events.data[0].event.venue_name} · {events.data[0].event.city}
                    </span>
                  </div>
                </div>
              </Link>
              <Link href="/explore" className="btn btn-text" style={{ marginTop: '12px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-faint)' }}>
                View Full Schedule <ArrowRight size={10} />
              </Link>
            </div>
          )}
        </aside>

        {/* ─── Right Column: Horizontal Scroll Showcase (Synced) ─── */}
        <section className={styles.rightColumn} ref={scrollRef as any}>
          {profile.portfolio.map((item: any, i: number) => (
            <div key={item.id} className={styles.portfolioItem}>
              <Image 
                src={item.image_url} 
                alt={item.title || 'Portfolio work'}
                fill
                className={styles.portfolioImage}
                priority={i === 0}
              />
              {/* Minimal Top-Right Mono Overlay */}
              <div className={styles.projectOverlay}>
                <span>{item.category || 'Featured'}</span> · {item.title || 'Project'}
              </div>
            </div>
          ))}
        </section>
      </main>

      {/* ─── Floating Actions ─── */}
      <div className={styles.floatingActions}>
        <button className={styles.messageBtn} onClick={() => window.location.href = `/messages?recipient=${profile.user.username}`}>
          <Mail size={18} />
        </button>
        <button className={styles.hireBtn} onClick={() => setIsCommissionOpen(true)}>
          Hire Artist
        </button>
      </div>

      {/* Commission Modal */}
      {isCommissionOpen && (
        <CommissionEnquiry 
          artist={profile} 
          onClose={() => setIsCommissionOpen(false)} 
        />
      )}
    </div>
  );
}
