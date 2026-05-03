import { createClient } from '@supabase/supabase-js';

// Environment variables are provided by Next.js during build and runtime.
// We use fallbacks to prevent hard crashes during the static build phase
// if the environment variables are not present in the CI/CD environment.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn(
    'STAGD: Supabase environment variables are missing. Using placeholders for build-time stability.'
  );
}

// Initialize the client.
// Note: Requests will only work if actual credentials are provided in .env.local
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
