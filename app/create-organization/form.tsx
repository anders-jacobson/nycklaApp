'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createOrganisation } from '@/app/actions/organisation';
import { IconBuilding, IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';
import { toastError } from '@/components/ui/toast-store';

export function CreateOrganizationForm() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return; // Prevent double-submit

    setLoading(true);
    setError(null);

    try {
      // Server action will redirect on success or return error
      const result = await createOrganisation(name);

      // If we get here, it means the action returned instead of redirecting
      // This happens when there's a validation error
      if (result && !result.success) {
        setLoading(false);
        setError(result.error);
        toastError(result.error);
      }
      // If redirect succeeds, this line never executes
    } catch (error) {
      // Re-throw redirect errors (let Next.js handle them)
      if ((error as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) {
        throw error;
      }
      // Handle real errors only
      setLoading(false);
      const errorMsg = 'Failed to create organization';
      setError(errorMsg);
      toastError(errorMsg);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-border bg-background">
            <IconBuilding className="h-10 w-10 text-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Create New Organization</h1>
          <p className="text-base text-muted-foreground">
            Set up your organization to start managing keys
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name" className="text-base">
              Organization Name
            </Label>
            <Input
              id="org-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null); // Clear error on input change
              }}
              placeholder="My Housing Cooperative"
              disabled={loading}
              required
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              className="h-11 text-base"
            />
            <p className="text-xs text-muted-foreground">
              Choose a descriptive name for your organization
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading || !name.trim()}>
            {loading ? 'Creating...' : 'Create Organization'}
          </Button>
        </form>

        {/* Back link */}
        <div className="text-center">
          <Link
            href="/no-organization"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <IconArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </div>
    </div>
  );
}
