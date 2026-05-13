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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login, loginWithGoogle, sendMagicLink, isLoading, user } = useAuth();
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          </div>
          <button
            type="button"
            disabled={isGoogleLoading}
            onClick={async () => {
              setIsGoogleLoading(true);
              try { await loginWithGoogle(); } catch { setIsGoogleLoading(false); }
            }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              width: '100%', padding: '11px',
              border: '1.5px solid var(--border-color)',
              background: 'transparent', color: 'var(--text)',
              cursor: isGoogleLoading ? 'not-allowed' : 'pointer',
              borderRadius: '4px', fontSize: '14px', fontWeight: 600,
              fontFamily: 'var(--font-body)', opacity: isGoogleLoading ? 0.6 : 1,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
          </button>
        </div>

        <p className={styles.authFooter}>
          Don't have an account? <Link href="/auth/signup">Sign up</Link>
        </p>
      </motion.div>
    </div>
  );
}
