import type { Metadata } from 'next';
import { Outfit, Noto_Sans_Thai, Inter } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const notoSansThai = Noto_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-noto-sans-thai',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FB Manager Hub',
  description: 'ระบบจัดการบัญชีและเพจ Facebook แบบครบวงจร',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${outfit.variable} ${notoSansThai.variable} ${inter.variable}`}>
      <body className="antialiased min-h-screen bg-slate-50 text-slate-800 font-sans">
        {children}
      </body>
    </html>
  );
}
