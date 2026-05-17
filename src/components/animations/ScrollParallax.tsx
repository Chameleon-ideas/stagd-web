'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap';

interface ScrollParallaxProps {
  children: React.ReactNode;
  speed?: number; // 0 = fixed, 1 = scrolls with page, 0.5 = half speed
  className?: string;
}

/**
 * Wraps children and applies a vertical parallax effect on scroll.
 * The element moves at `speed` fraction of the scroll distance — slower
 * than the scroll = it appears to drift backwards (depth effect).
 */
export function ScrollParallax({ children, speed = 0.4, className }: ScrollParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = ref.current;
    if (!el) return;

    gsap.to(el, {
      yPercent: -(speed * 60),
      ease: 'none',
      scrollTrigger: {
        trigger: el.parentElement ?? el,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });
  }, { scope: ref });

  return (
    <div ref={ref} className={className} style={{ willChange: 'transform' }}>
      {children}
    </div>
  );
}
