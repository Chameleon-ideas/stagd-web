'use client';

import Link from 'next/link';
import styles from '../login/login.module.css';

export default function ConfirmEmailPage() {
  return (
    <div className={styles.authContainer}>
      <div className={styles.authBox}>
        <div className={styles.authHeader}>
          <h1>Check your inbox</h1>
          <p>We sent a confirmation link to your email address. Click it to activate your account.</p>
        </div>
        <p className={styles.authFooter}>
          Wrong email? <Link href="/auth/signup">Start over</Link>
        </p>
      </div>
    </div>
  );
}
