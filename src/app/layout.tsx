import type { Metadata } from 'next';
import Script from 'next/script';
import { ThemeProvider } from '@/lib/theme';
import '@/styles/globals.css';
import '@/styles/components.css';

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
    <html lang="en" suppressHydrationWarning>
      <Script
        id="theme-detection"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var stored = localStorage.getItem('stagd-theme');
                var system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', stored || system);
              } catch(e) {}
            })();
          `,
        }}
      />
      <head />
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
