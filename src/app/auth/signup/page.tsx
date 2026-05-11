'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Palette, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import styles from './signup.module.css';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: '' as 'creative' | 'visitor' | '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signup, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.role) {
      setError('Please select if you are a Creative or a Visitor.');
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
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={styles.authBox}
      >
        <div className={styles.authHeader}>
          <Link href="/" className={styles.backLink}>← Back</Link>
          <h1>Join Stagd</h1>
          <p>Pakistan's infrastructure for the creative class.</p>
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
                className={`${styles.roleCard} ${formData.role === 'visitor' ? styles.roleActive : ''}`}
                onClick={() => setFormData({ ...formData, role: 'visitor' })}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <User size={20} />
                  {formData.role === 'visitor' && <Check size={16} />}
                </div>
                <span className={styles.roleTitle}>Visitor</span>
                <span className={styles.roleDesc}>Find artists, book tickets.</span>
              </button>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={styles.errorText}
              >
                ⚠ {error}
              </motion.p>
            )}
          </AnimatePresence>

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
      </motion.div>
    </div>
  );
}
