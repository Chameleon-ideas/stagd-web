'use client';

import { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './ShareButton.module.css';

export function ShareButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/events/${slug}`;
    
    // Check if it's a mobile device with native share capabilities
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    try {
      if (isMobile && navigator.share) {
        await navigator.share({
          title: document.title,
          text: `Check out this event on Stagd: ${document.title}`,
          url
        });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      // User cancelled or error
      console.log('Share failed:', err);
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`${styles.shareBtn} ${copied ? styles.copied : ''}`}
      aria-label="Share event"
    >
      <div className={styles.icon}>
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.div
              key="check"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Check size={14} strokeWidth={3} />
            </motion.div>
          ) : (
            <motion.div
              key="share"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Share2 size={14} strokeWidth={2.5} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={styles.labelContainer}>
        <span className={`${styles.label} ${copied ? styles.labelActive : ''}`}>
          SHARE
        </span>
        <span className={`${styles.label} ${copied ? styles.labelActive : ''}`}>
          COPIED
        </span>
      </div>
    </button>
  );
}
