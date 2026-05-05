"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Menu, X, ChevronLeft } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { StagdLogo } from './StagdLogo';
import styles from './Header.module.css';

interface HeaderProps {
  transparent?: boolean;
}

export function Header({ transparent: propTransparent }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const isHome = pathname === '/';
  const transparent = propTransparent ?? isHome;
  
  const isMessages = pathname === '/messages';
  const hasRecipient = searchParams.get('recipient');
  const showBackButton = (isMessages && hasRecipient) || pathname.startsWith('/events/');

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <header
      id="site-header"
      className={`${styles.header} ${transparent ? styles.transparent : ''} ${isMenuOpen ? styles.menuOpen : ''}`}
    >
      <div className={`container ${styles.inner}`}>
        {/* Back Button or Logo */}
        {showBackButton ? (
          <button 
            onClick={() => router.back()} 
            className={styles.backBtn}
            aria-label="Go back"
          >
            <ChevronLeft size={24} />
            <span>BACK</span>
          </button>
        ) : (
          <Link href="/" className={styles.logo} aria-label="Stagd — Home">
            <StagdLogo width={110} height={44} />
          </Link>
        )}

        {/* Desktop Nav */}
        <nav aria-label="Main navigation" className={styles.nav}>
          <div className={styles.liveStatus}>
            <span className={styles.pulseDot} />
            <span className={styles.statusText}>LIVE</span>
          </div>
          <Link href="/explore" className={styles.navLink}>Explore</Link>
          <Link href="/about" className={styles.navLink}>About</Link>
          <Link href="/messages" className={styles.navLink}>Inbox</Link>
        </nav>

        {/* Actions */}
        <div className={styles.actions}>
          <div className={styles.headerMeta}>VOL. 01 // KHI</div>
          <ThemeToggle />
          <Link
            href="https://apps.apple.com/app/stagd"
            className={`btn btn-accent btn-sm ${styles.cta}`}
            target="_blank"
            rel="noopener noreferrer"
            id="header-app-cta"
          >
            Get the app
          </Link>
          
          {/* Mobile Toggle */}
          <button 
            className={styles.menuToggle} 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className={styles.mobileOverlay}>
          <nav className={styles.mobileNav}>
            <Link href="/explore" className={styles.mobileLink}>Explore</Link>
            <Link href="/messages" className={styles.mobileLink}>Inbox</Link>
            <Link href="/about" className={styles.mobileLink}>About Stagd</Link>
            <hr className={styles.mobileDivider} />
            <div className={styles.mobileFooter}>
              <span>KARACHI, PK</span>
              <span>VOL. 01</span>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
