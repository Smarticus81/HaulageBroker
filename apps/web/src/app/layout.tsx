import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Instrument_Serif } from 'next/font/google';
import { ThemeProvider, themeInitScript } from '@/lib/theme';
import './globals.css';

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Haulage — the autonomous back office for carriers',
    template: '%s · Haulage',
  },
  description:
    'Paperwork, billing, compliance and cash planning that run themselves. Voice-guided setup in under ten minutes.',
  applicationName: 'Haulage',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f5f1' },
    { media: '(prefers-color-scheme: dark)', color: '#121110' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} ${display.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="grain">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
