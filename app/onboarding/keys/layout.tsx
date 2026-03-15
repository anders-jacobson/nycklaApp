'use client';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { skipOnboarding } from '@/app/actions/onboarding';

const STEPS = [
  { path: '/onboarding/keys/step-1', label: 'Organization' },
  { path: '/onboarding/keys/step-2', label: 'Access Areas' },
  { path: '/onboarding/keys/step-3', label: 'Key Labels' },
  { path: '/onboarding/keys/step-4', label: 'Copies' },
];

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

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
              Skip Setup
            </Button>
          )}
        </div>
        {!isReviewPage && <Progress value={progressValue} className="h-1 rounded-none" />}
      </header>

      <main className="flex-1 container max-w-2xl mx-auto px-4 py-8">
        {!isReviewPage && currentStepIndex >= 0 && (
          <p className="text-sm text-muted-foreground mb-1">
            Step {currentStepIndex + 1} of {STEPS.length} · {STEPS[currentStepIndex].label}
          </p>
        )}
        {children}
      </main>

      <ResponsiveDialog
        open={showSkipDialog}
        onOpenChange={setShowSkipDialog}
        title="Skip Key Setup?"
        footer={
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1" onClick={() => setShowSkipDialog(false)}>
              Continue Setup
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleSkip}
              disabled={isSkipping}
            >
              {isSkipping ? 'Skipping...' : 'Skip Setup'}
            </Button>
          </div>
        }
      >
        <p className="text-muted-foreground">
          You can set up your keys later, but you won&apos;t be able to track key lending until you
          do.
        </p>
      </ResponsiveDialog>
    </div>
  );
}
