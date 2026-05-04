"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CommissionEnquiry } from './CommissionEnquiry';
import type { ArtistPublicProfile } from '@/lib/types';

interface HireButtonProps {
  artist: ArtistPublicProfile;
  className?: string;
  label?: string;
  style?: React.CSSProperties;
}

/**
 * HireButton (Client Component)
 * Handles opening the commission enquiry modal.
 * Uses a Portal to ensure the modal is rendered at the root level, 
 * bypassing any z-index or stacking context issues on the artist profile.
 */
export function HireButton({ artist, className, label = 'Commission Work', style }: HireButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  return (
    <>
      <button 
        className={className}
        onClick={() => setIsOpen(true)}
        style={style}
      >
        {label}
      </button>

      {isOpen && mounted && createPortal(
        <CommissionEnquiry 
          artist={artist} 
          onClose={() => setIsOpen(false)} 
        />,
        document.body
      )}
    </>
  );
}
