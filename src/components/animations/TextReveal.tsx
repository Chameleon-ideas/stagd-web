'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import styles from './TextReveal.module.css';

interface TextRevealProps {
  children: React.ReactNode;
  /** Each word slides up individually. Default: false (whole element slides) */
  splitWords?: boolean;
  y?: number;
  stagger?: number;
  duration?: number;
  delay?: number;
  start?: string;
  className?: string;
  /** If true, plays on page load (no scroll trigger) */
  immediate?: boolean;
}

/**
 * TextReveal — animates text children into view.
 * Without splitWords: the whole block fades+slides up.
 * With splitWords: each word is wrapped in overflow:hidden and
 * individually slide-reveals (editorial "typeface printing" feel
 * as seen on Cassette Music's service section headings).
 */
export function TextReveal({
  children,
  splitWords = false,
  y = 32,
  stagger = 0.04,
  duration = 0.5,
  delay = 0,
  start = 'top 88%',
  className,
  immediate = false,
}: TextRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const container = containerRef.current;
    if (!container) return;

    const targets = splitWords
      ? Array.from(container.querySelectorAll<HTMLElement>('[data-word]'))
      : [container];

    if (targets.length === 0) return;

    const anim = gsap.fromTo(
      targets,
      { y, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration,
        stagger,
        delay,
        ease: 'expo.out',
        clearProps: 'all',
        ...(immediate
          ? {}
          : {
              scrollTrigger: {
                trigger: container,
                start,
                once: true,
              },
            }),
      }
    );

    return () => { anim.kill(); };
  }, { scope: containerRef });

  if (!splitWords) {
    return (
      <div ref={containerRef} className={className} style={{ opacity: 0 }}>
        {children}
      </div>
    );
  }

  // Split text content into words, wrap each in overflow:hidden mask
  const text = typeof children === 'string' ? children : '';
  const words = text.split(' ');

  return (
    <div ref={containerRef} className={`${styles.wordWrap} ${className ?? ''}`}>
      {words.map((word, i) => (
        <span key={i} className={styles.wordMask}>
          <span data-word className={styles.word} style={{ opacity: 0 }}>
            {word}
          </span>
        </span>
      ))}
    </div>
  );
}
