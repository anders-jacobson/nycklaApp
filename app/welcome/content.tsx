'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { IconSparkles, IconKey, IconFileDescription, IconClock } from '@tabler/icons-react';

interface WelcomeContentProps {
  organizationName: string;
  stats: {
    keyTypes: number;
    totalKeys: number;
    activeLoans: number;
  };
  from: 'create' | 'invitation' | 'join';
}

export function WelcomeContent({ organizationName, stats, from }: WelcomeContentProps) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleContinue = () => {
    setIsRedirecting(true);

    // If organization was just created and has no keys, go to onboarding
    // Otherwise go to dashboard
    if (from === 'create' && stats.keyTypes === 0) {
      router.push('/onboarding/keys');
    } else {
      router.push('/active-loans');
    }
  };

  useEffect(() => {
    // Countdown timer
    if (secondsLeft > 0) {
      const timer = setTimeout(() => setSecondsLeft(secondsLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (secondsLeft === 0 && !isRedirecting) {
      // Auto-redirect after countdown
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleContinue();
    }
  }, [secondsLeft, isRedirecting]);

  const getMessage = () => {
    switch (from) {
      case 'create':
        return 'Your organization has been created!';
      case 'invitation':
        return 'You have successfully joined!';
      default:
        return 'Welcome!';
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-2xl space-y-8 text-center">
        {/* Animated Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 animate-in fade-in zoom-in duration-500">
          <IconSparkles className="h-10 w-10 text-primary" />
        </div>

        {/* Welcome Message */}
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          <p className="text-lg text-muted-foreground">{getMessage()}</p>
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome to <span className="text-primary">{organizationName}</span>
          </h1>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <div className="rounded-lg border bg-card p-6 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <IconFileDescription className="h-6 w-6 text-primary" />
            </div>
            <div className="text-3xl font-bold">{stats.keyTypes}</div>
            <div className="text-sm text-muted-foreground">Key Types</div>
          </div>

          <div className="rounded-lg border bg-card p-6 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <IconKey className="h-6 w-6 text-primary" />
            </div>
            <div className="text-3xl font-bold">{stats.totalKeys}</div>
            <div className="text-sm text-muted-foreground">Total Keys</div>
          </div>

          <div className="rounded-lg border bg-card p-6 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <IconClock className="h-6 w-6 text-primary" />
            </div>
            <div className="text-3xl font-bold">{stats.activeLoans}</div>
            <div className="text-sm text-muted-foreground">Active Loans</div>
          </div>
        </div>

        {/* Continue Button & Timer */}
        <div className="space-y-4 pt-4 animate-in fade-in duration-700 delay-500">
          <Button
            size="lg"
            className="w-full sm:w-auto h-12 px-8"
            onClick={handleContinue}
            disabled={isRedirecting}
          >
            {isRedirecting
              ? 'Redirecting...'
              : from === 'create' && stats.keyTypes === 0
                ? 'Set Up Keys'
                : 'Get Started'}
          </Button>

          <p className="text-sm text-muted-foreground">
            {secondsLeft > 0 ? (
              from === 'create' && stats.keyTypes === 0 ? (
                <>Setting up your keys in {secondsLeft}s...</>
              ) : (
                <>Redirecting to dashboard in {secondsLeft}s...</>
              )
            ) : (
              <>Redirecting...</>
            )}
          </p>

          {/* Progress Bar */}
          <div className="mx-auto w-full max-w-xs">
            <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-1000 ease-linear"
                style={{ width: `${((5 - secondsLeft) / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
