import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('STAGD: Supabase environment variables are missing.');
}

// Public client — respects RLS, safe for browser use.
// Custom lock bypasses navigator.locks contention in SPA — without it,
// getSession() hangs on page load when multiple auth calls happen concurrently.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: true,
    lock: async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => fn(),
  },
});

// Admin client — bypasses RLS. Only available server-side (no NEXT_PUBLIC_ prefix).
// In browser this falls back to the anon client; all mutations should go through /api/db.
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabase;
