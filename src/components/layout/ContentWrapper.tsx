"use client";

import React from 'react';
import { usePathname } from 'next/navigation';

interface ContentWrapperProps {
  children: React.ReactNode;
}

// Determines if the current path requires a viewport-locked layout (e.g. 100vh height + overflow: hidden).
// This is critical for split-pane workstations (Explore, Messages, Artist Profiles, Event Detail)
// so that their nested panels calculate scrolling boundaries correctly.
function isViewportLockedRoute(pathname: string): boolean {
  // Only explicitly designated split-pane workstations are viewport-locked:
  if (pathname === '/explore') return true;
  if (pathname.startsWith('/messages')) return true;
  if (pathname.startsWith('/profile/edit')) return true;
  
  // All other pages (including dynamic profiles, portfolio views, and event pages)
  // must scroll naturally.
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

  const shouldLock = isLocked && !isMobile;

  return (
    <main 
      className="flex-1 flex flex-col" 
      style={{ 
        height: shouldLock ? (isHome ? '100vh' : 'calc(100vh - 88px)') : 'auto',
        maxHeight: shouldLock ? (isHome ? '100vh' : 'calc(100vh - 88px)') : 'none',
        paddingTop: isHome ? '0' : '88px',
        overflow: shouldLock ? 'hidden' : 'visible'
      }}
    >
      {children}
    </main>
  );
}
