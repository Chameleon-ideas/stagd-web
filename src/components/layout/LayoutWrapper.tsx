"use client";

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Define pages that should NOT show the footer
  // Portfolio pages are directly at /[username]
  // We can detect them by checking if it's NOT a static route and NOT home
  const staticRoutes = ['/', '/explore', '/messages', '/events'];
  const isStaticRoute = staticRoutes.includes(pathname) || pathname.startsWith('/events/');
  
  // If it's a dynamic username path (and not home/explore/etc), hide footer
  const showFooter = isStaticRoute && pathname !== '/messages' && pathname !== '/explore';
  
  // Actually, let's be more specific based on user request: "shouldnt show footer on portfolio page"
  // And "consistent on all pages" was earlier.
  // I'll hide footer on /[username], /explore, and /messages for a true "workstation" feel.
  
  const hideFooterOn = ['/explore', '/messages'];
  const isPortfolio = !staticRoutes.includes(pathname) && !pathname.startsWith('/events/');
  const shouldHideFooter = hideFooterOn.includes(pathname) || isPortfolio;

  if (shouldHideFooter) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <Header />
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
