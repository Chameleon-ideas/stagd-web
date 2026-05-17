'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ────────────────────────────────────────────────────────────
   GSAPEntrance
   Reveals child elements with a scroll-triggered animation.
   Uses SCOPED queries — never touches outside its container.
   ──────────────────────────────────────────────────────────── */

interface GSAPEntranceProps {
  children: React.ReactNode;
  /**
   * CSS selector for the elements to animate.
   * Searched ONLY within this component's container (scoped).
   * Default: every direct child element.
   */
  selector?: string;
  /** translateY start value (px). Default: 40 */
  y?: number;
  /** Animation duration (s). Default: 0.9 */
  duration?: number;
  /** Stagger between items (s). Default: 0.12 */
  stagger?: number;
  /** Initial delay before animation (s). Default: 0 */
  delay?: number;
  /**
   * ScrollTrigger start position.
   * "top 88%" means: fire when element top hits 88% from top of viewport.
   * Default: "top 88%"
   */
  start?: string;
  /** If true, wraps as a <section>; otherwise a plain <div>. Default: false */
  as?: 'div' | 'section';
  /** Any extra className on the wrapper */
  className?: string;
  style?: React.CSSProperties;
}

export function GSAPEntrance({
  children,
  selector,
  y = 40,
  duration = 0.9,
  stagger = 0.12,
  delay = 0,
  start = 'top 88%',
  className,
  style,
}: GSAPEntranceProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      // Resolve target elements — scoped to this container
      const targets = selector
        ? gsap.utils.toArray<HTMLElement>(container.querySelectorAll(selector))
        : [container];

      if (targets.length === 0) return;

      gsap.fromTo(
        targets,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration,
          delay,
          stagger,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: container,
            start,
            once: true,          // fire once, never reverse
          },
          clearProps: 'all',
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className={className} style={style}>
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   GSAPHeroReveal
   Plays on mount (no scroll trigger). Staggers children on
   page load with a refined upward reveal.
   ──────────────────────────────────────────────────────────── */

interface GSAPHeroRevealProps {
  children: React.ReactNode;
  selector?: string;
  stagger?: number;
  delay?: number;
  y?: number;
  duration?: number;
}

export function GSAPHeroReveal({
  children,
  selector,
  stagger = 0.12,
  delay = 0.1,
  y = 24,
  duration = 1,
}: GSAPHeroRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const targets = selector
        ? gsap.utils.toArray<HTMLElement>(container.querySelectorAll(selector))
        : [container];

      if (targets.length === 0) return;

      gsap.fromTo(
        targets,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration,
          stagger,
          delay,
          ease: 'expo.out',
          clearProps: 'all',
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   GSAPStaggerReveal
   Reveals a list of children one by one on scroll.
   Each direct child is treated as a stagger item.
   ──────────────────────────────────────────────────────────── */

interface GSAPStaggerRevealProps {
  children: React.ReactNode;
  selector?: string;
  stagger?: number;
  y?: number;
  duration?: number;
  start?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function GSAPStaggerReveal({
  children,
  selector = '*',
  stagger = 0.1,
  y = 28,
  duration = 0.8,
  start = 'top 90%',
  className,
  style,
}: GSAPStaggerRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const targets = gsap.utils.toArray<HTMLElement>(
        container.querySelectorAll(`:scope > ${selector}`)
      );

      if (targets.length === 0) return;

      gsap.fromTo(
        targets,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration,
          stagger,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: container,
            start,
            once: true,
          },
          clearProps: 'all',
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className={className} style={style}>
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   GSAPClipReveal
   Hard-edge "printing press" section reveal:
   The panel clips open from the bottom using clip-path.
   Perfect for full-bleed coloured sections.
   ──────────────────────────────────────────────────────────── */

interface GSAPClipRevealProps {
  children: React.ReactNode;
  /** ScrollTrigger start. Default: "top 94%" */
  start?: string;
  /** Duration (s). Capped at 0.5 per design system. Default: 0.48 */
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function GSAPClipReveal({
  children,
  start = 'top 94%',
  duration = 0.48,
  className,
  style,
}: GSAPClipRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      gsap.fromTo(
        container,
        { clipPath: 'inset(100% 0% 0% 0%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: container,
            start,
            once: true,
          },
          clearProps: 'clipPath',
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className={className} style={style}>
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   GSAPLineReveal
   Wraps each [data-line] child in an overflow:hidden mask and
   slides the text up from below — editorial "typeset" effect.
   ──────────────────────────────────────────────────────────── */

interface GSAPLineRevealProps {
  children: React.ReactNode;
  selector?: string;
  y?: number;
  stagger?: number;
  duration?: number;
  delay?: number;
  start?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function GSAPLineReveal({
  children,
  selector = '[data-line]',
  y = 40,
  stagger = 0.06,
  duration = 0.42,
  delay = 0,
  start = 'top 90%',
  className,
  style,
}: GSAPLineRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const targets = gsap.utils.toArray<HTMLElement>(
        container.querySelectorAll(selector)
      );

      if (targets.length === 0) return;

      gsap.fromTo(
        targets,
        { y, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration,
          stagger,
          delay,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: container,
            start,
            once: true,
          },
          clearProps: 'all',
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className={className} style={style}>
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   GSAPCounterReveal
   Reveals a row of stat/number items with a sharp horizontal
   stagger — each item slides from the left.
   ──────────────────────────────────────────────────────────── */

interface GSAPCounterRevealProps {
  children: React.ReactNode;
  selector?: string;
  stagger?: number;
  duration?: number;
  start?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function GSAPCounterReveal({
  children,
  selector = '[data-stat]',
  stagger = 0.07,
  duration = 0.38,
  start = 'top 88%',
  className,
  style,
}: GSAPCounterRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const targets = gsap.utils.toArray<HTMLElement>(
        container.querySelectorAll(selector)
      );

      if (targets.length === 0) return;

      gsap.fromTo(
        targets,
        { x: -24, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration,
          stagger,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: container,
            start,
            once: true,
          },
          clearProps: 'all',
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className={className} style={style}>
      {children}
    </div>
  );
}
