"use client";

import Link from 'next/link';
import styles from './Footer.module.css';

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <div className={styles.navGroup}>
          <span className={styles.navHeader}>(FOLLOW)</span>
          <a href="https://instagram.com" className={styles.navLink}>Instagram</a>
          <a href="https://linkedin.com" className={styles.navLink}>Linkedin</a>
          <a href="https://behance.net" className={styles.navLink}>Behance</a>
          <a href="mailto:hello@stagd.app" className={styles.navLink}>Email</a>
        </div>

        <div className={styles.navGroup}>
          <span className={styles.navHeader}>(NAVIGATION)</span>
          <Link href="/" className={styles.navLink}>Home</Link>
          <Link href="/explore" className={styles.navLink}>Explore</Link>
          <button onClick={scrollToTop} className={styles.backToTop}>
            Back to Top
          </button>
        </div>

        <div className={styles.navGroup} style={{ alignItems: 'flex-end' }}>
          <span className={styles.navHeader} style={{ textAlign: 'right', width: '100%' }}>(DOWNLOAD)</span>
          <div className={styles.storeGroup}>
            <a href="https://apps.apple.com/app/stagd" className={styles.storeLink} target="_blank" rel="noopener noreferrer">
              <img src="/stores/appstore-light.svg" alt="App Store" className={styles.lightIcon} />
              <img src="/stores/appstore-dark.svg" alt="App Store" className={styles.darkIcon} />
            </a>
            <a href="https://play.google.com/store/apps/stagd" className={styles.storeLink} target="_blank" rel="noopener noreferrer">
              <img src="/stores/playstore-light.svg" alt="Play Store" className={styles.lightIcon} />
              <img src="/stores/playstore-dark.svg" alt="Play Store" className={styles.darkIcon} />
            </a>
          </div>
        </div>
      </div>

      <div className={styles.ticker}>
        <div className={styles.tickerText}>
          Let's Talk Let's Talk Let's Talk Let's Talk Let's Talk Let's Talk
        </div>
      </div>

      <div className={styles.bottom}>
        <div className={styles.meta}>
          <div className={styles.metaItem}>
            <span className={styles.dot} />
            Karachi, PK
          </div>
          <div className={styles.metaItem}>
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}
          </div>
          <div className={styles.metaItem}>
            24.8607° N, 67.0011° E
          </div>
        </div>

        <div className={styles.copyright}>
          ©{new Date().getFullYear()}<br />
          ALL RIGHTS RESERVED
        </div>
      </div>
    </footer>
  );
}
