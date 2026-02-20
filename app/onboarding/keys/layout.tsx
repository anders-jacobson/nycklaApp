'use client';

import { Button } from '@/components/ui/button';
import { IconCheck, IconCircle, IconX } from '@tabler/icons-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { skipOnboarding } from '@/app/actions/onboarding';

const STEPS = [
  { path: '/onboarding/keys/step-1', label: 'Organization' },
  { path: '/onboarding/keys/step-2', label: 'Access Areas' },
  { path: '/onboarding/keys/step-3', label: 'Key Labels' },
  { path: '/onboarding/keys/step-4', label: 'Copies' },
  { path: '/onboarding/keys/step-5', label: 'Names' },
  { path: '/onboarding/keys/step-6', label: 'Map Areas' },
];

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  // Determine current step
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
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with Skip button */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Set Up Your Keys</h1>
          {!isReviewPage && (
            <Button variant="ghost" size="sm" onClick={() => setShowSkipDialog(true)}>
              Skip Setup
            </Button>
          )}
        </div>
      </header>

      {/* Progress Stepper */}
      {!isReviewPage && currentStepIndex >= 0 && (
        <div className="border-b bg-card">
          <div className="container max-w-4xl mx-auto px-4 py-4">
            {/* Mobile: Vertical dots */}
            <div className="md:hidden flex items-center gap-2">
              {STEPS.map((step, index) => (
                <div
                  key={step.path}
                  className={`h-2 flex-1 rounded-full ${
                    index < currentStepIndex
                      ? 'bg-primary'
                      : index === currentStepIndex
                        ? 'bg-primary'
                        : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            {/* Desktop: Horizontal stepper with labels */}
            <div className="hidden md:flex items-center justify-between">
              {STEPS.map((step, index) => {
                const isCompleted = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const isFuture = index > currentStepIndex;

                return (
                  <div key={step.path} className="flex items-center">
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                          isCompleted
                            ? 'bg-primary border-primary text-primary-foreground'
                            : isCurrent
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'bg-background border-muted text-muted-foreground'
                        }`}
                      >
                        {isCompleted ? (
                          <IconCheck className="h-5 w-5" />
                        ) : (
                          <span className="text-sm font-medium">{index + 1}</span>
                        )}
                      </div>
                      <span
                        className={`text-xs ${isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div
                        className={`w-16 h-0.5 mx-2 ${isCompleted ? 'bg-primary' : 'bg-muted'}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step counter */}
            <div className="text-center mt-2 text-sm text-muted-foreground">
              Step {currentStepIndex + 1} of {STEPS.length}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-8">{children}</main>

      {/* Skip Confirmation Dialog */}
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
          You can set up your keys later, but you won't be able to track key lending until you do.
        </p>
      </ResponsiveDialog>
    </div>
  );
}

