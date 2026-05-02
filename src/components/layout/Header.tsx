import Image from 'next/image';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
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
        {/* Logo — real PNG from brand */}
        <Link href="/" className={styles.logo} aria-label="Stagd — Home">
          <Image
            src="/images/logo.png"
            alt="Stagd"
            width={120}
            height={36}
            priority
            className={styles.logoImg}
            style={{ width: 'auto', height: '28px' }}
          />
        </Link>

        {/* Nav */}
        <nav aria-label="Main navigation" className={styles.nav}>
          <Link href="/explore" className={styles.navLink}>Explore</Link>
          <Link href="/explore?tab=events" className={styles.navLink}>Events</Link>
        </nav>

        {/* Actions */}
        <div className={styles.actions}>
          <ThemeToggle />
          <Link
            href="https://apps.apple.com/app/stagd"
            className="btn btn-accent btn-sm"
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
