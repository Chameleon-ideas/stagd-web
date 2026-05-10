import { Anton, DM_Sans, JetBrains_Mono, Playfair_Display } from 'next/font/google';

export const anton = Anton({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
});

export const dmSans = DM_Sans({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

export const jetbrainsMono = JetBrains_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

export const playfair = Playfair_Display({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-editorial',
});
