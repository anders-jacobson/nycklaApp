import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as 'sv' | 'en', namespace: 'issueKey' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

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
