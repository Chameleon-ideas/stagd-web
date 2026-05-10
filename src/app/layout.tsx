import type { Metadata } from 'next';
import { anton, dmSans, jetbrainsMono, playfair } from '@/styles/fonts';
import React, { Suspense } from 'react';
import { ThemeProvider } from '@/lib/theme';
import { AuthProvider } from '@/lib/auth';
import '@/styles/globals.css';
import '@/styles/components.css';
import { Header } from '@/components/layout/Header';
import { ConditionalFooter } from '@/components/layout/ConditionalFooter';


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
    <html lang="en" className={`${anton.variable} ${dmSans.variable} ${jetbrainsMono.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('stagd-theme');
                  var system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  var theme = stored || system;
                  document.documentElement.setAttribute('data-theme', theme);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ThemeProvider>
          <AuthProvider>
            <div className="flex flex-col min-h-screen">
              <Suspense fallback={<div style={{ height: '60px' }} />}>
                <Header />
              </Suspense>
              <main className="flex-1">
                {children}
              </main>
              <ConditionalFooter />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
