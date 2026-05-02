"use client";

import { useState } from 'react';
import { CommissionEnquiry } from './CommissionEnquiry';
import type { ArtistPublicProfile } from '@/lib/types';

interface HireButtonProps {
  artist: ArtistPublicProfile;
  className?: string;
  label?: string;
}

export function HireButton({ artist, className, label = 'Commission Work' }: HireButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        className={className}
        onClick={() => setIsOpen(true)}
      >
        {label}
      </button>

      {isOpen && (
        <CommissionEnquiry 
          artist={artist} 
          onClose={() => setIsOpen(false)} 
        />
      )}
    </>
  );
}
