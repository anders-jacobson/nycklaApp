import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { IconPlus, IconLogout } from '@tabler/icons-react';
import { getCurrentUser } from '@/lib/auth-utils';
import { redirect } from 'next/navigation';

export default async function NoOrganizationPage() {
  let user;

  try {
    user = await getCurrentUser();
    
    // If user actually has an org, redirect to dashboard
    if (user.entityId) {
      redirect('/');
    }
  } catch (error) {
    // If user is not authenticated or has other auth issues, redirect to login
    redirect('/auth/login');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <IconPlus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">No Organization</h1>
          <p className="text-muted-foreground">
            You don&apos;t belong to any organization. Create a new organization to get started or
            log out.
          </p>
        </div>

        <div className="space-y-3">
          <Link href="/auth/complete-profile" className="block">
            <Button className="w-full" size="lg">
              <IconPlus className="h-4 w-4" />
              Create New Organization
            </Button>
          </Link>

          <Link href="/auth/logout" className="block">
            <Button variant="outline" className="w-full" size="lg">
              <IconLogout className="h-4 w-4" />
              Log Out
            </Button>
          </Link>
        </div>

        <div className="rounded-md border p-4 text-left text-sm">
          <p className="mb-2 font-medium">What happened?</p>
          <p className="text-muted-foreground">
            Your organization was deleted, or you left all organizations you were part of. You need
            to create a new organization or be invited to an existing one to continue using the
            app.
          </p>
        </div>
      </div>
    </div>
  );
}

