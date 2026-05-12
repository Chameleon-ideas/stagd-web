'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, ExternalLink, CheckCircle, Star, MapPin,
  Edit3, Calendar, MessageSquare, ArrowRight, Image as ImageIcon,
  User,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { ArtistPublicProfile, PaginatedResponse, EventSearchResult } from '@/lib/types';
import Lightbox, { LightboxItem } from './Lightbox';
import styles from './ProfilePage.module.css';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { GSAPEntrance } from '@/components/animations/GSAPEntrance';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const DISCIPLINE_COLORS: Record<string, string> = {
  'Food Photography': 'var(--color-orange)',
  'Product Photography': 'var(--color-yellow)',
  'Marketing Content': 'var(--color-cyan)',
  'Product Design': 'var(--color-lime)',
  'Studio': 'var(--color-red)',
  'Photography': 'var(--color-orange)',
  'Fashion': 'var(--color-pink)',
  'Textile Design': 'var(--color-cyan)',
  'Calligraphy': 'var(--color-yellow)',
  'Visual Arts': 'var(--color-lime)',
  'Journalism': 'var(--color-red)',
  'Street Art': 'var(--color-orange)',
};
const getTagColor = (d: string) => DISCIPLINE_COLORS[d] || 'var(--color-yellow)';

interface ProfileClientProps {
  username: string;
  profile: ArtistPublicProfile;
  events: PaginatedResponse<EventSearchResult>;
}

export default function ProfileClient({ username, profile: initialProfile, events }: ProfileClientProps) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [profile, setProfile] = useState(initialProfile);
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxItems, setLightboxItems] = useState<LightboxItem[]>([]);
  const [draftEvents, setDraftEvents] = useState<any[]>([]);
  const [isSticky, setIsSticky] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll listener for sticky actions
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 150) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initial Header & Bio reveal
  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out', duration: 0.8 } });
    tl.from(`.${styles.header}`, { y: 20, opacity: 0, clearProps: 'all' })
      .from(`.${styles.bioSection}`, { y: 20, opacity: 0, clearProps: 'all' }, '-=0.6');
  }, { scope: containerRef });

  const isOwner = !isAuthLoading && user?.username === username;
  const isCreative = profile.user.role === 'creative' || profile.user.role === 'both';
  const initials = profile.user.full_name.split(' ').map(n => n[0]).join('').toUpperCase();

  // Draft events — owner only, client-side (requires auth)
  useEffect(() => {
    if (!user || isAuthLoading || user.username !== username) return;
    const loadDrafts = async () => {
      const { supabase: sb } = await import('@/lib/supabase');
      const { data: { session } } = await sb.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ op: 'getMyDraftEvents' }),
      });
      const result = await res.json();
      if (!result.error) setDraftEvents(result.drafts ?? []);
    };
    loadDrafts();
  }, [user, isAuthLoading, username]);

  const openLightbox = (allItems: LightboxItem[], startIdx: number) => {
    setLightboxItems(allItems);
    setLightboxIndex(startIdx);
  };

  const handleLightboxUpdate = (itemId: string, updates: { title?: string; description?: string }) => {
    setLightboxItems(prev => prev.map(i => i.itemId === itemId ? { ...i, ...updates } : i));
    setProfile(prev => ({
      ...prev,
      portfolio: prev.portfolio.map(p => p.id === itemId ? { ...p, ...updates } : p),
      projects: prev.projects.map(proj => ({
        ...proj,
        items: proj.items.map(pi => pi.id === itemId ? { ...pi, ...updates } : pi),
      })),
    }));
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.inner}>

        {/* ── HEADER ── */}
        <header className={styles.header}>
          <div className={styles.avatarWrapper}>
            {profile.user.avatar_url
              ? <img src={profile.user.avatar_url} alt={profile.user.full_name} className={styles.avatar} />
              : <User className={styles.avatarPlaceholder} size={48} strokeWidth={1} />}
          </div>

          <div className={styles.headerInfo}>
            <div className={styles.nameRow}>
              <h1 className={styles.name}>{profile.user.full_name}</h1>
              {profile.profile.verified && <CheckCircle className={styles.verified} size={20} />}
            </div>
            <div className={styles.username}>@{profile.user.username}</div>
            <div className={styles.metaRow}>
              <span className={styles.roleBadge}>// {profile.user.role.toUpperCase()}</span>
              {profile.user.city && (
                <span className={styles.location}><MapPin size={10} style={{ marginRight: 4 }} />{profile.user.city}</span>
              )}
              {isCreative && (
                <span className={`${styles.statusPill} ${styles[`status${profile.profile.availability.charAt(0).toUpperCase() + profile.profile.availability.slice(1)}` as keyof typeof styles]}`}>
                  {profile.profile.availability}
                </span>
              )}
            </div>
          </div>

          <div className={styles.headerActions}>
            {isOwner && (
              <>
                {/* Static Header Actions (Always in flow to prevent jump) */}
                <div className={`${styles.actionRow} ${isSticky ? styles.actionRowHidden : ''}`}>
                  <Link href="/profile/edit" className={`${styles.actionBtn} ${styles.editBtn}`}>
                    <Edit3 size={15} />Edit Profile
                  </Link>
                  <Link href="/profile/manage" className={`${styles.actionBtn} ${styles.manageBtn}`}>
                    <ImageIcon size={15} />Manage Work
                  </Link>
                  <Link href={`/${username}`} className={`${styles.actionBtn} ${styles.viewBtn}`}>
                    <ExternalLink size={15} />View Portfolio
                  </Link>
                </div>

                {/* Sticky Floating Sidebar (Fixed, appears on scroll) */}
                <AnimatePresence>
                  {isSticky && (
                    <motion.div 
                      className={styles.actionRowSticky}
                      initial={{ x: 100, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 100, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <Link href="/profile/edit" className={`${styles.actionBtn} ${styles.editBtn}`}>
                        <Edit3 size={15} />Edit Profile
                      </Link>
                      <Link href="/profile/manage" className={`${styles.actionBtn} ${styles.manageBtn}`}>
                        <ImageIcon size={15} />Manage Work
                      </Link>
                      <Link href={`/${username}`} className={`${styles.actionBtn} ${styles.viewBtn}`}>
                        <ExternalLink size={15} />View Portfolio
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
            {isCreative && (
              <div className={styles.compactStats}>
                <div className={styles.compactStatItem}>
                  <span className={styles.compactStatValue}>{profile.follower_count}</span>
                  <span className={styles.compactStatLabel}>Followers</span>
                </div>
                <div className={styles.compactStatItem}>
                  <span className={styles.compactStatValue}>{profile.project_count}</span>
                  <span className={styles.compactStatLabel}>Projects</span>
                </div>
                <div className={styles.compactStatItem}>
                  <div className={styles.compactStatValue}>
                    {profile.review_average.toFixed(1)}
                    <Star size={14} fill="currentColor" style={{ marginLeft: 4, verticalAlign: 'baseline' }} />
                  </div>
                  <span className={styles.compactStatLabel}>{profile.review_count} Reviews</span>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* ── BIO & SOCIALS ── */}
        <div className={styles.bioSection}>
          <div className={styles.bioMain}>
            <div className={styles.bioContent}>
              <p className={styles.bioShort}>{profile.profile.bio}</p>
              {profile.detailed_bio && (
                <div className={styles.bioDetailed}>
                  <p>{isBioExpanded ? profile.detailed_bio : `${profile.detailed_bio.substring(0, 200)}...`}</p>
                  <button onClick={() => setIsBioExpanded(!isBioExpanded)} className="btn btn-ghost btn-sm" style={{ marginTop: 8, paddingLeft: 0, height: 'auto', textDecoration: 'underline' }}>
                    {isBioExpanded ? 'Read less' : 'Read more'}
                  </button>
                </div>
              )}
              <div className={styles.disciplines}>
                {profile.profile.disciplines.map(d => (
                  <span key={d} className={styles.disciplineTag} style={{ backgroundColor: getTagColor(d) }}>{d}</span>
                ))}
              </div>
            </div>
            {isCreative && (
              <div className={styles.socialIndex}>
                <span className={styles.navLabel}>// Social Index</span>
                <div className={styles.socialList}>
                  {profile.profile.instagram_handle && <a href={`https://instagram.com/${profile.profile.instagram_handle}`} target="_blank" rel="noopener" className={styles.socialLink}><Globe size={14} /> Instagram</a>}
                  {profile.social_links?.behance && <a href={profile.social_links.behance} target="_blank" rel="noopener" className={styles.socialLink}><Globe size={14} /> Behance</a>}
                  {profile.social_links?.linkedin && <a href={profile.social_links.linkedin} target="_blank" rel="noopener" className={styles.socialLink}><Globe size={14} /> LinkedIn</a>}
                  {profile.social_links?.website && <a href={profile.social_links.website} target="_blank" rel="noopener" className={styles.socialLink}><ExternalLink size={14} /> Portfolio Site</a>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── PORTFOLIO GRID ── */}
        {isCreative && (
          <section className={styles.section}>
            <GSAPEntrance selector={`.${styles.sectionHeader}`} start="top 95%">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionLabel}>// 01</span>
                <h2 className={styles.sectionTitle}>Portfolio</h2>
              </div>
            </GSAPEntrance>
            
            {profile.portfolio.length > 0 ? (
              <GSAPEntrance selector={`.${styles.portfolioItem}`} stagger={0.04}>
                <div className={styles.portfolioGrid}>
                  {profile.portfolio.map((item, idx) => {
                    const matchingProject = profile.projects.find(p => p.items?.some(pi => pi.image_url === item.image_url));
                    const navItems: LightboxItem[] = profile.portfolio.map((p) => {
                      const mp = profile.projects.find(pr => pr.items?.some(pi => pi.image_url === p.image_url));
                      return {
                        image_url: p.image_url, title: p.title, description: p.description,
                        itemId: p.id, isProjectItem: false,
                        projectContext: mp ? { title: mp.title, discipline: mp.discipline, format: mp.format, year: mp.year, location: mp.location, description: mp.description } : undefined,
                      };
                    });
                    return (
                      <div key={item.id} className={styles.portfolioItem} onClick={() => openLightbox(navItems, idx)}>
                        <img src={item.image_url} alt={item.title || 'Work'} className={styles.portfolioImage} />
                      </div>
                    );
                  })}
                </div>
              </GSAPEntrance>
            ) : <div className={styles.emptyState}>No portfolio items yet</div>}
          </section>
        )}

        {isCreative && (
          <section className={styles.section}>
            <GSAPEntrance selector={`.${styles.sectionHeader}`} start="top 95%">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionLabel}>// 02</span>
                <h2 className={styles.sectionTitle}>Projects</h2>
              </div>
            </GSAPEntrance>

            {profile.projects.length > 0 ? (
              <GSAPEntrance selector={`.${styles.projectCard}`} stagger={0.06}>
                <div className={styles.projectsList}>
                  {profile.projects.map((project) => {
                    const projCtx = { title: project.title, discipline: project.discipline, format: project.format, year: project.year, location: project.location, description: project.description };
                    const projNavItems: LightboxItem[] = (project.items || []).map(pi => ({ image_url: pi.image_url, title: pi.title, description: pi.description, itemId: pi.id, isProjectItem: true, projectContext: projCtx }));
                    return (
                      <div key={project.id} className={styles.projectCard}>
                        {project.cover_image_url && (
                          <img src={project.cover_image_url} alt={project.title} className={styles.projectCover} onClick={() => projNavItems.length > 0 && openLightbox(projNavItems, 0)} style={{ cursor: projNavItems.length > 0 ? 'pointer' : 'default' }} />
                        )}
                        <div className={styles.projectBody}>
                          <h3 className={styles.projectTitle}>{project.title}</h3>
                          <div className={styles.projectMeta}>
                            {project.format && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-faint)' }}>// FORMAT: {project.format.toUpperCase()}</span>}
                            {project.year && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-faint)' }}>// YEAR: {project.year}</span>}
                            {project.discipline && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-faint)' }}>// TAG: {project.discipline}</span>}
                          </div>
                          {project.description && <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.5 }}>{project.description}</p>}
                          {projNavItems.length > 0 && (
                            <div className={styles.projectThumbRow}>
                              {projNavItems.slice(0, 5).map((pi, i) => (
                                <div key={pi.itemId} className={styles.projectThumb} onClick={() => openLightbox(projNavItems, i)}>
                                  <img src={pi.image_url} alt={pi.title || ''} />
                                </div>
                              ))}
                              {projNavItems.length > 5 && (
                                <div className={styles.projectThumb} style={{ background: 'var(--bg-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', cursor: 'pointer' }} onClick={() => openLightbox(projNavItems, 5)}>
                                  +{projNavItems.length - 5}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GSAPEntrance>
            ) : <div className={styles.emptyState}>No projects yet</div>}
          </section>
        )}

        {/* ── DRAFT EVENTS (owner only) ── */}
        {isOwner && draftEvents.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionLabel}>// DRAFTS</span>
              <h2 className={styles.sectionTitle}>Unpublished Events</h2>
            </div>
            <div className={styles.eventsGrid}>
              {draftEvents.map((draft) => (
                <div key={draft.id} className={styles.eventCard} style={{ opacity: 0.75, position: 'relative' }}>
                  <span style={{ position: 'absolute', top: 12, right: 12, fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.1em', background: 'var(--color-yellow)', color: '#111', padding: '3px 8px', textTransform: 'uppercase' }}>DRAFT</span>
                  <h3 className={styles.eventTitle}>{draft.title || 'Untitled Event'}</h3>
                  <div className={styles.eventMeta} style={{ textTransform: 'uppercase' }}>{draft.event_type?.replace('_', ' ')}{draft.venue_name ? ` · ${draft.venue_name}` : ''}</div>
                  <div className={styles.eventMeta}>Last edited {new Date(draft.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                  <Link href={`/events/create?draft=${draft.id}`} style={{ display: 'inline-block', marginTop: 'auto', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-yellow)', textDecoration: 'none', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Continue editing →
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── UPCOMING EVENTS ── */}
        {events?.data.length > 0 && (
          <section className={styles.section}>
            <GSAPEntrance selector={`.${styles.sectionHeader}`} start="top 95%">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionLabel}>// 03</span>
                <h2 className={styles.sectionTitle}>Upcoming Events</h2>
              </div>
            </GSAPEntrance>

            <GSAPEntrance selector={`.${styles.eventCard}`} stagger={0.08}>
              <div className={styles.eventsGrid}>
                {events.data.map((item) => (
                  <Link key={item.event.id} href={`/events/${item.event.slug ?? item.event.id}`} className={styles.eventCardLink}>
                    <div className={styles.eventCard}>
                      <div className={styles.cardHeaderFurniture}>
                        <span className={styles.categoryBadge}>{item.event.event_type?.toUpperCase()}</span>
                        <div className={styles.priceChip}>
                          {item.event.is_free ? 'FREE' : `PKR ${item.event.min_price.toLocaleString()}`}
                        </div>
                      </div>

                      <img src={item.event.cover_image_url || '/images/festival.png'} alt={item.event.title} className={styles.eventImage} />
                      <div className={styles.editorialGradientOverlay} />
                      
                      <div className={styles.eventContent}>
                        <span className={styles.eventSerial}>// LIVE EVENT</span>
                        <h3 className={styles.eventTitle}>{item.event.title}</h3>
                        <div className={styles.eventMetadataRow}>
                          {new Date(item.event.starts_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase()} 
                          <span className={styles.dotSeparator}>·</span> 
                          {item.event.venue_name?.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </GSAPEntrance>
          </section>
        )}

        {/* ── REVIEWS ── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>// 04</span>
            <h2 className={styles.sectionTitle}>Reviews</h2>
          </div>

          {profile.reviews.length > 0 ? (
            <div className={styles.reviewsList}>
              {profile.reviews.map((review) => (
                <div key={review.id} className={styles.reviewItem}>
                  <div className={styles.reviewHeader}>
                    {review.reviewer.avatar_url
                      ? <img src={review.reviewer.avatar_url} alt={review.reviewer.full_name} className={styles.reviewerAvatar} />
                      : <div className={styles.reviewerAvatar} style={{ background: 'var(--bg-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>{review.reviewer.full_name[0]}</div>}
                    <div className={styles.reviewerInfo}>
                      <div className={styles.reviewerName}>{review.reviewer.full_name}</div>
                      <div className={styles.reviewRating}>{[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < review.rating ? 'currentColor' : 'none'} />)}</div>
                    </div>
                    <div className={styles.sectionLabel}>{new Date(review.created_at).toLocaleDateString('en-GB')}</div>
                  </div>
                  {review.body && <p className={styles.reviewBody}>{review.body}</p>}
                </div>
              ))}
            </div>
          ) : <div className={styles.emptyState}>No reviews yet</div>}
        </section>

        <div style={{ height: '100px' }} />
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && lightboxItems.length > 0 && (
          <Lightbox
            items={lightboxItems}
            startIndex={lightboxIndex}
            isOwner={isOwner}
            artistName={profile.user.full_name}
            onClose={() => setLightboxIndex(null)}
            onItemUpdate={handleLightboxUpdate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
