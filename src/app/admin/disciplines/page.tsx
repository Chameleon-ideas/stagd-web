'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Submission {
  value: string;
  submission_count: number;
  unique_users: number;
  latest_at: string;
}

async function dbWrite(op: string, params: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch('/api/db', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({ op, ...params }),
  });
  return res.json();
}

export default function AdminDisciplinesPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [standardList, setStandardList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promoting, setPromoting] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      dbWrite('getCustomDisciplineSubmissions', {}),
      supabase.from('standard_disciplines').select('name').order('display_order'),
    ]).then(([subRes, stdRes]) => {
      if (subRes.error) { setError(subRes.error); return; }
      setSubmissions(subRes.data ?? []);
      setStandardList((stdRes.data ?? []).map((r: any) => r.name));
    }).catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const promote = async (value: string) => {
    setPromoting(value);
    const res = await dbWrite('promoteCustomDiscipline', { name: value });
    if (res.error) {
      alert(res.error);
    } else {
      setStandardList(prev => [...prev, value]);
    }
    setPromoting(null);
  };

  if (loading) return (
    <div style={{ padding: 48, fontFamily: 'monospace', fontSize: 12 }}>Loading…</div>
  );
  if (error) return (
    <div style={{ padding: 48, fontFamily: 'monospace', fontSize: 12, color: 'red' }}>
      Error: {error}
    </div>
  );

  return (
    <div style={{ padding: 48, fontFamily: 'monospace', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, textTransform: 'uppercase', marginBottom: 8 }}>
        Custom Discipline Submissions
      </h1>
      <p style={{ fontSize: 12, opacity: 0.5, marginBottom: 32, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {submissions.length} unique values from users
      </p>
      {submissions.length === 0 ? (
        <p style={{ opacity: 0.5, fontSize: 12, textTransform: 'uppercase' }}>No custom submissions yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #333' }}>
              <th style={{ padding: '8px 16px 8px 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Value</th>
              <th style={{ padding: '8px 16px 8px 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Submissions</th>
              <th style={{ padding: '8px 16px 8px 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Unique Users</th>
              <th style={{ padding: '8px 16px 8px 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Latest</th>
              <th style={{ padding: '8px 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map(s => {
              const isStandard = standardList.some(name => name.toLowerCase() === s.value.toLowerCase());
              return (
                <tr key={s.value} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: '10px 16px 10px 0', fontWeight: 700, textTransform: 'uppercase' }}>
                    {s.value}
                  </td>
                  <td style={{ padding: '10px 16px 10px 0' }}>{s.submission_count}</td>
                  <td style={{ padding: '10px 16px 10px 0' }}>{s.unique_users}</td>
                  <td style={{ padding: '10px 16px 10px 0', opacity: 0.5 }}>
                    {new Date(s.latest_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '10px 0' }}>
                    {isStandard ? (
                      <span style={{ color: '#a3e635', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Already standard
                      </span>
                    ) : (
                      <button
                        onClick={() => promote(s.value)}
                        disabled={promoting === s.value}
                        style={{
                          fontFamily: 'monospace',
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          padding: '6px 12px',
                          border: '1.5px solid #d4f531',
                          background: 'transparent',
                          color: '#d4f531',
                          cursor: promoting === s.value ? 'not-allowed' : 'pointer',
                          opacity: promoting === s.value ? 0.5 : 1,
                        }}
                      >
                        {promoting === s.value ? '…' : 'Promote to standard'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <h2 style={{ fontSize: 18, fontWeight: 900, textTransform: 'uppercase', marginTop: 64, marginBottom: 16 }}>
        Current Standard List ({standardList.length})
      </h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {standardList.map(name => (
          <span
            key={name}
            style={{
              fontFamily: 'monospace',
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              padding: '6px 12px',
              border: '1.5px solid #333',
              letterSpacing: '0.08em',
            }}
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
