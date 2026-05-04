'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import styles from './signup.module.css';

/*
OLD IMPLEMENTATION (kept intentionally):

const [formData, setFormData] = useState({
  fullName: '',
  email: '',
  role: 'creative' as 'creative' | 'visitor'
});
...
await signup(formData);
*/

export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'creative' as 'creative' | 'visitor',
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { signup, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await signup(formData);
      setMessage('Signup successful. Please verify your email if confirmation is enabled, then login.');
    } catch (err: any) {
      setError(err?.message || 'Signup failed');
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
          <h1>Join Stagd</h1>
          <p>The home for Pakistan&apos;s creative economy</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.authForm}>
          <div className={styles.formGroup}>
            <label htmlFor="fullName" className={styles.label}>Full Name</label>
            <input
              type="text"
              id="fullName"
              placeholder="Zia Ahmed"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>Email address</label>
            <input
              type="email"
              id="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              type="password"
              id="password"
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              minLength={6}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>I am a...</label>
            <div className={styles.roleGrid}>
              <button
                type="button"
                className={`${styles.roleCard} ${formData.role === 'creative' ? styles.roleActive : ''}`}
                onClick={() => setFormData({ ...formData, role: 'creative' })}
              >
                <span className={styles.roleTitle}>Creative</span>
                <span className={styles.roleDesc}>I want to share my work and get hired.</span>
              </button>
              <button
                type="button"
                className={`${styles.roleCard} ${formData.role === 'visitor' ? styles.roleActive : ''}`}
                onClick={() => setFormData({ ...formData, role: 'visitor' })}
              >
                <span className={styles.roleTitle}>Visitor</span>
                <span className={styles.roleDesc}>I want to discover artists and book tickets.</span>
              </button>
            </div>
          </div>

          {error && <p className={styles.errorText}>{error}</p>}
          {message && <p className={styles.successText}>{message}</p>}

          <button
            type="submit"
            className={`btn btn-primary btn-md ${styles.submitBtn}`}
            disabled={isLoading}
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className={styles.authFooter}>
          Already have an account? <Link href="/auth/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
