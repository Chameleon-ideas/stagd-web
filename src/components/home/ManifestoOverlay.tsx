'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from '@/lib/gsap';
import styles from './ManifestoOverlay.module.css';

interface Props {
  onClose: () => void;
}

const LINES: string[] = [
  'Pakistan has no shortage of creative talent.',
  'What it’s been short of is infrastructure.',
  '',
  'The talent was never the problem.',
  'The system around it was.',
  '',
  'Stag’d exists to change that.',
  '',
  'Discoverable. Bookable. Yours.',
  '',
  'stagd.app',
];

export function ManifestoOverlay({ onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const tl = gsap.timeline();
    const lines = overlayRef.current?.querySelectorAll('[data-line]') ?? [];

    tl.fromTo(
      overlayRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: 'power2.out' }
    ).fromTo(
      lines,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, stagger: 0.15, ease: 'power2.out' },
      '+=0.05'
    );

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={overlayRef}
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="About Stag'd"
    >
      <button
        className={styles.close}
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>
      <div className={styles.content}>
        {LINES.map((line, i) =>
          line === '' ? (
            <div key={i} className={styles.spacer} data-line aria-hidden="true" />
          ) : (
            <p
              key={i}
              className={line === 'stagd.app' ? styles.lineAccent : styles.line}
              data-line
            >
              {line}
            </p>
          )
        )}
      </div>
    </div>,
    document.body
  );
}
