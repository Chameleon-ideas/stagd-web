'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function authenticate(formData: FormData) {
  const password = formData.get('password');
  const correctPassword = process.env.ACCESS_PASSWORD || 'stagd2026';

  if (password === correctPassword) {
    const cookieStore = await cookies();
    cookieStore.set('authorized', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });
    return { success: true };
  }

  return { success: false, error: 'INVALID ACCESS CREDENTIAL' };
}
