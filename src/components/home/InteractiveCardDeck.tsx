'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap';

interface InteractiveCardDeckProps {
  children: React.ReactNode[];
}

export function InteractiveCardDeck({ children }: InteractiveCardDeckProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => {
      // 1024px matches our media query threshold where layout columns stack
      setIsMobile(window.innerWidth <= 1024);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useGSAP(() => {
    // If mobile check hasn't run yet or we are on mobile, bypass GSAP pin timeline
    // This lets the native mobile CSS sticky stacking scroll perfectly on phones
    if (isMobile === null || isMobile) return;

    const container = containerRef.current;
    if (!container) return;

    const panels = Array.from(
      container.querySelectorAll<HTMLElement>('[data-deck-panel]')
    );

    if (panels.length <= 1) return;

    // Pin the container and slide up subsequent panels sequentially on desktop
    // Optimized with pinType: 'transform' to avoid scroll jumps when combined with Lenis smooth scroll
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: 'top top',
        end: `+=${(panels.length - 1) * 100}%`,
        scrub: true,
        pin: true,
        pinType: 'transform', // Highly recommended when integrating ScrollTrigger with Lenis to prevent layout jerking
        anticipatePin: 0,     // Zero anticipation prevents initial transition jumps
      },
    });

    panels.slice(1).forEach((panel) => {
      tl.to(panel, {
        y: '0%',
        ease: 'none',
      });
    });
  }, { scope: containerRef, dependencies: [isMobile] });

  // Prevent server-side render mismatch by showing a basic fallback or loading deck panels natively
  if (isMobile === null) {
    return (
      <div style={{ position: 'relative', width: '100%', height: 'auto', overflow: 'visible' }}>
        {children.map((child, i) => (
          <div key={i} style={{ position: 'relative', width: '100%', height: 'auto' }}>
            {child}
          </div>
        ))}
      </div>
    );
  }

  // Mobile Render Flow: Native relative natural scrolling cards.
  // Uses relative positioning and height: auto so that sections (which are very tall on mobile)
  // scroll completely and naturally without being clipped, stuck, or truncated by sticky bounds.
  if (isMobile) {
    return (
      <div 
        ref={containerRef}
        style={{ 
          position: 'relative', 
          width: '100%', 
          height: 'auto', 
          overflow: 'visible' 
        }}
      >
        {children.map((child, i) => {
          // Curated background color map matching each card panel's branding to prevent transparency overlay slivers
          const cardBackgrounds = [
            '#121212', // Hero Panel
            '#F4F1E6', // Directives Panel
            '#649839', // Showcase Panel
            '#121212', // Manifesto Panel
            '#F4F1E6', // Creative Roster Panel
            '#121212', // CTA Canvas Panel
          ];
          const bg = cardBackgrounds[i] || '#F4F1E6';

          return (
            <div 
              key={i} 
              style={{
                position: 'relative', // Natural vertical scroll flow on mobile to prevent clipping
                width: '100%',
                height: 'auto',
                overflow: 'visible',
                zIndex: i + 1,
                backgroundColor: bg,
                borderTop: i > 0 ? '1.5px solid rgba(17, 17, 17, 0.15)' : 'none',
              }}
            >
              {child}
            </div>
          );
        })}
      </div>
    );
  }

  // Desktop Render Flow: Ultra-smooth GSAP-driven viewport-pinned card stacking
  return (
    <div 
      ref={containerRef} 
      style={{ 
        position: 'relative', 
        width: '100%', 
        height: '100vh', 
        overflow: 'hidden' 
      }}
    >
      {children.map((child, i) => (
        <div 
          key={i} 
          data-deck-panel
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100vh',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            // Hero starts at 0, subsequent sections at 100% (below view)
            transform: i === 0 ? 'translateY(0%)' : 'translateY(100%)',
            zIndex: i + 1,
            borderTop: i > 0 ? '1.5px solid rgba(17, 17, 17, 0.15)' : 'none',
            boxShadow: i > 0 ? '0 -20px 40px rgba(0, 0, 0, 0.12)' : 'none',
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
