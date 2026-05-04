import type { Metadata } from 'next';
import { Anton, DM_Sans, JetBrains_Mono, Playfair_Display } from 'next/font/google';
import Script from 'next/script';
import { ThemeProvider } from '@/lib/theme';
import { AuthProvider } from '@/lib/auth';
import '@/styles/globals.css';
import '@/styles/components.css';

const anton = Anton({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  style: ['normal', 'italic'],
  variable: '--font-editorial',
});

export const metadata: Metadata = {
  title: {
    default: 'Stagd — Pakistan\'s Creative Economy',
    template: '%s | Stagd',
  },
  description:
    'Discover and hire independent artists in Pakistan. Find concerts, workshops, gallery nights, and more. Stagd connects creatives with the people who want to experience them.',
  metadataBase: new URL('https://stagd.app'),
  openGraph: {
    siteName: 'Stagd',
    locale: 'en_PK',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@stagdapp',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${anton.variable} ${dmSans.variable} ${jetbrainsMono.variable} ${playfair.variable}`}
      suppressHydrationWarning
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (function() {
              try {
                var stored = localStorage.getItem('stagd-theme');
                var system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                var theme = stored || system;
                document.documentElement.setAttribute('data-theme', theme);
              } catch(e) {}
            })();
          `}
        </Script>
      </head>
      <body className="antialiased">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
