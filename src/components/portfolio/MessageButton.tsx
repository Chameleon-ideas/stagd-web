"use client";

import { useRouter } from 'next/navigation';
import type { ArtistPublicProfile } from '@/lib/types';

interface MessageButtonProps {
  artist: ArtistPublicProfile;
  className?: string;
  label?: string;
}

export function MessageButton({ artist, className, label = 'MESSAGE' }: MessageButtonProps) {
  const router = useRouter();

  const handleMessage = () => {
    // In a real app, this would create a conversation or redirect to an existing one
    // For now, we'll redirect to a mock messages page
    router.push(`/messages?recipient=${artist.user.id}`);
  };

  return (
    <button 
      className={className}
      onClick={handleMessage}
    >
      {label}
    </button>
  );
}
