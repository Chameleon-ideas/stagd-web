"use client";

import { Header } from './Header';

/**
 * WorkstationLayout
 * Application-style layout with a fixed viewport.
 * Header is pinned, content fills the remaining space with internal scrolling.
 * No Footer.
 */
export function WorkstationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header />
      <main id="main-content" style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </div>
  );
}
