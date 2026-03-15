import React from 'react';
import { setRequestLocale } from 'next-intl/server';
import NavbarRoot from '@/components/root/NavbarRoot';

async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as 'sv' | 'en');
  return (
    <>
      <NavbarRoot />
      <div className="max-w-[1140px] mx-auto">{children}</div>
    </>
  );
}

export default Layout;
