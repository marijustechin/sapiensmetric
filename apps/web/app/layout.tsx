import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { AuthProvider } from './_components/auth-provider';

export const metadata: Metadata = {
  title: 'Sapiens Metric',
  description:
    'Sapiens Metric — serious cognitive-ability and knowledge-assessment platform (foundation scaffold).',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
