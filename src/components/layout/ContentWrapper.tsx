"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

interface ContentWrapperProps {
  children: React.ReactNode;
}

// Determines if the current path requires a viewport-locked layout (e.g. 100vh height + overflow: hidden).
// This is critical for split-pane workstations (Explore, Messages, Artist Profiles, Event Detail)
// so that their nested panels calculate scrolling boundaries correctly.
function isProfileRoute(pathname: string): boolean {
  const segments = pathname.split('/').filter(Boolean);
  return segments.length === 1 && !['explore', 'messages', 'about', 'events', 'auth', 'terms', 'privacy'].includes(segments[0]);
}

function shouldUseZeroPaddingRoute(pathname: string): boolean {
  if (isProfileRoute(pathname)) return true;
  if (pathname === '/explore') return true;
  return false;
}

function isViewportLockedRoute(pathname: string): boolean {
  // Only explicitly designated split-pane workstations are viewport-locked:
  if (pathname === '/explore') return true;
  if (pathname.startsWith('/messages')) return true;
  if (pathname.startsWith('/profile/edit')) return true;
  if (pathname.startsWith('/profile/manage')) return true;
  if (isProfileRoute(pathname)) return true;
  
  // All other pages (including event pages) must scroll naturally.
  return false;
}

/**
 * ContentWrapper
 * Automatically adds top padding to clear the fixed global navigation bar.
 * Restricts viewport heights to exactly (100vh - 88px) only on workstation-split routes,
 * while allowing standard editorial pages (like Profiles, Events, About) to scroll natively.
 */
export function ContentWrapper({ children }: ContentWrapperProps) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isLocked = isViewportLockedRoute(pathname);
  const { user } = useAuth();
  // --header-h is set dynamically by Header.tsx via ResizeObserver;
  // no need to hardcode a pixel value here.

  // Client-side detection to bypass viewport locking on mobile viewports (<= 768px)
  // where split-panes naturally collapse into standard long scroll containers.
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)');
    setIsMobile(media.matches);
    const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const isMessages = pathname.startsWith('/messages');
  const shouldLock = isLocked && (!isMobile || isMessages);
  const zeroPadding = shouldUseZeroPaddingRoute(pathname);

  return (
    <main 
      className="flex-1 flex flex-col" 
      style={{ 
        height: shouldLock ? '100vh' : 'auto',
        maxHeight: shouldLock ? '100vh' : 'none',
        paddingTop: isHome ? '0' : (zeroPadding && !isMobile ? '0' : 'var(--header-h, 60px)'),
        overflow: shouldLock ? 'hidden' : 'visible'
      }}
    >
      {children}
    </main>
  );
}
