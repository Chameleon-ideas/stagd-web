'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { User, Palette, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import styles from './signup.module.css';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: '' as 'creative' | 'patron' | '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { signup, loginWithGoogle, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.role) {
      setError('Please select if you are a Creative or a Patron.');
      return;
    }

    try {
      await signup(formData as any);
    } catch (err: any) {
      const msg: string = err.message ?? '';
      if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('over_email')) {
        setError('Too many sign-up attempts. Please wait a few minutes and try again.');
      } else {
        setError(msg || 'Sign up failed. Please try again.');
      }
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authBox}>
        <div className={styles.authHeader}>
          <Link href="/" className={styles.backLink}>← Back</Link>
          <h1>Join Stag'd</h1>
          <p>Pakistan's infrastructure for the creative class.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>or sign up with email</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.authForm}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="fullName">// Full Name</label>
              <input
                type="text"
                id="fullName"
                placeholder="Zia Ahmed"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                className="input"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="email">// Email address</label>
              <input
                type="email"
                id="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="input"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="password">// Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
                className="input"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>// I am a...</label>
            <div className={styles.roleGrid}>
              <button
                type="button"
                className={`${styles.roleCard} ${formData.role === 'creative' ? styles.roleActive : ''}`}
                onClick={() => setFormData({ ...formData, role: 'creative' })}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Palette size={20} />
                  {formData.role === 'creative' && <Check size={16} />}
                </div>
                <span className={styles.roleTitle}>Creative</span>
                <span className={styles.roleDesc}>Share work, get hired.</span>
              </button>
              <button
                type="button"
                className={`${styles.roleCard} ${formData.role === 'patron' ? styles.roleActive : ''}`}
                onClick={() => setFormData({ ...formData, role: 'patron' })}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <User size={20} />
                  {formData.role === 'patron' && <Check size={16} />}
                </div>
                <span className={styles.roleTitle}>Patron</span>
                <span className={styles.roleDesc}>Explore, hire, attend events, and create them too.</span>
              </button>
            </div>
          </div>

          {error && <p className={styles.errorText}>⚠ {error}</p>}

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={isLoading}
            style={{ marginTop: 'var(--space-2)' }}
          >
            {isLoading ? 'Processing...' : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Create Account <ArrowRight size={18} />
              </span>
            )}
          </button>
        </form>

        <p className={styles.authFooter}>
          Already have an account? <Link href="/auth/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
