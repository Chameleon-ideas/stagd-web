import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMail } from '@/lib/mail';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/explore?tab=creatives';

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
    return NextResponse.redirect(`${origin}${next}`);
  }

  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash, type: type as any });
    if (!error) {
      if (type === 'signup' && data.user?.email) {
        const name = data.user.user_metadata?.full_name ?? 'there';
        sendMail({
          to: data.user.email,
          subject: `Welcome to Stag'd`,
          html: `
            <p>Hi ${name},</p>
            <p>Welcome to <strong>Stag'd</strong> — Pakistan's creative economy platform.</p>
            <p>Your account is confirmed. Here's what you can do:</p>
            <ul>
              <li>Discover creatives by discipline and city</li>
              <li>Send a commission brief directly to any creative</li>
              <li>Browse and buy tickets to creative events</li>
            </ul>
            <p><a href="https://stagd.app/explore">Start exploring →</a></p>
            <p style="color:#888;font-size:12px;">Stag'd · stagd.app · Pakistan's creative economy platform</p>
          `,
        }).catch(() => { });
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=confirmation_failed`);
}
