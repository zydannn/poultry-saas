import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import FloatingHelpBubble from '@/components/FloatingHelpBubble';

import { SettingsProvider } from '@/context/SettingsContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'PoultryOS — Farm Intelligence Platform',
  description: 'Manage your poultry farm finances: HPP calculation, BEP analysis, and daily production tracking.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SettingsProvider>
          <LanguageProvider>
            {children}
            <FloatingHelpBubble />
          </LanguageProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
