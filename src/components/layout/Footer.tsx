import Link from 'next/link';
import { StagdLogo } from './StagdLogo';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.top}>
          <div className={styles.brand}>
            <Link href="/" aria-label="Stagd Home">
              <StagdLogo width={120} height={48} className={styles.footerLogo} />
            </Link>
            <p className={styles.tagline}>Your work, staged.</p>
          </div>

          <div className={styles.navGroups}>
            <div className={styles.navGroup}>
              <span className={styles.navTitle}>Platform</span>
              <Link href="/explore" className={styles.navLink}>Explore</Link>
              <Link href="/explore?tab=events" className={styles.navLink}>Events</Link>
              <Link href="/explore?tab=creatives" className={styles.navLink}>Creatives</Link>
            </div>
            <div className={styles.navGroup}>
              <span className={styles.navTitle}>Legal</span>
              <Link href="/privacy" className={styles.navLink}>Privacy</Link>
              <Link href="/terms" className={styles.navLink}>Terms</Link>
            </div>
            <div className={styles.navGroup}>
              <span className={styles.navTitle}>Connect</span>
              <a href="https://instagram.com/stagd" className={styles.navLink}>Instagram</a>
              <a href="mailto:hello@stagd.app" className={styles.navLink}>Email Us</a>
            </div>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.bottom}>
          <div className={styles.legal}>
            <span>© {new Date().getFullYear()} STAGD</span>
            <span className={styles.dot}>·</span>
            <span>A CHAMELEON IDEAS PROJECT</span>
          </div>
          <div className={styles.appLinks}>
            <a href="https://apps.apple.com/app/stagd" className={styles.appBadge}>App Store</a>
            <a href="https://play.google.com/store/apps/stagd" className={styles.appBadge}>Play Store</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
