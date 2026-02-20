'use client';

import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { getOnboardingSession, updateOnboardingDraft } from '@/app/actions/onboarding';
import { IconArrowRight } from '@tabler/icons-react';

export default function Step1Page() {
  const router = useRouter();
  const [orgName, setOrgName] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load existing draft and current org name
    getOnboardingSession().then((result) => {
      if (result.success && result.data) {
        // Prefer draft name, fallback to current entity name
        setOrgName(result.data.draft.orgName || result.data.currentOrgName || '');
      }
      setIsLoading(false);
    });
  }, []);

  const handleNext = () => {
    if (!orgName.trim()) return;

    startTransition(async () => {
      const result = await updateOnboardingDraft(1, { orgName: orgName.trim() });
      if (result.success) {
        router.push('/onboarding/keys/step-2');
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Confirm Organization Name</h2>
        <p className="text-muted-foreground mt-2">
          {orgName
            ? 'Update your organization name if needed, or continue to the next step.'
            : "What's the name of your housing cooperative or organization?"}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="orgName" className="text-base">
            Organization Name
          </Label>
          <Input
            id="orgName"
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="e.g., Strandvägen Bostadsrättsförening"
            className="h-12 text-base mt-2"
            maxLength={200}
            autoFocus={!orgName} // Only autofocus if empty
          />
          <p className="text-sm text-muted-foreground mt-1">{orgName.length}/200 characters</p>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          onClick={handleNext}
          disabled={!orgName.trim() || isPending}
          className="ml-auto h-11 min-w-32"
          size="lg"
        >
          {isPending ? 'Saving...' : 'Next'}
          <IconArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
