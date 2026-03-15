'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations('settings');

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6">
        <h1 className="text-2xl font-semibold">{t('heading')}</h1>
      </header>

      <div className="flex-1">
        <div className="border-b">
          <nav className="flex gap-6 px-6" aria-label="Settings tabs">
            <Link
              href="/settings/organization"
              className={`py-3 text-sm font-medium transition-colors ${
                pathname === '/settings/organization'
                  ? 'border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('tabOrganization')}
            </Link>
            <Link
              href="/settings/access-areas"
              className={`py-3 text-sm font-medium transition-colors ${
                pathname === '/settings/access-areas'
                  ? 'border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('tabAccessAreas')}
            </Link>
          </nav>
        </div>

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
