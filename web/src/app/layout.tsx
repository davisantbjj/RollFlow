import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth';
import { FeedbackProvider } from '@/components/feedback';
import { Bebas_Neue, JetBrains_Mono, Syne } from 'next/font/google';
import './globals.css';

const bebas = Bebas_Neue({ subsets: ['latin'], weight: '400', variable: '--font-bebas' });
const syne = Syne({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-syne' });
const jb = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jb' });

export const metadata: Metadata = {
  title: { default: 'RollFlow — Painel', template: '%s · RollFlow' },
  description: 'Painel web para donos de academias de Jiu-Jitsu.',
};

export const viewport: Viewport = { themeColor: '#07080c', colorScheme: 'dark' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${bebas.variable} ${syne.variable} ${jb.variable}`}>
      <body className="min-h-screen bg-bg text-fg antialiased">
        <AuthProvider>
          <FeedbackProvider>{children}</FeedbackProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
