'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import RolePickerModal from '@/components/auth/RolePickerModal';

function GoogleCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ran = useRef(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error || !code) {
      router.replace('/auth/login?error=google_failed');
      return;
    }

    const nonce = sessionStorage.getItem('google_oauth_nonce') ?? undefined;

    fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then(res => res.json())
      .then(async ({ id_token, error: tokenError }) => {
        if (tokenError || !id_token) throw new Error(tokenError ?? 'No id_token');

        const { data, error: signInError } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: id_token,
          nonce,
        });
        if (signInError) throw signInError;
        sessionStorage.removeItem('google_oauth_nonce');

        const { data: profileRow, error: profileErr } = await supabase
          .from('profiles')
          .select('onboarding_complete')
          .eq('id', data.user.id)
          .single();

        // Fall back to timestamp heuristic if migration hasn't been applied yet
        const needsOnboarding = profileErr
          ? new Date(data.user.last_sign_in_at ?? data.user.created_at).getTime() - new Date(data.user.created_at).getTime() < 10_000
          : !profileRow?.onboarding_complete;

        if (needsOnboarding) {
          setShowPicker(true);
        } else {
          router.replace('/explore?tab=artists');
        }
      })
      .catch(() => {
        router.replace('/auth/login?error=google_failed');
      });
  }, []);

  if (showPicker) {
    return (
      <RolePickerModal
        onComplete={(role) => {
          if (role === 'creative') {
            router.replace('/profile/edit?onboarding=true');
          } else {
            router.replace('/explore?tab=artists');
          }
        }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '24px', height: '24px', border: '2px solid var(--border-color)', borderTopColor: 'var(--text)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Signing you in...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense>
      <GoogleCallback />
    </Suspense>
  );
}
