'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

interface Props {
  eventId: string;
  organiserId: string;
  status: string;
}

export function OrganizerBar({ eventId, organiserId, status }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user || user.id !== organiserId) return null;

  const handleCancel = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ op: 'cancelEvent', eventId }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      router.push(`/profile/${user.username}`);
    } catch (err: any) {
      setError(err.message ?? 'Failed to cancel event.');
      setLoading(false);
      setConfirming(false);
    }
  };

  return (
    <div style={{
      borderBottom: '1.5px solid #1a1a1a',
      padding: '12px 0 16px',
      marginBottom: '8px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: '#555',
          letterSpacing: '0.08em',
        }}>
          // YOUR EVENT
        </span>

        <div style={{ display: 'flex', gap: '10px' }}>
          {status !== 'cancelled' && !confirming && (
            <button
              onClick={() => setConfirming(true)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.06em',
                padding: '7px 16px',
                background: 'transparent',
                border: '1.5px solid #333',
                color: '#888',
                cursor: 'pointer',
              }}
            >
              CANCEL EVENT
            </button>
          )}
        </div>
      </div>

      {confirming && status !== 'cancelled' && (
        <div style={{
          background: 'rgba(230,57,70,0.06)',
          border: '1.5px solid rgba(230,57,70,0.3)',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: '#ccc',
            lineHeight: 1.6,
            margin: 0,
          }}>
            THIS WILL MARK THE EVENT AS CANCELLED. TICKET HOLDERS WILL NOT BE AUTOMATICALLY NOTIFIED YET — THAT IS A FUTURE FEATURE. ARE YOU SURE?
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleCancel}
              disabled={loading}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.06em',
                padding: '9px 20px',
                background: '#E63946',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              {loading ? 'CANCELLING...' : 'YES, CANCEL IT'}
            </button>
            <button
              onClick={() => { setConfirming(false); setError(null); }}
              disabled={loading}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.06em',
                padding: '9px 20px',
                background: 'transparent',
                border: '1.5px solid #333',
                color: '#666',
                cursor: 'pointer',
              }}
            >
              KEEP IT
            </button>
          </div>
          {error && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#E63946', margin: 0 }}>
              ERROR: {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
