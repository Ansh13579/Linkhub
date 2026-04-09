import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LinkHub — Your Link in Bio, Elevated',
  description:
    'LinkHub is the premium multi-tenant Link in Bio platform. Create a stunning profile page with custom themes, drag-and-drop links, and detailed analytics.',
  keywords: 'link in bio, linktree alternative, personal dashboard, social links',
  openGraph: {
    title: 'LinkHub — Your Link in Bio, Elevated',
    description: 'Create a stunning link in bio page with custom themes and analytics.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
