'use client';

import { useState } from 'react';
import { Palette, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './RequestCreativeModal.module.css';

interface Props {
  onClose: () => void;
  onSent: () => void;
}

export default function RequestCreativeModal({ onClose, onSent }: Props) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setSending(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError('Session expired. Please sign in again.');
      setSending(false);
      return;
    }

    const res = await fetch('/api/db', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ op: 'requestCreativeUpgrade' }),
    });

    const { error: err } = await res.json();
    if (err) {
      setError(err);
      setSending(false);
      return;
    }

    onSent();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>

        <div className={styles.icon}>
          <Palette size={28} />
        </div>

        <div className={styles.body}>
          <p className={styles.eyebrow}>// Account Upgrade</p>
          <h2 className={styles.title}>Request Creative Access</h2>
          <p className={styles.description}>
            The Stag'd team will review your request and reach out to set up your Creative profile. You can send one request per day.
          </p>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button className="btn btn-ghost btn-md" onClick={onClose} disabled={sending}>
            Cancel
          </button>
          <button className="btn btn-primary btn-md" onClick={handleConfirm} disabled={sending}>
            {sending ? 'Sending...' : 'Send Request'}
          </button>
        </div>
      </div>
    </div>
  );
}
