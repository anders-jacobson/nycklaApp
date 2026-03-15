'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IconAlertCircle, IconHome, IconRefresh } from '@tabler/icons-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Check for specific error scenarios
  const isUserNotFound =
    error.message === 'USER_NOT_IN_DB' || error.message.includes('User not found');
  const isNotAuthenticated = error.message.includes('Not authenticated');
  const hasNoOrganisations = error.message === 'USER_HAS_NO_ORGANISATIONS';

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by error boundary:', error);
    }
    if (isUserNotFound) {
      window.location.href = '/auth/sync-session';
    } else if (isNotAuthenticated) {
      window.location.href = '/auth/login';
    } else if (hasNoOrganisations) {
      window.location.href = '/no-organization';
    }
  }, [error, isUserNotFound, isNotAuthenticated, hasNoOrganisations]);

  if (isUserNotFound || isNotAuthenticated || hasNoOrganisations) {
    return null;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <IconAlertCircle className="h-6 w-6" />
            <CardTitle>Something went wrong</CardTitle>
          </div>
          <CardDescription>An error occurred while loading this page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && (
            <div className="rounded-md bg-muted p-4">
              <p className="text-sm font-mono text-destructive">{error.message}</p>
              {error.digest && (
                <p className="mt-2 text-xs text-muted-foreground">Error ID: {error.digest}</p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={reset} variant="outline" className="flex-1 gap-2">
              <IconRefresh className="h-4 w-4" />
              Try Again
            </Button>
            <Button onClick={() => (window.location.href = '/')} className="flex-1 gap-2">
              <IconHome className="h-4 w-4" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
