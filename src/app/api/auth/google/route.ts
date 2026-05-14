import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { code } = await request.json();
  if (!code) return NextResponse.json({ error: 'No code provided' }, { status: 400 });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  });

  const tokens = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: tokens.error_description ?? 'Token exchange failed' }, { status: 400 });
  }

  return NextResponse.json({ id_token: tokens.id_token });
}
