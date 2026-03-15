import { setRequestLocale } from 'next-intl/server';
import OnboardingKeysLayoutClient from './_layout-client';

export default async function OnboardingKeysLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as 'sv' | 'en');
  return <OnboardingKeysLayoutClient>{children}</OnboardingKeysLayoutClient>;
}
