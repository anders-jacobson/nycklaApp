'use client';

import { IconKey } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';

// Map pathnames to page titles
const getPageTitle = (pathname: string): string => {
  if (pathname === '/active-loans') return 'Active Loans';
  if (pathname.startsWith('/keys')) return 'Keys';
  if (pathname.startsWith('/lifecycle')) return 'Lifecycle';
  if (pathname.startsWith('/analytics')) return 'Analytics';
  if (pathname.startsWith('/projects')) return 'Projects';
  if (pathname.startsWith('/team')) return 'Team';
  return 'Active Loans'; // fallback
};

export function SiteHeader() {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-medium">{pageTitle}</h1>
        <div className="ml-auto flex items-center gap-2">
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
