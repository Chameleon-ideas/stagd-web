'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import styles from './login.module.css';

/*
OLD IMPLEMENTATION (kept intentionally):

const [email, setEmail] = useState('');
const { login, isLoading } = useAuth();
...
await login(email);
*/

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authBox}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoStag}>STAG</span>
          <span className={styles.logoD}>D</span>
        </Link>

        <div className={styles.authHeader}>
          <h1>Welcome back</h1>
          <p>Login to your Stagd account</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.authForm}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>Email address</label>
            <input
              type="email"
              id="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
            />
          </div>

          {error && <p className={styles.errorText}>{error}</p>}

          <button
            type="submit"
            className={`btn btn-primary btn-md ${styles.submitBtn}`}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Continue'}
          </button>
        </form>

        <p className={styles.authFooter}>
          Don't have an account? <Link href="/auth/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
