// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 Vorion LLC

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://aurais.net'),
  title: 'Aurais — See every bot. Curate the ones you trust.',
  description: 'Live operational console for certified agent fleets. Built on the BASIS chain. SIEM/SOAR connectors included.',
  openGraph: {
    title: 'Aurais — See every bot. Curate the ones you trust.',
    description: 'Live operational console for certified agent fleets.',
    images: ['/opengraph-image.png'],
    type: 'website',
  },
  icons: { icon: '/icon.png', apple: '/apple-icon.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-site="aurais" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://rsms.me" crossOrigin="" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600;700&family=IBM+Plex+Serif:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
