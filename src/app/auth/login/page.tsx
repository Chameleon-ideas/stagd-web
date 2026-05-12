'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, Mail } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import styles from './login.module.css';

export default function LoginPage() {
  const [mode, setMode] = useState<'password' | 'magic'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, sendMagicLink, isLoading, user } = useAuth();
  const router = useRouter();

  // Redirect already-authenticated users
  useEffect(() => {
    if (!isLoading && user) router.replace('/explore?tab=artists');
  }, [user, isLoading, router]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message ?? 'Login failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleMagicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await sendMagicLink(email);
      setMagicSent(true);
    } catch (err: any) {
      setError(err.message ?? 'Failed to send link. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={styles.authBox}
      >
        <div className={styles.authHeader}>
          <Link href="/" className={styles.backLink}>← Back</Link>
          <h1>Welcome back</h1>
          <p>Login to your Stag'd account</p>
        </div>

        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => { setMode('password'); setError(null); setMagicSent(false); }}
            style={{
              flex: 1, padding: '9px', fontSize: '12px', fontWeight: 600,
              letterSpacing: '0.5px', textTransform: 'uppercase',
              border: '1.5px solid var(--border)',
              background: mode === 'password' ? 'var(--color-yellow)' : 'transparent',
              color: mode === 'password' ? '#111' : 'var(--text-faint)',
              cursor: 'pointer', borderRadius: '100px',
            }}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => { setMode('magic'); setError(null); setMagicSent(false); }}
            style={{
              flex: 1, padding: '9px', fontSize: '12px', fontWeight: 600,
              letterSpacing: '0.5px', textTransform: 'uppercase',
              border: '1.5px solid var(--border)',
              background: mode === 'magic' ? 'var(--color-yellow)' : 'transparent',
              color: mode === 'magic' ? '#111' : 'var(--text-faint)',
              cursor: 'pointer', borderRadius: '100px',
            }}
          >
            Email link
          </button>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'password' ? (
            <motion.form
              key="password"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onSubmit={handlePasswordSubmit}
              className={styles.authForm}
            >
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="email">// Email address</label>
                <input
                  type="email" id="email" placeholder="name@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  required className="input"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="password">// Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'} id="password"
                    placeholder="••••••••" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required className="input"
                  />
                  <button
                    type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <AnimatePresence>
                {error && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={styles.errorText}>
                    ⚠ {error}
                  </motion.p>
                )}
              </AnimatePresence>
              <button type="submit" className="btn btn-primary btn-lg w-full" disabled={isSubmitting} style={{ marginTop: 'var(--space-2)' }}>
                {isSubmitting ? 'Signing in...' : <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>Sign in <ArrowRight size={18} /></span>}
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="magic"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onSubmit={handleMagicSubmit}
              className={styles.authForm}
            >
              {magicSent ? (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: '16px 0' }}>
                  <Mail size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.6 }} />
                  <p style={{ fontWeight: 600, marginBottom: '6px' }}>Check your inbox</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-faint)' }}>We sent a login link to <strong>{email}</strong>. Click it to sign in.</p>
                </motion.div>
              ) : (
                <>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="magic-email">// Email address</label>
                    <input
                      type="email" id="magic-email" placeholder="name@example.com"
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      required className="input"
                    />
                  </div>
                  <AnimatePresence>
                    {error && (
                      <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={styles.errorText}>
                        ⚠ {error}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  <button type="submit" className="btn btn-primary btn-lg w-full" disabled={isSubmitting} style={{ marginTop: 'var(--space-2)' }}>
                    {isSubmitting ? 'Sending...' : <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>Send login link <ArrowRight size={18} /></span>}
                  </button>
                </>
              )}
            </motion.form>
          )}
        </AnimatePresence>

        <p className={styles.authFooter}>
          Don't have an account? <Link href="/auth/signup">Sign up</Link>
        </p>
      </motion.div>
    </div>
  );
}
