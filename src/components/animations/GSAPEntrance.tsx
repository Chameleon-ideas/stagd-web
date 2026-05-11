'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface GSAPEntranceProps {
  children: React.ReactNode;
  stagger?: number;
  selector?: string;
  y?: number;
  duration?: number;
  delay?: number;
  trigger?: string;
  start?: string;
  scrub?: boolean | number;
}

/**
 * A utilitarian GSAP wrapper to easily add reveal animations
 * to any page or section while maintaining server component benefits for children.
 */
export function GSAPEntrance({
  children,
  stagger = 0.08,
  selector,
  y = 30,
  duration = 0.8,
  delay = 0,
  trigger,
  start = 'top 85%',
  scrub = false
}: GSAPEntranceProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!selector) return;

    const elements = gsap.utils.toArray<HTMLElement>(selector);
    if (elements.length === 0) return;

    gsap.from(elements, {
      scrollTrigger: {
        trigger: trigger || containerRef.current,
        start: start,
        scrub: scrub,
      },
      y: y,
      opacity: 0,
      duration: duration,
      delay: delay,
      stagger: stagger,
      ease: 'expo.out',
      clearProps: 'all',
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      {children}
    </div>
  );
}

/**
 * A specialized reveal for Hero sections that shouldn't wait for scroll.
 */
export function GSAPHeroReveal({
  children,
  selector,
  stagger = 0.1,
  delay = 0.2
}: {
  children: React.ReactNode;
  selector: string;
  stagger?: number;
  delay?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const elements = gsap.utils.toArray<HTMLElement>(selector);
    gsap.from(elements, {
      y: 20,
      opacity: 0,
      duration: 1,
      stagger: stagger,
      delay: delay,
      ease: 'expo.out',
      clearProps: 'all'
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      {children}
    </div>
  );
}
