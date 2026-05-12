'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function MagicLandingPage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/explore?tab=artists');
      } else {
        // Listen for the auth state change triggered by detectSessionInUrl
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            subscription.unsubscribe();
            router.replace('/explore?tab=artists');
          } else if (event === 'TOKEN_REFRESHED' && session) {
            subscription.unsubscribe();
            router.replace('/explore?tab=artists');
          }
        });

        // Fallback: if no auth event fires within 5s, redirect to login
        const timeout = setTimeout(() => {
          subscription.unsubscribe();
          router.replace('/auth/login');
        }, 5000);

        return () => {
          subscription.unsubscribe();
          clearTimeout(timeout);
        };
      }
    });
  }, [router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--color-yellow)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: 'var(--text-faint)', fontSize: '14px' }}>Signing you in…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
