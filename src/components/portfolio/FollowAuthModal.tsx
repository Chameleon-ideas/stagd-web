"use client";

import { useState } from 'react';
import Link from 'next/link';
import { X, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './FollowAuthModal.module.css';

interface FollowAuthModalProps {
  artistName: string;
  artistUsername: string;
  onAuthenticated: (userId: string) => void;
  onClose: () => void;
}

export function FollowAuthModal({ artistName, artistUsername, onAuthenticated, onClose }: FollowAuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError || !data.user) {
      setError(authError?.message ?? 'Sign in failed. Please try again.');
      return;
    }
    onAuthenticated(data.user.id);
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Sign in to follow">
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        <div className={styles.content}>
          <h2 className={styles.heading}>FOLLOW {artistName.split(' ')[0]}</h2>
          <p className={styles.sub}>AUTHENTICATION_REQUIRED // SIGN IN TO FOLLOW THIS ARTIST</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div>
            <label className={styles.label} htmlFor="follow-email">// EMAIL_ADDRESS</label>
            <input
              id="follow-email"
              type="email"
              className={styles.inputField}
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className={styles.label} htmlFor="follow-password">// ACCESS_PASSWORD</label>
            <div className={styles.fieldWrap}>
              <input
                id="follow-password"
                type={showPassword ? 'text' : 'password'}
                className={styles.inputField}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className="btn btn-primary btn-sm w-full"
            style={{ height: 48, fontSize: 14 }}
            disabled={loading}
          >
            {loading ? 'AUTHORIZING...' : 'SIGN IN AND FOLLOW'}
          </button>
        </form>

        <p className={styles.footer}>
          NO ACCOUNT? <Link href={`/auth/signup?next=/${artistUsername}`} onClick={onClose}>SIGN UP NOW </Link>
        </p>
      </div>
    </div>
  );
}
