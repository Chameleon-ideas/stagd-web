"use client";

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
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

  const handleOption = (href: string | null) => {
    if (!href) return;
    onClose();
    router.push(href);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.topBar}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
        <span className={styles.topLabel}>// MAKE SOMETHING</span>
      </div>

      <div className={styles.content}>
        <div className={styles.options}>
          {OPTIONS.map((opt, i) => (
            <button
              key={opt.num}
              className={styles.option}
              style={{ background: opt.bg, color: opt.color, animationDelay: `${i * 60 + 80}ms` }}
              onClick={() => handleOption(opt.href)}
              disabled={!!opt.soon}
            >
              <span className={styles.optNum}>{opt.num}</span>
              <strong className={styles.optLabel}>{opt.label}</strong>
              <span className={styles.optDesc}>{opt.desc}</span>
              {opt.soon && <span className={styles.soon}>COMING SOON</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
