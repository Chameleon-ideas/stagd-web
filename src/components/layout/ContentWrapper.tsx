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
  // Static workstation layouts
  if (pathname === '/explore') return true;
  if (pathname === '/messages') return true;
  if (pathname.startsWith('/profile/edit')) return true;
  
  // Dynamic workstation layouts
  if (pathname.startsWith('/events/')) return true;

  // Standard long-form scrolling content routes
  const standardScrollRoutes = [
    '/',
    '/about',
    '/terms',
    '/privacy',
    '/auth/login',
    '/auth/signup',
    '/verify',
    '/scanner',
    '/admin'
  ];

  if (standardScrollRoutes.includes(pathname)) {
    return false;
  }

  // Fallback: Dynamic user profiles (/[username]) are viewport-locked classic workstation splits
  return true;
}

/**
 * ContentWrapper
 * Automatically adds top padding to clear the fixed global navigation bar.
 * Restricts viewport heights to exactly 100vh only on workstation-split routes,
 * while allowing standard editorial pages (like About, Legal, Forms) to scroll natively.
 */
export function ContentWrapper({ children }: ContentWrapperProps) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isLocked = isViewportLockedRoute(pathname);

  return (
    <main 
      className="flex-1 flex flex-col" 
      style={{ 
        height: isLocked ? '100vh' : 'auto',
        maxHeight: isLocked ? '100vh' : 'none',
        paddingTop: isHome ? '0' : '88px',
        overflow: isLocked ? 'hidden' : 'visible'
      }}
    >
      {children}
    </main>
  );
}
