'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export function ClaimProfileButton() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <span className="btn btn-accent btn-md" style={{ opacity: 0.5, cursor: 'wait' }} id="claim-cta">
        Loading...
      </span>
    );
  }

  const href = user 
    ? (user.role === 'general' ? '/profile/edit' : `/profile/${user.username}`)
    : '/auth/signup';

  return (
    <Link href={href} className="btn btn-accent btn-md" id="claim-cta">
      {user ? 'Go to your profile' : 'Claim your profile'}
    </Link>
  );
}
