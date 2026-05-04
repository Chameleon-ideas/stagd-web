"use client";

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRef, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { X, ZoomIn, Maximize2, ChevronLeft, ChevronRight, Mail, UserPlus } from 'lucide-react';
import { CommissionEnquiry } from './CommissionEnquiry';
import styles from './ControlTemplate.module.css';

interface ControlTemplateProps {
  profile: any;
  events: any;
}

const DISCIPLINE_COLORS: Record<string, string> = {
  'Food Photography': 'var(--color-orange)',
  'Product Photography': 'var(--color-yellow)',
  'Marketing Content': 'var(--color-cyan)',
  'Product Design': 'var(--color-lime)',
  'Studio': 'var(--color-red)'
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
  
  const projects = profile.projects || [];

  // Create a flat list of all gallery images for navigation
  const allMedia = useMemo(() => {
    const media: any[] = [];
    projects.forEach(p => {
      media.push({ image_url: p.cover_image_url, title: p.title, project: p.title });
      p.items.forEach((item: any) => {
        media.push({ ...item, project: p.title });
      });
    });
    profile.portfolio.forEach(item => {
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
    let lastWheelTime = 0;
    const handleWheel = (e: WheelEvent) => {
      if (selectedIndex === null || isAnimating) return;
      
      // Horizontal or Vertical flick
      if (Math.abs(e.deltaX) > 30 || Math.abs(e.deltaY) > 30) {
        if (e.deltaX > 0 || e.deltaY > 0) nextImage();
        else prevImage();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'Escape') setSelectedIndex(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [selectedIndex, nextImage, prevImage]);

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
        x: { type: "tween", duration: 0.8, ease: [0.16, 1, 0.3, 1] }, // Custom expoOut
        opacity: { duration: 0.4 }
      }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.95,
      transition: {
        x: { type: "tween", duration: 0.8, ease: [0.16, 1, 0.3, 1] },
        opacity: { duration: 0.4 }
      }
    })
  };

  return (
    <div className={styles.container}>
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
                  alt={selectedImage.title} 
                  fill
                  className={styles.lightboxImage}
                />
              </motion.div>

              <div className={styles.lightboxMeta}>
                <span className={styles.navLabel}>// {selectedImage.project}</span>
                <h3>{selectedImage.title || 'Untitled Work'}</h3>
                <p>Curated by {profile.user.full_name} · 2024</p>
                <div className={styles.lightboxCounter}>
                  {selectedIndex + 1} / {allMedia.length}
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

          <nav className={styles.navSection}>
            <span className={styles.navLabel}>// Project Index</span>
            {projects.map((project: any) => (
              <button 
                key={project.id} 
                className={styles.projectLink}
                onClick={() => scrollToProject(project.id)}
              >
                {project.title}
              </button>
            ))}
          </nav>

          <div className={styles.navSection}>
            <span className={styles.navLabel}>// Technical Specs</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-faint)' }}>
              <p>Rate: PKR {profile.profile.starting_rate?.toLocaleString()}+</p>
              <p>Projects: {profile.project_count}</p>
              <p>Location: {profile.user.city}</p>
            </div>
          </div>

          {events?.data?.length > 0 && (
            <div className={styles.navSection}>
              <span className={styles.navLabel}>// Active Events</span>
              {events.data.map((item: any) => (
                <div key={item.event.id} style={{ marginBottom: '12px' }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '14px', textTransform: 'uppercase' }}>{item.event.title}</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', opacity: 0.6 }}>{new Date(item.event.starts_at).toLocaleDateString()}</p>
                </div>
              ))}
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
      <main className={styles.stage} ref={stageRef}>
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
                className={`${styles.imageWrapper} ${styles.heroImage}`}
                onClick={() => openLightbox(project.cover_image_url)}
              >
                <div className={styles.imageHover}><ZoomIn size={40} /></div>
                <Image src={project.cover_image_url} alt={project.title} fill className={styles.projectImage} priority={pIndex === 0} />
              </div>

              {/* Sub items in bento pattern */}
              <div className={styles.subGrid}>
                {project.items.map((item: any, i: number) => (
                  <div 
                    key={item.id} 
                    className={`${styles.imageWrapper} ${i % 3 === 0 ? styles.tall : ''}`}
                    onClick={() => openLightbox(item.image_url)}
                  >
                    <div className={styles.imageHover}><Maximize2 size={24} /></div>
                    <Image src={item.image_url} alt={item.title} fill className={styles.projectImage} />
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
                  <span>// FORMAT: DIGITAL 35MM</span>
                  <span>// YEAR: 2024</span>
                  <span>// TAG: {project.discipline}</span>
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
                   <Image src={item.image_url} alt={item.title} fill className={styles.projectImage} />
                 </motion.div>
               ))}
             </div>
          </section>
        )}

        {/* Spacer for bottom */}
        <div style={{ height: '200px' }} />
      </main>
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
