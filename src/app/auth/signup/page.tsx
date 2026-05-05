'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import styles from './signup.module.css';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'creative' as 'creative' | 'visitor'
  });
  const { signup, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signup(formData);
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authBox}>
        <div className={styles.authHeader}>
          <h1>Join Stagd</h1>
          <p>The home for Pakistan's creative economy</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.authForm}>
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              placeholder="Zia Ahmed"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              className="input-field"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              type="email"
              id="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="input-field"
            />
          </div>

          <div className="form-group">
            <label>I am a...</label>
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

          <button
            type="submit"
            className="btn btn-primary btn-block"
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
