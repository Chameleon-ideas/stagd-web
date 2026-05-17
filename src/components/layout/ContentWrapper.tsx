"use client";

import React from 'react';
import { usePathname } from 'next/navigation';

interface ContentWrapperProps {
  children: React.ReactNode;
}

/**
 * ContentWrapper
 * Automatically adds top padding to clear the fixed global navigation bar.
 * Caps the viewport height to exactly 100vh for non-homepage routes,
 * ensuring internal flex-scroll zones (like sidebars and right panes) scroll flawlessly.
 */
export function ContentWrapper({ children }: ContentWrapperProps) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <main 
      className="flex-1 flex flex-col" 
      style={{ 
        height: isHome ? 'auto' : '100vh',
        maxHeight: isHome ? 'none' : '100vh',
        paddingTop: isHome ? '0' : '88px',
        overflow: isHome ? 'visible' : 'hidden'
      }}
    >
      {children}
    </main>
  );
}
