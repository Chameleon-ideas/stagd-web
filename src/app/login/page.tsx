'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { authenticate } from './actions';
import { ArrowRight, Lock } from 'lucide-react';
import styles from './login.module.css';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const formData = new FormData();
    formData.append('password', password);

    startTransition(async () => {
      const result = await authenticate(formData);
      if (result.success) {
        router.push('/');
        router.refresh();
      } else {
        setError(result.error || 'ACCESS DENIED');
      }
    });
  };

  return (
    <main className={styles.page}>
      <div className={styles.loginCard}>
        <span className={styles.meta}>// SECURE INSTALLATION_V1.0</span>
        <h1 className={styles.title}>Access<br />Restricted</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Enter Passphrase</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="••••••••"
              autoFocus
              required
            />
          </div>

          <button type="submit" className={styles.button} disabled={isPending}>
            {isPending ? 'Verifying...' : (
              <>
                Unlock Installation <ArrowRight size={18} />
              </>
            )}
          </button>

          {error && <p className={styles.error}>{error}</p>}
        </form>
      </div>

      <div className={styles.footer}>
        © STAGD 2026 . ALL RIGHTS RESERVED . SECURE PORTAL
      </div>
    </main>
  );
}
