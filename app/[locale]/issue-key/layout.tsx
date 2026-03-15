import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'Issue Key - Nyckla',
  description: 'Issue keys to borrowers',
};

export default async function IssueKeyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as 'sv' | 'en');
  return (
    <div className="min-h-screen bg-background">
      {/* Full-screen workflow - no sidebar, no navigation */}
      <main className="h-screen overflow-hidden">{children}</main>
    </div>
  );
}
