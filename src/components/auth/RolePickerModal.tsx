'use client';

import { useState } from 'react';
import { Palette, User, Check, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './RolePickerModal.module.css';

type Role = 'creative' | 'general';

interface Props {
  onComplete: (role: Role) => void;
}

export default function RolePickerModal({ onComplete }: Props) {
  const [selected, setSelected] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError('Session expired. Please sign in again.');
      setSaving(false);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let res: Response;
    try {
      res = await fetch('/api/db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ op: 'completeOnboarding', role: selected }),
        signal: controller.signal,
      });
    } catch {
      clearTimeout(timeout);
      setError('Request timed out. Please try again.');
      setSaving(false);
      return;
    }
    clearTimeout(timeout);

    const { error: err } = await res.json();
    if (err) {
      setError('Something went wrong. Please try again.');
      setSaving(false);
      return;
    }

    onComplete(selected);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>// Welcome to Stag'd</p>
          <h1 className={styles.title}>How do you want<br />to show up?</h1>
          <p className={styles.subtitle}>Not sure which one to pick? You can always start as a Visitor and upgrade to a Creative profile later.</p>
        </div>

        <div className={styles.roleGrid}>
          <button
            type="button"
            className={`${styles.roleCard} ${selected === 'creative' ? styles.roleActive : ''}`}
            onClick={() => setSelected('creative')}
          >
            <div className={styles.roleCardTop}>
              <Palette size={22} />
              {selected === 'creative' && <Check size={16} />}
            </div>
            <span className={styles.roleTitle}>Creative</span>
            <span className={styles.roleDesc}>
              I make work. I want a portfolio, commissions, and my own profile people can discover.
            </span>
          </button>

          <button
            type="button"
            className={`${styles.roleCard} ${selected === 'general' ? styles.roleActive : ''}`}
            onClick={() => setSelected('general')}
          >
            <div className={styles.roleCardTop}>
              <User size={22} />
              {selected === 'general' && <Check size={16} />}
            </div>
            <span className={styles.roleTitle}>Patron</span>
            <span className={styles.roleDesc}>
              I'm here to explore, hire, attend events, and create them too.
            </span>
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button
          className="btn btn-primary btn-lg w-full"
          disabled={!selected || saving}
          onClick={handleConfirm}
          style={{ marginTop: 'var(--space-2)' }}
        >
          {saving ? 'Saving...' : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {selected === 'creative' ? 'Set Up My Profile' : 'Start Exploring'}
              <ArrowRight size={18} />
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
