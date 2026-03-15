'use client';

import { IconKey, IconMoon, IconSun } from '@tabler/icons-react';
import { Link, usePathname } from '@/i18n/navigation';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';

export function SiteHeader() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations('nav');

  const getPageTitle = (path: string): string => {
    if (path === '/active-loans') return t('activeLoans');
    if (path.startsWith('/keys')) return t('keys');
    if (path.startsWith('/settings')) return t('settings');
    return t('activeLoans');
  };

  const pageTitle = getPageTitle(pathname);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-medium">{pageTitle}</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? (
              <IconSun className="h-3.5 w-3.5" />
            ) : (
              <IconMoon className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button variant="link" asChild size="sm" className="hidden sm:flex">
            <Link href="/" className="dark:text-foreground flex items-center gap-1">
              <IconKey className="size-4" />
              Nyckla
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
