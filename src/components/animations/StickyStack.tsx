'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import styles from './StickyStack.module.css';

interface StickyStackProps {
  children: React.ReactNode[];
}

/**
 * StickyStack — renders a list of full-bleed panels that stack over
 * each other as you scroll. Each panel sticks at the top, then the
 * next slides in from below and peels it away with a slight scale-down.
 *
 * Inspired by Cassette Music's section stacking behavior.
 */
export function StickyStack({ children }: StickyStackProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const container = containerRef.current;
    if (!container) return;

    const panels = Array.from(
      container.querySelectorAll<HTMLElement>('[data-stack-panel]')
    );

    panels.forEach((panel, i) => {
      if (i === panels.length - 1) return; // last panel doesn't need to scale out

      ScrollTrigger.create({
        trigger: panel,
        start: 'top top',
        end: `+=${panel.offsetHeight}`,
        pin: true,
        pinSpacing: false,
        onUpdate: (self) => {
          // scale + fade the panel out as the next one scrolls in
          const prog = self.progress;
          const scale = 1 - prog * 0.04;
          const opacity = 1 - prog * 0.25;
          gsap.set(panel, { scale, opacity });
        },
      });
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className={styles.stack}>
      {children.map((child, i) => (
        <div key={i} className={styles.panel} data-stack-panel>
          {child}
        </div>
      ))}
    </div>
  );
}
