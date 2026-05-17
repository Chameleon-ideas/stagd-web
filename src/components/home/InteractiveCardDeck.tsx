'use client';

import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface InteractiveCardDeckProps {
  children: React.ReactNode[];
}

export function InteractiveCardDeck({ children }: InteractiveCardDeckProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const container = containerRef.current;
    if (!container) return;

    const panels = Array.from(
      container.querySelectorAll<HTMLElement>('[data-deck-panel]')
    );

    if (panels.length <= 1) return;

    // Pin the container and slide up subsequent panels sequentially
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: 'top top',
        end: `+=${(panels.length - 1) * 100}%`, // Scroll track duration matching the deck panels count
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
  }, { scope: containerRef });

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
