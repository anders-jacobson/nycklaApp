import { setRequestLocale } from 'next-intl/server';

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'sv' | 'en');
  return <div className="max-w-[1140px] mx-auto p-4">Välkommen till Nyckelhantering</div>;
}
