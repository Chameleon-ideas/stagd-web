import Link from 'next/link';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <span className={styles.wordmark}>STAG'D</span>
          <p className={styles.tagline}>Pakistan's Creative Economy</p>
        </div>

        <nav aria-label="Footer navigation" className={styles.links}>
          <Link href="/explore">Explore</Link>
          <Link href="/explore?tab=events">Events</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>

        <div className={styles.bottom}>
          <p className={styles.legal}>
            © {new Date().getFullYear()} Stag'd · Chameleon Ideas · stagd.app
          </p>
          <div className={styles.appLinks}>
            <a
              href="https://apps.apple.com/app/stagd"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.appLink}
            >
              App Store
            </a>
            <a
              href="https://play.google.com/store/apps/stagd"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.appLink}
            >
              Play Store
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
