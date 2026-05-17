'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import styles from './HeroEQ.module.css';

/** Number of EQ bars rendered */
const BAR_COUNT = 28;

/**
 * Animated EQ bars — inspired by Cassette Music's hero visualizer.
 * Each bar animates to a random height continuously, creating a
 * "live audio" feel without any audio dependency.
 */
export function HeroEQ() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const bars = Array.from(container.querySelectorAll<HTMLElement>('[data-bar]'));

    // Stagger each bar with an independent random looping tween
    bars.forEach((bar, i) => {
      const delay = (i * 0.04) % 0.8;
      const loop = () => {
        const targetH = 12 + Math.random() * 88; // 12%–100% height
        const dur = 0.18 + Math.random() * 0.38;
        gsap.to(bar, {
          scaleY: targetH / 100,
          duration: dur,
          ease: 'power2.inOut',
          onComplete: loop,
        });
      };
      gsap.delayedCall(delay, loop);
    });

    return () => {
      gsap.killTweensOf(bars);
    };
  }, []);

  return (
    <div className={styles.eq} ref={containerRef} aria-hidden="true">
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <span key={i} className={styles.bar} data-bar />
      ))}
    </div>
  );
}
