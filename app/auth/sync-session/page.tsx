'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IconAlertCircle, IconLogout } from '@tabler/icons-react';

export default function SyncSessionPage() {
  const [status, setStatus] = useState<'checking' | 'mismatch' | 'synced'>('checking');
  const [authEmail, setAuthEmail] = useState<string>('');

  async function checkSession() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = '/auth/login';
      return;
    }

    setAuthEmail(user.email || '');

    // Check if user exists in database
    const response = await fetch('/api/check-user-exists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email }),
    });

    const { exists } = await response.json();

    if (exists) {
      setStatus('synced');
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        window.location.href = '/active-loans';
      }, 2000);
    } else {
      setStatus('mismatch');
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkSession();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  }

  if (status === 'checking') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Checking session...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (status === 'synced') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-green-600">✓ Session Valid</CardTitle>
            <CardDescription>Redirecting to dashboard...</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <IconAlertCircle className="h-6 w-6" />
            <CardTitle>Session Mismatch</CardTitle>
          </div>
          <CardDescription>
            Your authentication session is active, but your user profile is missing from the
            database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted p-4">
            <p className="text-sm">
              <strong>Logged in as:</strong> {authEmail}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">This usually happens when:</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>The database was reset during development</li>
              <li>Your registration wasn&apos;t completed</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">To fix this:</p>
            <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
              <li>Sign out from your current session</li>
              <li>Log in again with the same or a new email address</li>
              <li>Complete your organization setup</li>
            </ol>
          </div>

          <Button onClick={handleSignOut} className="w-full gap-2">
            <IconLogout className="h-4 w-4" />
            Sign Out and Log In Again
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
