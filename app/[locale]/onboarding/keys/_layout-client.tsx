'use client';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { skipOnboarding } from '@/app/actions/onboarding';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('onboarding');
  const pathname = usePathname();
  const router = useRouter();
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  const STEPS = [
    { path: '/onboarding/keys/step-1', label: t('stepOrganization') },
    { path: '/onboarding/keys/step-2', label: t('stepAccessAreas') },
    { path: '/onboarding/keys/step-3', label: t('stepKeyLabels') },
    { path: '/onboarding/keys/step-4', label: t('stepCopies') },
  ];

  const currentStepIndex = STEPS.findIndex((s) => pathname === s.path);
  const isReviewPage = pathname === '/onboarding/keys/review';
  const isDonePage = pathname === '/onboarding/keys/done';

  const handleSkip = async () => {
    setIsSkipping(true);
    const result = await skipOnboarding();
    if (result.success) {
      router.push('/keys');
    } else {
      alert(result.error);
      setIsSkipping(false);
    }
  };

  if (isDonePage) {
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <>{children}</>;
  }

  const progressValue = currentStepIndex >= 0 ? ((currentStepIndex + 1) / STEPS.length) * 100 : 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-base font-semibold">Nyckla</span>
          {!isReviewPage && (
            <Button variant="ghost" size="sm" onClick={() => setShowSkipDialog(true)}>
              {t('skipSetup')}
            </Button>
          )}
        </div>
        {!isReviewPage && <Progress value={progressValue} className="h-1 rounded-none" />}
      </header>

      <main className="flex-1 container max-w-2xl mx-auto px-4 py-8">
        {!isReviewPage && currentStepIndex >= 0 && (
          <p className="text-sm text-muted-foreground mb-1">
            {t('progressIndicator', {
              step: currentStepIndex + 1,
              total: STEPS.length,
              label: STEPS[currentStepIndex].label,
            })}
          </p>
        )}
        {children}
      </main>

      <ResponsiveDialog
        open={showSkipDialog}
        onOpenChange={setShowSkipDialog}
        title={t('skipDialogTitle')}
        footer={
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1" onClick={() => setShowSkipDialog(false)}>
              {t('continueSetup')}
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleSkip}
              disabled={isSkipping}
            >
              {isSkipping ? t('skipping') : t('skipSetup')}
            </Button>
          </div>
        }
      >
        <p className="text-muted-foreground">{t('skipDialogBody')}</p>
      </ResponsiveDialog>
    </div>
  );
}
