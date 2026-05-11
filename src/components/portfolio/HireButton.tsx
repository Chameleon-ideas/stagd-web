"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { CommissionEnquiry } from './CommissionEnquiry';
import { useAuth } from '@/lib/auth';
import type { ArtistPublicProfile } from '@/lib/types';

interface HireButtonProps {
  artist: ArtistPublicProfile;
  className?: string;
  label?: string;
  style?: React.CSSProperties;
}

export function HireButton({ artist, className, label = 'Commission Work', style }: HireButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleClick = () => {
    if (!user) {
      router.push(`/auth/login?redirect=/profile/${artist.user.username}`);
      return;
    }
    setIsOpen(true);
  };

  return (
    <>
      <button
        className={className}
        onClick={handleClick}
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
