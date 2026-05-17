'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { StagdLogo } from './StagdLogo';
import styles from './AboutOverlay.module.css';

interface AboutOverlayProps {
  onClose: () => void;
}

export function AboutOverlay({ onClose }: AboutOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Stag'd Manifesto">
      <button
        className={styles.closeBtn}
        onClick={onClose}
        aria-label="Close manifesto"
      >
        <X size={20} strokeWidth={2.5} />
      </button>

      <div className={styles.paperContainer}>
        {/* White tab folder hanger clip and metal paperclip pin */}
        <div className={styles.folderTabWrapper}>
          <div className={styles.folderTab} aria-hidden="true">
            <span className={styles.tabLabelBox}>A</span>
          </div>
          <div className={styles.paperclip} aria-hidden="true">
            <div className={styles.paperclipInner} />
          </div>
        </div>

        {/* Paper sheet */}
        <div className={styles.paperSheet}>
          <span className={styles.manifestoHeader}>// MANIFESTO</span>

          <div className={styles.manifestoContent}>
            <p className={styles.manifestoParagraph}>
              IF IT LOOKS AND FEELS LIKE EVERYTHING ELSE, IT&rsquo;S NOT STAG&rsquo;D.
            </p>

            <p className={styles.manifestoParagraph}>
              PAKISTAN&rsquo;S CREATIVE ECONOMY IS NOT BACKGROUND NOISE. <br />
              IT IS RAW, UNCOMPROMISING, AND <span className={styles.manifestoHighlight}>BUILT BY HAND</span>.
            </p>

            <p className={styles.manifestoParagraph}>
              BEFORE ALGORITHMS, BEFORE INSTAGRAM STORIES, BEFORE THE ADMINISTRATIVE CHAOS—THERE WAS THE STAGE. <br />
              THOUGHTFULLY CRAFTED, OBSESSIVELY CURATED, VERIFIED IN REAL LIFE.
            </p>

            <p className={styles.manifestoParagraph}>
              EVERY CREATIVE DISCOVERED WITH RESPECT. <br />
              EVERY BRIEF HANDLED WITH CLARITY.
            </p>

            <p className={styles.manifestoParagraph}>
              THAT&rsquo;S HOW WE RUN THE CULTURE.
            </p>

            <p className={styles.manifestoParagraph}>
              WE DON&rsquo;T RELY ON FILLERS. <br />
              WE RELY ON INDEPENDENT TALENT. <br />
              WE DON&rsquo;T JUST FILL SPACES. <br />
              WE SHAPE THE NATION&rsquo;S SONIC AND VISUAL ENERGY.
            </p>

            <p className={styles.manifestoParagraph}>
              BECAUSE NO TWO CREATIVES CREATE THE SAME. <br />
              NO TWO SHOWS FEEL THE SAME. <br />
              AND NO BRIEF SHOULD BE ONE-SIZE-FITS-ALL.
            </p>

            <p className={styles.manifestoParagraph}>
              WE SHAPE THE PLATFORM SO PAKISTAN&rsquo;S CREATIVE CLASS IS UNMISTAKABLY RECORDED.
            </p>
          </div>

          <div className={styles.manifestoFooter}>
            <StagdLogo width={110} height={44} className={styles.manifestoLogo} />
            <span className={styles.tagline}>ON THE STAGE OF RECORD.</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
