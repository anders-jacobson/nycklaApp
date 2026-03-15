'use client';

import { useEffect, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from '@/i18n/navigation';
import { getOnboardingSession, updateOnboardingDraft } from '@/app/actions/onboarding';
import { IconArrowRight } from '@tabler/icons-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Step1Page() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const [orgName, setOrgName] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load existing draft and current org name
    getOnboardingSession().then((result) => {
      if (result.success && result.data) {
        // Prefer draft name, fallback to current entity name
        setOrgName(result.data.draft.orgName || result.data.currentOrgName || '');
      }
      setIsLoading(false);
    });
  }, []);

  const handleNext = () => {
    if (!orgName.trim()) return;

    startTransition(async () => {
      const result = await updateOnboardingDraft(1, { orgName: orgName.trim() });
      if (result.success) {
        router.push('/onboarding/keys/step-2');
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-11 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t('step1Heading')}</h2>
        <p className="text-muted-foreground mt-2">
          {orgName ? t('step1DescExisting') : t('step1DescNew')}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="orgName" className="text-base">
            {t('step1Label')}
          </Label>
          <Input
            id="orgName"
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder={t('step1Placeholder')}
            className="h-11 mt-2"
            maxLength={200}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus={!orgName} // Only autofocus if empty
          />
          <p className="text-sm text-muted-foreground mt-1">
            {t('step1CharCount', { count: orgName.length })}
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          onClick={handleNext}
          disabled={!orgName.trim() || isPending}
          className="ml-auto min-w-32"
          size="lg"
        >
          {isPending ? t('saving') : t('next')}
          <IconArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
