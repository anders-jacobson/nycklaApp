'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { updateOrganisationName } from '@/app/actions/organisation';
import { useRouter } from 'next/navigation';

interface OrganizationOverviewProps {
  organizationName: string;
  isOwner: boolean;
}

export function OrganizationOverview({ organizationName, isOwner }: OrganizationOverviewProps) {
  const [name, setName] = useState(organizationName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (name.trim() === organizationName) {
      return; // No changes made
    }

    setLoading(true);
    setError(null);

    const result = await updateOrganisationName(name);

    setLoading(false);

    if (result.success) {
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="org-name">Organization name</Label>
        <Input
          id="org-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter organization name"
          disabled={!isOwner || loading}
          className="max-w-md"
        />
        {!isOwner && (
          <p className="text-xs text-muted-foreground">
            Only organization owners can edit the name
          </p>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      {isOwner && (
        <Button type="submit" disabled={loading || name.trim() === organizationName}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      )}
    </form>
  );
}


