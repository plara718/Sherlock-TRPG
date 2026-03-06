import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TETHER | Sherlock Holmes TRPG',
  description: 'Connect to the mind of Sherlock Holmes.',
  manifest: '/manifest.json',
  // Next.js 13 では metadata の中に viewport 関連を記述します
  themeColor: '#1a1512',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TETHER',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="apple-touch-icon" href="/images/app_icon.png" />
      </head>
      <body className={`${inter.className} overscroll-none`}>
        {children}
      </body>
    </html>
  );
}