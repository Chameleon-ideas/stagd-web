"use client";

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Menu, X, ChevronLeft, LogOut, User, Plus, Inbox } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getViewingConv } from '@/lib/viewState';
import { ThemeToggle } from './ThemeToggle';
import { StagdLogo } from './StagdLogo';
import { CreateModal } from './CreateModal';
import { BugReportModal } from './BugReportModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import styles from './Header.module.css';

interface HeaderProps {
  transparent?: boolean;
}

export function Header({ transparent: propTransparent }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBugReportOpen, setIsBugReportOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, logout, isLoading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const isHome = pathname === '/';
  const transparent = propTransparent ?? isHome;

  const isMessages = pathname === '/messages';
  const hasRecipient = searchParams.get('recipient');
  const showBackButton = (isMessages && hasRecipient) || pathname.startsWith('/events/');

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (pathname === '/messages') setUnreadCount(0);
  }, [pathname]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`notify-user-${user.id}`)
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        // Don't badge if the user is actively viewing that conversation
        const commId = (payload as { commission_id?: string } | null)?.commission_id;
        if (commId && getViewingConv() === commId) return;
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        </nav>

        {/* Actions */}
        <div className={styles.actions}>
          <div className={styles.headerMeta}>VOL. 01 // KHI</div>
          <ThemeToggle />

          <AnimatePresence mode="wait">
            {!isLoading && (
              <motion.div 
                key="auth-section"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className={styles.authWrapper}
              >
                {user && (
                  <button
                    className={styles.createBtn}
                    onClick={() => setIsCreateOpen(true)}
                    aria-label="Create"
                  >
                    <Plus size={14} />
                    CREATE
                  </button>
                )}

                {user ? (
                  <div className={styles.userMenu} ref={userMenuRef}>
                    <button
                      className={styles.userBtn}
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      aria-label="User menu"
                    >
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.full_name} className={styles.userAvatar} />
                      ) : (
                        <span className={styles.userInitial}>{user.full_name[0]}</span>
                      )}
                      <span className={styles.userHandle}>@{user.username}</span>
                    </button>
                    {unreadCount > 0 && (
                      <span className={styles.navUnreadBadge}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                    {isUserMenuOpen && (
                      <div className={styles.userDropdown}>
                        <Link href="/messages" className={styles.dropdownItem} onClick={() => { setIsUserMenuOpen(false); setUnreadCount(0); }}>
                          <Inbox size={14} />
                          <span>Inbox</span>
                          {unreadCount > 0 && <span className={styles.unreadBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
                        </Link>
                        <Link
                          href={user.role === 'general' ? '/profile/edit' : `/profile/${user.username}`}
                          className={styles.dropdownItem}
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <User size={14} />
                          <span>{user.role === 'general' ? 'Edit Profile' : 'My Profile'}</span>
                        </Link>
                        <button
                          className={styles.dropdownItem}
                          onClick={() => { setIsUserMenuOpen(false); logout(); }}
                        >
                          <LogOut size={14} />
                          <span>Sign out</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.authLinks}>
                    <Link href="/auth/login" className={styles.loginLink}>Log in</Link>
                    <Link href="/auth/signup" className={`btn btn-accent btn-sm ${styles.cta}`}>
                      Sign up
                    </Link>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

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
      
      {user && (
        <div className={styles.ticker}>
          <div className={styles.tickerContent}>
            // Early access build · Something not working?{' '}
            <button onClick={() => setIsBugReportOpen(true)} className={styles.tickerLink}>
              Tell us →
            </button>
          </div>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className={styles.mobileOverlay}>
          <nav className={styles.mobileNav}>
            <Link href="/explore" className={styles.mobileLink}>Explore</Link>
            <Link href="/messages" className={styles.mobileLink}>Inbox</Link>
            <Link href="/about" className={styles.mobileLink}>About Stagd</Link>
            <hr className={styles.mobileDivider} />
            {user ? (
              <button className={styles.mobileLink} onClick={() => { setIsMenuOpen(false); logout(); }}>
                Sign out
              </button>
            ) : (
              <>
                <Link href="/auth/login" className={styles.mobileLink}>Log in</Link>
                <Link href="/auth/signup" className={styles.mobileLink}>Sign up</Link>
              </>
            )}
            <div className={styles.mobileFooter}>
              <span>KARACHI, PK</span>
              <span>VOL. 01</span>
            </div>
          </nav>
        </div>
      )}

      {isCreateOpen && createPortal(
        <CreateModal onClose={() => setIsCreateOpen(false)} />,
        document.body
      )}

      {isBugReportOpen && createPortal(
        <BugReportModal
          onClose={() => setIsBugReportOpen(false)}
          username={user?.username}
          email={user?.email}
        />,
        document.body
      )}
    </header>
  );
}
