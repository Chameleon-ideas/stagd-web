import Link from 'next/link';
import Image from 'next/image';
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
              <a href="https://instagram.com/stagd.app" className={styles.navLink}>Instagram</a>
              <a href="mailto:hello@stagd.app" className={styles.navLink}>Email Us</a>
            </div>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.bottom}>
          <div className={styles.legal}>
            <span>© {new Date().getFullYear()} STAGD</span>
          </div>
          <div className={styles.appLinks}>
            <a href="https://apps.apple.com/app/stagd" className={styles.storeLink} target="_blank" rel="noopener noreferrer">
              <Image src="/stores/appstore-light.svg" alt="App Store" width={110} height={32} className={styles.lightLogo} />
              <Image src="/stores/appstore-dark.svg" alt="App Store" width={110} height={32} className={styles.darkLogo} />
            </a>
            <a href="https://play.google.com/store/apps/stagd" className={styles.storeLink} target="_blank" rel="noopener noreferrer">
              <Image src="/stores/playstore-light.svg" alt="Play Store" width={110} height={32} className={styles.lightLogo} />
              <Image src="/stores/playstore-dark.svg" alt="Play Store" width={110} height={32} className={styles.darkLogo} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
