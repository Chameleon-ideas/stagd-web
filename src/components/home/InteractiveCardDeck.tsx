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
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: 'top top',
        end: `+=${(panels.length - 1) * 100}%`,
        scrub: true,
        pin: true,
        anticipatePin: 1,
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

  // Mobile Render Flow: Native CSS Sticky Stacked Cards that match the desktop transition perfectly!
  // Uses height: 'auto' (natural content size) and overflow: 'visible' so sections fit perfectly 
  // without empty black space gaps, while stacking overlay transitions remain clean.
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
            '#111111', // Hero Panel
            '#F4F1E6', // Directives Panel
            '#649839', // Showcase Panel
            '#111111', // Manifesto Panel
            '#F4F1E6', // Creative Roster Panel
            '#111111', // CTA Canvas Panel
          ];
          const bg = cardBackgrounds[i] || '#F4F1E6';

          return (
            <div 
              key={i} 
              style={{
                position: 'sticky',
                top: 0,
                left: 0,
                width: '100%',
                height: 'auto',
                overflow: 'visible',
                zIndex: i + 1,
                backgroundColor: bg,
                borderTop: i > 0 ? '1.5px solid rgba(17, 17, 17, 0.15)' : 'none',
                boxShadow: i > 0 ? '0 -20px 40px rgba(0, 0, 0, 0.12)' : 'none',
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
