'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createOrganisation } from '@/app/actions/organisation';
import { IconBuilding, IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';
import { toastError, toastSuccess } from '@/components/ui/toast-store';

export default function CreateOrganizationPage() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await createOrganisation(name);

    setLoading(false);

    if (result.success) {
      toastSuccess(`Organization "${name}" created successfully`);
      router.push('/');
      router.refresh();
    } else {
      toastError(result.error);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <IconBuilding className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Create New Organization</h1>
          <p className="text-muted-foreground">
            Set up your organization to start managing keys
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization Name</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Housing Cooperative"
              disabled={loading}
              required
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Choose a descriptive name for your organization
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !name.trim()}>
            {loading ? 'Creating...' : 'Create Organization'}
          </Button>
        </form>

        <div className="text-center">
          <Link href="/no-organization" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <IconArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </div>
    </div>
  );
}



