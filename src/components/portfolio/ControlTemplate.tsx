"use client";

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRef, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import gsap from 'gsap';
import { X, ZoomIn, Maximize2, ChevronLeft, ChevronRight, ChevronDown, Mail, UserPlus, Heart, Star, User } from 'lucide-react';
import { CommissionEnquiry } from './CommissionEnquiry';
import { FollowAuthModal } from './FollowAuthModal';
import { followArtist, unfollowArtist, isFollowing } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import styles from './ControlTemplate.module.css';

interface ControlTemplateProps {
  profile: any;
  events: any;
}

interface Project {
  id: string;
  cover_image_url: string;
  title: string;
  description: string;
  discipline: string;
  format: string;
  year: number;
  items: any[];
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
  'Street Art': 'var(--color-orange)'
};

const getTagColor = (d: string) => DISCIPLINE_COLORS[d] || 'var(--color-yellow)';

export function ControlTemplate({ profile, events }: ControlTemplateProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isCommissionOpen, setIsCommissionOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isFollowed, setIsFollowed] = useState(false);
  const [followerCount, setFollowerCount] = useState<number>(profile.follower_count ?? 0);
  const [isFollowAuthOpen, setIsFollowAuthOpen] = useState(false);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewStar, setReviewStar] = useState(0);
  const [reviewBody, setReviewBody] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [localReviews, setLocalReviews] = useState<any[]>(profile.reviews || []);

  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    isFollowing(profile.user.id, user.id).then(setIsFollowed);
  }, [user, profile.user.id]);

  useEffect(() => {
    if (!user || user.id === profile.user.id) return;
    (async () => {
      const { supabase: sb } = await import('@/lib/supabase');
      const { data: { session } } = await sb.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ op: 'checkProfileReviewEligibility', revieweeId: profile.user.id }),
      });
      const data = await res.json();
      setHasReviewed(data.hasReviewed ?? false);
    })();
  }, [user, profile.user.id]);

  const handleReviewSubmit = async () => {
    if (reviewStar === 0 || reviewSubmitting) return;
    setReviewSubmitting(true);
    setReviewError(null);
    try {
      const { supabase: sb } = await import('@/lib/supabase');
      const { data: { session } } = await sb.auth.getSession();
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({ op: 'submitProfileReview', revieweeId: profile.user.id, rating: reviewStar, body: reviewBody.trim() || undefined }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      setLocalReviews(prev => [{
        id: `tmp-${Date.now()}`,
        reviewer: { id: user!.id, full_name: user!.full_name, username: user!.username, avatar_url: user!.avatar_url },
        rating: reviewStar,
        body: reviewBody.trim() || undefined,
        created_at: new Date().toISOString(),
      }, ...prev]);
      setHasReviewed(true);
    } catch (err: any) {
      setReviewError(err.message ?? 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const applyFollow = async (userId: string) => {
    try {
      await followArtist(profile.user.id, userId);
      setIsFollowed(true);
      setFollowerCount(c => c + 1);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      setIsFollowAuthOpen(true);
      return;
    }
    try {
      if (isFollowed) {
        await unfollowArtist(profile.user.id, user.id);
        setIsFollowed(false);
        setFollowerCount(c => Math.max(0, c - 1));
      } else {
        await applyFollow(user.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const projects: Project[] = profile.projects || [];

  // Create a flat list of all gallery images for navigation
  const allMedia = useMemo(() => {
    const portfolioByUrl = new Map(
      (profile.portfolio as any[]).map((p: any) => [p.image_url, p])
    );
    const media: any[] = [];
    projects.forEach((p: Project) => {
      media.push({ image_url: p.cover_image_url, title: p.title, project: p.title });
      p.items.forEach((item: any) => {
        const fallback = portfolioByUrl.get(item.image_url);
        media.push({
          ...item,
          title: item.title || fallback?.title,
          description: item.description || fallback?.description,
          project: p.title,
        });
      });
    });
    profile.portfolio.forEach((item: any) => {
      media.push({ ...item, project: 'Archive' });
    });
    return media;
  }, [projects, profile.portfolio]);

  const selectedImage = selectedIndex !== null ? allMedia[selectedIndex] : null;

  useEffect(() => {
    // GSAP Entry Animation
    const ctx = gsap.context(() => {
      gsap.from(sidebarRef.current, {
        x: -100,
        opacity: 0,
        duration: 1.2,
        ease: "expo.out"
      });
    });
    return () => ctx.revert();
  }, []);

  const openLightbox = (url: string) => {
    const idx = allMedia.findIndex(m => m.image_url === url);
    if (idx !== -1) setSelectedIndex(idx);
  };

  const nextImage = () => {
    if (selectedIndex !== null && !isAnimating) {
      setIsAnimating(true);
      setDirection(1);
      setSelectedIndex((selectedIndex + 1) % allMedia.length);
      setTimeout(() => setIsAnimating(false), 800);
    }
  };

  const prevImage = () => {
    if (selectedIndex !== null && !isAnimating) {
      setIsAnimating(true);
      setDirection(-1);
      setSelectedIndex((selectedIndex - 1 + allMedia.length) % allMedia.length);
      setTimeout(() => setIsAnimating(false), 800);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedIndex !== null) setSelectedIndex(null);
        else if (isAboutOpen) setIsAboutOpen(false);
      }
      if (selectedIndex === null) return;
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };

    const handleWheel = (e: WheelEvent) => {
      if (selectedIndex === null || isAnimating) return;
      if (Math.abs(e.deltaX) > 30 || Math.abs(e.deltaY) > 30) {
        if (e.deltaX > 0 || e.deltaY > 0) nextImage();
        else prevImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [selectedIndex, isAboutOpen, isAnimating, nextImage, prevImage]);

  const scrollToProject = (id: string) => {
    const el = document.getElementById(id);
    if (el && stageRef.current) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: "tween" as const, duration: 0.8, ease: [0.16, 1, 0.3, 1] as const },
        opacity: { duration: 0.4 }
      }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.95,
      transition: {
        x: { type: "tween" as const, duration: 0.8, ease: [0.16, 1, 0.3, 1] as const },
        opacity: { duration: 0.4 }
      }
    })
  };

  return (
    <div className={styles.container}>
      {/* ── ABOUT OVERLAY ── */}
      <AnimatePresence>
        {isAboutOpen && (
          <motion.div 
            className={styles.aboutOverlay}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <button className={styles.aboutClose} onClick={() => setIsAboutOpen(false)}>
              // CLOSE_BIOGRAPHY [ESC]
            </button>
            <div className={styles.aboutContent}>
              <div className={styles.aboutHeader}>
                <h2 className={styles.aboutTitle}>{profile.user.full_name}</h2>
                <div className={styles.aboutMeta}>
                  <span>// ORIGIN: {profile.user.city?.toUpperCase()}</span>
                  <span>// JOINED: {new Date(profile.user.created_at || Date.now()).getFullYear()}</span>
                </div>
              </div>
              <div className={styles.aboutBodySplit}>
                <div className={styles.aboutText}>
                  <p>{profile.detailed_bio || profile.profile.bio}</p>
                </div>
                <div className={styles.aboutPortraitWrapper}>
                  {profile.user.avatar_url && (
                    <img 
                      src={profile.user.avatar_url} 
                      alt={profile.user.full_name} 
                      className={styles.aboutPortrait}
                    />
                  )}
                  <div className={styles.portraitLabel}>// PROFILE_ID: {profile.user.username?.toUpperCase()}</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── IMAGE LIGHTBOX (DYNAMIC) ── */}
      <AnimatePresence initial={false} custom={direction}>
        {selectedImage && (
          <motion.div 
            className={styles.lightbox}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedIndex(null)}
          >
            <button className={styles.closeBtn} onClick={() => setSelectedIndex(null)}>
              <X size={32} />
            </button>

            <button className={styles.navBtnPrev} onClick={(e) => { e.stopPropagation(); prevImage(); }}>
              <ChevronLeft size={48} />
            </button>

            <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
              <motion.div 
                className={styles.lightboxImageWrapper}
                key={selectedIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = Math.abs(offset.x) > 100 || Math.abs(velocity.x) > 500;
                  if (swipe) {
                    if (offset.x > 0) prevImage();
                    else nextImage();
                  }
                }}
              >
                <Image
                  src={selectedImage.image_url}
                  alt={selectedImage.title || ''}
                  fill
                  className={styles.lightboxImage}
                />
              </motion.div>

              <div className={styles.lightboxMeta}>
                <span className={styles.navLabel}>// {selectedImage.project}</span>
                {selectedImage.title && <h3>{selectedImage.title}</h3>}
                <p>Curated by {profile.user.full_name}</p>
                {selectedImage.description && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, marginTop: '12px' }}>
                    {selectedImage.description}
                  </p>
                )}
                <div className={styles.lightboxCounter}>
                  {(selectedIndex ?? 0) + 1} / {allMedia.length}
                </div>
              </div>
            </div>

            <button className={styles.navBtnNext} onClick={(e) => { e.stopPropagation(); nextImage(); }}>
              <ChevronRight size={48} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LEFT PANE: CONTROL CENTER ── */}
      <aside className={styles.controlPane} ref={sidebarRef as any}>
        <div className={styles.controlContent}>
          <div className={styles.identity}>
            <h1 className={styles.name}>{profile.user.full_name}</h1>
            <div className={styles.status}>
              <span className={styles.dot} />
              {profile.profile.availability}
            </div>

            <button
              className={`${styles.headerFollowBtn} ${isFollowed ? styles.followed : ''}`}
              onClick={handleFollow}
              aria-label={isFollowed ? 'Unfollow creative' : 'Follow creative'}
            >
              <span>{isFollowed ? 'Following' : 'Follow'}</span>
            </button>
          </div>

          {/* ── DISCIPLINES ── */}
          <div className={styles.disciplines}>
            {profile.profile.disciplines?.map((d: string) => (
              <span 
                key={d} 
                className={styles.disciplineTag}
                style={{ backgroundColor: getTagColor(d) }}
              >
                {d}
              </span>
            ))}
          </div>

          <p className={styles.bio}>{profile.profile.bio}</p>

          <div className={styles.navSection} aria-label="Technical specifications">
            <span className={styles.navLabel}>// Technical Specs</span>
            <div className={styles.specsList}>
              <div className={styles.specRow}>
                <span className={styles.specLabel}>RATE:</span>
                <span className={styles.specValue}>PKR {profile.profile.starting_rate?.toLocaleString()}+</span>
              </div>
              <div className={styles.specRow}>
                <span className={styles.specLabel}>PROJECTS:</span>
                <span className={styles.specValue}>{profile.project_count}</span>
              </div>
              <div className={styles.specRow}>
                <span className={styles.specLabel}>FOLLOWERS:</span>
                <span className={styles.specValue}>{followerCount.toLocaleString()}</span>
              </div>
              <div className={styles.specRow}>
                <span className={styles.specLabel}>LOCATION:</span>
                <span className={styles.specValue}>{profile.user.city?.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <nav className={styles.navSection}>
            <button 
              className={styles.sidebarSectionHeading}
              style={{ color: 'var(--color-yellow)' }}
              onClick={() => setIsAboutOpen(true)}
              aria-label="View creative biography and technical specifications"
            >
              <span className={styles.navLabelInline}>//</span> ABOUT THE CREATIVE
            </button>

            <button 
              className={styles.sidebarSectionHeading}
              onClick={() => setIsProjectsOpen(!isProjectsOpen)}
              aria-expanded={isProjectsOpen}
            >
              <span><span className={styles.navLabelInline}>//</span> PROJECTS</span>
              <motion.div
                animate={{ rotate: isProjectsOpen ? 180 : 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <ChevronDown size={22} opacity={0.5} />
              </motion.div>
            </button>

            <AnimatePresence>
              {isProjectsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className={styles.projectsListInner}>
                    {projects.map((project: any) => (
                      <button 
                        key={project.id} 
                        className={styles.projectLink}
                        onClick={() => {
                          setIsAboutOpen(false);
                          scrollToProject(project.id);
                        }}
                        aria-label={`Scroll to project: ${project.title}`}
                      >
                        {project.title}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </nav>

          {events?.data?.length > 0 && (
            <div className={styles.navSection}>
              <h3 className={styles.sidebarSectionHeading}>
                <span className={styles.navLabelInline}>//</span> ACTIVE EVENTS
              </h3>
              <div className={styles.sidebarEvents}>
                {events.data.map((item: any) => (
                  <Link 
                    key={item.event.id} 
                    href={`/events/${item.event.slug ?? item.event.id}`}
                    className={styles.eventSidebarCard}
                  >
                    {item.event.cover_image_url && (
                      <div className={styles.eventSidebarBg}>
                        {item.event.cover_image_url && (
                          <Image 
                            src={item.event.cover_image_url} 
                            alt="" 
                            fill 
                            sizes="300px"
                          />
                        )}
                      </div>
                    )}
                    <div className={styles.eventSidebarOverlay} />
                    
                    <div className={styles.eventSidebarContent}>
                      <div className={styles.eventSidebarTop}>
                        <div className={styles.eventSidebarBadge}>LIVE</div>
                        <div className={styles.eventSidebarPrice}>
                          {item.event.is_free ? 'FREE' : `PKR ${item.event.min_price.toLocaleString()}`}
                        </div>
                      </div>
                      <h4 className={styles.eventSidebarTitle}>{item.event.title}</h4>
                      <p className={styles.eventSidebarDate}>
                        {new Date(item.event.starts_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* ── ACTION FOOTER ── */}
        <div className={styles.actionFooter}>
          <button
            className={styles.messageBtn}
            onClick={() => router.push(`/messages?recipient=${profile.user.username}`)}
          >
            <Mail size={16} />
            <span>Message</span>
          </button>
          <button
            className={styles.hireBtn}
            onClick={() => setIsCommissionOpen(true)}
          >
            <UserPlus size={16} />
            <span>Hire</span>
          </button>
        </div>
      </aside>

      {/* ── RIGHT SECTION: THE STAGE ── */}
      {/* ── RIGHT SECTION: THE STAGE ── */}
      <main className={styles.stage} ref={stageRef}>
        {/* ── REVIEWS DROPDOWN (NEW TOP POSITION) ── */}
        <section className={styles.reviewsDropdown}>
          <button 
            className={styles.dropdownHeader} 
            onClick={() => setIsReviewsOpen(!isReviewsOpen)}
            aria-expanded={isReviewsOpen}
          >
            <div className={styles.dropdownHeaderLeft}>
              <span className={styles.navLabel}>// Public Feedback</span>
              <div className={styles.avgRatingBrief}>
                <div className={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star 
                      key={i} 
                      size={12} 
                      fill={i <= profile.review_average ? 'var(--color-yellow)' : 'none'} 
                      color={i <= profile.review_average ? 'var(--color-yellow)' : 'var(--border-color)'} 
                    />
                  ))}
                </div>
                <span className={styles.avgValue}>
                  {profile.review_average.toFixed(1)} AVG · {localReviews.length} REVIEWS
                </span>
              </div>
            </div>
            <motion.div
              animate={{ rotate: isReviewsOpen ? 180 : 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <ChevronRight size={20} style={{ transform: 'rotate(90deg)', opacity: 0.5 }} />
            </motion.div>
          </button>

          <AnimatePresence>
            {isReviewsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className={styles.dropdownContent}
              >
                <div className={styles.reviewsInner}>
                  {/* form — logged-in non-owners who haven't reviewed */}
                  {user && user.id !== profile.user.id && !hasReviewed && (
                    <div className={styles.reviewSubmissionForm}>
                      <span className={styles.formLabel}>LEAVE A REVIEW</span>
                      <div className={styles.starPickerRow}>
                        {[1, 2, 3, 4, 5].map((i) => {
                          const active = i <= (reviewHover || reviewStar);
                          return (
                            <button 
                              key={i} 
                              onMouseEnter={() => setReviewHover(i)} 
                              onMouseLeave={() => setReviewHover(0)} 
                              onClick={() => setReviewStar(i)}
                              className={styles.starPickerBtn}
                            >
                              <Star size={20} fill={active ? 'var(--color-yellow)' : 'none'} color={active ? 'var(--color-yellow)' : 'var(--border-color)'} />
                            </button>
                          );
                        })}
                      </div>
                      <textarea 
                        value={reviewBody} 
                        onChange={(e) => setReviewBody(e.target.value)}
                        placeholder="Share your experience... (optional)" 
                        maxLength={500} 
                        rows={3}
                        className={styles.reviewInput}
                      />
                      <div className={styles.formActions}>
                        <span className={styles.charCount}>{reviewBody.length}/500</span>
                        <button 
                          onClick={handleReviewSubmit} 
                          disabled={reviewStar === 0 || reviewSubmitting}
                          className={styles.submitReviewBtn}
                        >
                          {reviewSubmitting ? 'SUBMITTING...' : 'SUBMIT REVIEW'}
                        </button>
                      </div>
                      {reviewError && <p className={styles.formError}>{reviewError}</p>}
                    </div>
                  )}

                  {localReviews.length > 0 ? (
                    <div className={styles.reviewsList}>
                      {localReviews.map((review: any) => (
                        <div key={review.id} className={styles.reviewCard}>
                          <div className={styles.reviewCardHeader}>
                            <div className={styles.reviewerInfo}>
                              {review.reviewer?.avatar_url
                                ? <img src={review.reviewer.avatar_url} alt="" className={styles.reviewerThumb} />
                                : (
                                  <div className={styles.reviewerThumbPlaceholder}>
                                    <User size={16} color="var(--text-faint)" strokeWidth={1.5} />
                                  </div>
                                )}
                              <div className={styles.reviewerText}>
                                <span className={styles.reviewerName}>{review.reviewer?.full_name}</span>
                                <div className={styles.reviewerStars}>
                                  {[1,2,3,4,5].map(i => <Star key={i} size={8} fill={i <= review.rating ? 'var(--color-yellow)' : 'none'} color={i <= review.rating ? 'var(--color-yellow)' : 'var(--border-color)'} />)}
                                </div>
                              </div>
                            </div>
                            <span className={styles.reviewDate}>
                              {new Date(review.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
                            </span>
                          </div>
                          {review.body && <p className={styles.reviewBodyText}>{review.body}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.noReviews}>NO REVIEWS YET.</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {projects.map((project: any, pIndex: number) => (
          <section key={project.id} id={project.id} className={styles.projectBlock}>
            <div className={styles.projectIdentity}>
               <div className={styles.projectNumberWrapper}>
                 <span className={styles.projectNumber}>0{pIndex + 1}</span>
               </div>
               <h2 className={styles.verticalTitle}>{project.title}</h2>
            </div>

            <div className={styles.bentoGrid}>
              {/* Primary Hero */}
              <div 
                className={styles.imageWrapper}
                onClick={() => openLightbox(project.cover_image_url)}
              >
                <div className={styles.imageHover}><ZoomIn size={40} /></div>
                {project.cover_image_url && (
                  <img 
                    src={project.cover_image_url} 
                    alt={project.title} 
                    className={styles.projectImage} 
                    loading={pIndex === 0 ? "eager" : "lazy"} 
                  />
                )}
              </div>

              {/* Sub items in bento pattern */}
              <div className={styles.subGrid}>
                {project.items.map((item: any) => (
                  <div 
                    key={item.id} 
                    className={styles.imageWrapper}
                    onClick={() => openLightbox(item.image_url)}
                  >
                    <div className={styles.imageHover}><Maximize2 size={24} /></div>
                    {item.image_url && (
                      <img 
                        src={item.image_url} 
                        alt={item.title} 
                        className={styles.projectImage} 
                        loading="lazy" 
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.projectInfoFooter}>
               <div className={styles.projectDescWrapper}>
                  {project.discipline && (
                    <span 
                      className={styles.projectDiscipline}
                      style={{ color: getTagColor(project.discipline), borderBottomColor: getTagColor(project.discipline) }}
                    >
                      {project.discipline}
                    </span>
                  )}
                  <p className={styles.projectDesc}>{project.description}</p>
               </div>
               <div className={styles.projectSpecs}>
                  <span>// FORMAT: {project.format?.toUpperCase() || 'N/A'}</span>
                  <span>// YEAR: {project.year || 'N/A'}</span>
                  <span>// TAG: {project.discipline?.toUpperCase()}</span>
               </div>
            </div>
          </section>
        ))}

        {/* ── ARCHIVE SECTION: DENSE GRID ── */}
        {profile.portfolio.length > 0 && (
          <section className={styles.archiveSection}>
             <div className={styles.archiveHeader}>
                <span className={styles.navLabel}>// Full Catalog</span>
                <h2 className={styles.archiveTitle}>Archive Study</h2>
             </div>
             <div className={styles.denseGrid}>
               {profile.portfolio.map((item: any, i: number) => (
                 <motion.div 
                  key={item.id} 
                  className={styles.imageWrapper}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  viewport={{ once: true }}
                  onClick={() => openLightbox(item.image_url)}
                 >
                   <div className={styles.imageHover}><Maximize2 size={20} /></div>
                   {item.image_url && (
                     <img 
                       src={item.image_url} 
                       alt={item.title} 
                       className={styles.projectImage} 
                       loading="lazy" 
                     />
                   )}
                 </motion.div>
               ))}
             </div>
          </section>
        )}


        <div style={{ height: '200px' }} />
      </main>

      {/* ── MOBILE FLOATING ACTIONS ── */}
      <div className={styles.mobileActions}>
        <button
          className={styles.mobileActionBtn}
          onClick={() => router.push(`/messages?recipient=${profile.user.username}`)}
          aria-label="Message"
        >
          <Mail size={20} />
        </button>
        <button
          className={`${styles.mobileActionBtn} ${styles.mobileHireBtn}`}
          onClick={() => setIsCommissionOpen(true)}
          aria-label="Hire"
        >
          <UserPlus size={20} />
        </button>
      </div>

      {/* Commission Modal */}
      {isCommissionOpen && (
        <CommissionEnquiry
          artist={profile}
          onClose={() => setIsCommissionOpen(false)}
        />
      )}
      {/* Follow Auth Modal */}
      {isFollowAuthOpen && (
        <FollowAuthModal
          artistName={profile.user.full_name}
          artistUsername={profile.user.username}
          onAuthenticated={(userId) => {
            setIsFollowAuthOpen(false);
            applyFollow(userId);
          }}
          onClose={() => setIsFollowAuthOpen(false)}
        />
      )}
    </div>
  );
}
