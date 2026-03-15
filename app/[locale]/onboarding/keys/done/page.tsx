'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { IconCheck } from '@tabler/icons-react';
import { useRouter } from '@/i18n/navigation';

export default function DonePage() {
  const t = useTranslations('onboarding');
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect after 3 seconds
    const timeout = setTimeout(() => {
      router.push('/keys');
    }, 3000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-primary rounded-full flex items-center justify-center">
          <IconCheck className="h-12 w-12 text-primary-foreground" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{t('doneHeading')}</h1>
          <p className="text-muted-foreground">{t('doneDescription')}</p>
        </div>

        <Button onClick={() => router.push('/keys')} size="lg" className="h-12">
          {t('doneGoToKeys')}
        </Button>
      </div>
    </div>
  );
}
