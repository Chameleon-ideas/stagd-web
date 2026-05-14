import Link from 'next/link';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <main id="main-content" className={styles.page}>
      <div className="container">
        <div className={styles.inner}>
          <span className={styles.code}>404</span>
          <h1 className={styles.heading}>This page doesn't exist.</h1>
          <p className={styles.body}>
            The creative, event, or page you're looking for may have moved — or the link might be wrong.
          </p>
          <div className={styles.links}>
            <Link href="/" className="btn btn-primary btn-md" id="404-home">
              Back to home
            </Link>
            <Link href="/explore" className="btn btn-secondary btn-md" id="404-explore">
              Explore
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
