'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

interface Props {
  eventId: string;
  doorsAt: string | null;
  doorStaffUserIds: string[];
}

export function DoorScannerButton({ eventId, doorsAt, doorStaffUserIds }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!user || doorStaffUserIds.length === 0) return;
    if (!doorStaffUserIds.includes(user.id)) return;

    const check = () => {
      if (!doorsAt) {
        setIsVisible(true);
        return;
      }
      const now = Date.now();
      const doors = new Date(doorsAt).getTime();
      // Show from 30 minutes before doors open
      setIsVisible(now >= doors - 30 * 60 * 1000);
    };

    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [user, doorsAt, doorStaffUserIds]);

  if (!isVisible) return null;

  return (
    <button
      onClick={() => router.push(`/scanner?eventId=${eventId}`)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        padding: '16px 20px',
        background: 'var(--color-yellow)',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'var(--font-mono)',
        fontSize: '12px',
        fontWeight: 700,
        letterSpacing: '0.1em',
        color: '#000',
        marginBottom: '20px',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <path d="M14 14h3v3h-3zM17 17h3v3h-3zM14 20h3" />
      </svg>
      SCAN QR — DOORS ARE OPEN
    </button>
  );
}
