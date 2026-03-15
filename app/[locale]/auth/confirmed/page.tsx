'use client';

import { useEffect } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export default function ConfirmedPage() {
  const t = useTranslations('auth.confirmed');
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect after 2 seconds
    const timer = setTimeout(() => {
      router.push('/active-loans');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <svg
              className="h-8 w-8 text-green-600 dark:text-green-400"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{t('heading')}</h1>
          <p className="text-muted-foreground">{t('redirecting')}</p>
        </div>

        <Link
          href="/active-loans"
          className="inline-block rounded-md bg-primary px-6 py-2 text-primary-foreground font-medium shadow transition duration-200 focus:outline-none focus:ring-2 focus:ring-ring hover:bg-primary/90"
        >
          {t('goToDashboard')}
        </Link>
      </div>
    </div>
  );
}
