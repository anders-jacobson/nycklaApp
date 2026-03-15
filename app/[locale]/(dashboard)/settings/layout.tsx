import { setRequestLocale } from 'next-intl/server';
import SettingsLayoutClient from './_layout-client';

export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as 'sv' | 'en');
  return <SettingsLayoutClient>{children}</SettingsLayoutClient>;
}
