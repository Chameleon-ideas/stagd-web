import type { Metadata } from 'next';
import { anton, dmSans, jetbrainsMono } from '@/styles/fonts';
import React, { Suspense } from 'react';
import { AuthProvider } from '@/lib/auth';
import { Analytics } from "@vercel/analytics/next"
import '@/styles/globals.css';
import '@/styles/components.css';
import { Header } from '@/components/layout/Header';
import { ConditionalFooter } from '@/components/layout/ConditionalFooter';
import { LenisProvider } from '@/components/layout/LenisProvider';
import { ContentWrapper } from '@/components/layout/ContentWrapper';


export const metadata: Metadata = {
  title: {
    default: "Stag'd — Pakistan's Creative Economy",
    template: "%s — Stag'd",
  },
  description:
    "Discover and hire independent creatives in Pakistan. Find concerts, workshops, gallery nights, and more. Stag'd connects creatives with the people who want to experience them.",
  metadataBase: new URL('https://stagd.app'),
  openGraph: {
    siteName: "Stag'd",
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
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" className={`${anton.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased min-h-screen flex flex-col">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <AuthProvider>
          <LenisProvider>
            <div className="flex flex-col min-h-screen">
              <Suspense fallback={<div style={{ height: '60px' }} />}>
                <Header />
              </Suspense>
              <ContentWrapper>
                {children}
              </ContentWrapper>
              <ConditionalFooter />
            </div>
          </LenisProvider>
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
