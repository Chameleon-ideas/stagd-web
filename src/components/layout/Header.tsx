import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { StagdLogo } from './StagdLogo';
import styles from './Header.module.css';

interface HeaderProps {
  transparent?: boolean;
}

export function Header({ transparent = false }: HeaderProps) {
  return (
    <header
      id="site-header"
      className={`${styles.header} ${transparent ? styles.transparent : ''}`}
    >
      <div className={`container ${styles.inner}`}>
        {/* Logo — Dynamic SVG */}
        <Link href="/" className={styles.logo} aria-label="Stagd — Home">
          <StagdLogo width={110} height={44} />
        </Link>

        {/* Nav — Streamlined editorial portal */}
        <nav aria-label="Main navigation" className={styles.nav}>
          <div className={styles.liveStatus}>
            <span className={styles.pulseDot} />
            <span className={styles.statusText}>LIVE</span>
          </div>
          <Link href="/explore" className={styles.navLink}>Explore</Link>
          <Link href="/about" className={styles.navLink}>About</Link>
        </nav>

        {/* Actions — High-impact CTAs */}
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
        </div>
      </div>
    </header>
  );
}
