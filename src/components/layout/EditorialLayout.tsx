"use client";

import { Header } from './Header';
import { Footer } from './Footer';

/**
 * EditorialLayout
 * Standard scrolling layout for long-form content pages.
 * Includes Header and Footer.
 */
export function EditorialLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main-content">
        {children}
      </main>
      <Footer />
    </>
  );
}
