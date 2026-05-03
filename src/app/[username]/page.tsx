"use client";

import { use, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Mail, ArrowRight } from 'lucide-react';
import { getArtistProfile, getArtistEvents } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CommissionEnquiry } from '@/components/portfolio/CommissionEnquiry';
import styles from './page.module.css';

interface ArtistPageProps {
  params: Promise<{ username: string }>;
}

export default function ArtistPage({ params }: ArtistPageProps) {
  const { username } = use(params);
  const [isCommissionOpen, setIsCommissionOpen] = useState(false);
  
  // In a real app, this would be a server component or use Suspense
  // For this demo, we'll use the mock data directly
  const profile = use(getArtistProfile(username));
  const events = use(getArtistEvents(profile.user.id));

  if (!profile) return <div>Artist not found</div>;

  return (
    <div className={styles.page}>
      <Header />
      
      <main className={styles.main}>
        {/* ─── Left Column: Info ─── */}
        <aside className={styles.leftColumn}>
          
          {/* Editorial ID Block */}
          <div className={styles.idBlock}>
            <Image 
              src={profile.user.avatar_url || '/images/default-avatar.png'} 
              alt={profile.user.full_name}
              width={80}
              height={80}
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

          <h1 className={styles.name}>{profile.user.full_name}</h1>
          <p className={styles.bio}>{profile.profile.bio}</p>

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

          {/* Upcoming Event (if any) */}
          {events.data.length > 0 && (
            <div className={styles.eventsSection}>
              <div className={styles.sectionHeader}>// Upcoming Event</div>
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
              <Link href="/explore?tab=events" className="btn btn-text" style={{ marginTop: '16px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                View all events ({events.total}) <ArrowRight size={12} style={{ marginLeft: '4px' }} />
              </Link>
            </div>
          )}
        </aside>

        {/* ─── Right Column: Media ─── */}
        <section className={styles.rightColumn}>
          {profile.portfolio.map((item, i) => (
            <div key={item.id} style={{ width: '100%', position: 'relative', aspectRatio: i === 0 ? '1/1' : '16/9' }}>
              <Image 
                src={item.image_url} 
                alt={item.title || 'Portfolio work'}
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>
          ))}
        </section>
      </main>

      {/* ─── Floating Actions (Moved outside main for true fixed positioning) ─── */}
      <div className={styles.floatingActions}>
        <button className={styles.messageBtn} onClick={() => window.location.href = '/messages'}>
          <Mail size={20} />
        </button>
        <button className={styles.hireBtn} onClick={() => setIsCommissionOpen(true)}>
          Hire
        </button>
      </div>

      {/* Commission Modal */}
      {isCommissionOpen && (
        <CommissionEnquiry 
          artist={profile} 
          onClose={() => setIsCommissionOpen(false)} 
        />
      )}

      <Footer />
    </div>
  );
}
