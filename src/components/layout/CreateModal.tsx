"use client";
import { useState } from 'react';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './CreateModal.module.css';

interface Option {
  num: string;
  label: string;
  desc: string;
  bg: string;
  color: string;
  href: string | null;
  soon?: boolean;
}

const OPTIONS: Option[] = [
  {
    num: '// 01',
    label: 'BRIEF',
    desc: 'Send a structured booking request to a creative.',
    bg: '#FFDE0D',
    color: '#111111',
    href: '/explore',
  },
  {
    num: '// 02',
    label: 'OPEN CALL',
    desc: 'Post a gig — get applications from vetted creatives.',
    bg: '#649839',
    color: '#ffffff',
    href: null,
    soon: true,
  },
  {
    num: '// 03',
    label: 'EVENT',
    desc: 'List a show, opening, or set on the city feed.',
    bg: '#F4F1E6',
    color: '#111111',
    href: '/events/create',
  },
  {
    num: '// 04',
    label: 'POST WORK',
    desc: 'Add to your portfolio. Goes to your followers.',
    bg: '#1CAEE5',
    color: '#111111',
    href: '/profile/manage',
  },
];

export function CreateModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);

  const handleOption = async (href: string | null) => {
    if (!href) return;
    setIsExiting(true);
    // Short delay for exit animation
    await new Promise(resolve => setTimeout(resolve, 400));
    onClose();
    router.push(href);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0, scale: 0.98 },
    visible: { 
      y: 0, 
      opacity: 1, 
      scale: 1,
      transition: { type: 'spring', damping: 25, stiffness: 200 }
    },
    exit: { 
      y: -20, 
      opacity: 0, 
      scale: 0.98,
      transition: { duration: 0.3, ease: 'easeInOut' }
    }
  };

  return (
    <motion.div 
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className={styles.topBar}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
        <span className={styles.topLabel}>// MAKE SOMETHING</span>
      </div>

      <div className={styles.content}>
        <motion.div 
          className={styles.options}
          variants={containerVariants}
          initial="hidden"
          animate={isExiting ? "exit" : "visible"}
        >
          {OPTIONS.map((opt) => (
            <motion.button
              key={opt.num}
              variants={cardVariants}
              className={styles.option}
              style={{ background: opt.bg, color: opt.color }}
              onClick={() => handleOption(opt.href)}
              disabled={!!opt.soon}
              whileHover={{ scale: 1.01, filter: 'brightness(1.05)' }}
              whileTap={{ scale: 0.99 }}
            >
              <span className={styles.optNum}>{opt.num}</span>
              <strong className={styles.optLabel}>{opt.label}</strong>
              <span className={styles.optDesc}>{opt.desc}</span>
              {opt.soon && <span className={styles.soon}>COMING SOON</span>}
            </motion.button>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
