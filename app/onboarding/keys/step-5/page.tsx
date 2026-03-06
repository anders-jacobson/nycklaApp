'use client';

import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { getOnboardingSession, updateOnboardingDraft } from '@/app/actions/onboarding';
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import { generateSeries } from '@/lib/label-generators';

export default function Step5Page() {
  const router = useRouter();
  const [allLabels, setAllLabels] = useState<string[]>([]);
  const [displayNamesMap, setDisplayNamesMap] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load existing draft and collect all labels
    getOnboardingSession().then((result) => {
      if (result.success && result.data) {
        const draft = result.data.draft;

        // Collect all labels
        const labels: string[] = [
          ...(draft.letterLabels || []),
          ...(draft.seriesPreset
            ? generateSeries(draft.seriesPreset.prefix, draft.seriesPreset.from, draft.seriesPreset.to)
            : []),
          ...(draft.customLabels || []),
        ];

        setAllLabels(labels);

        // Initialize display names map with existing values
        const initialNames: Record<string, string> = {};
        labels.forEach((label) => {
          initialNames[label] = draft.displayNamesMap?.[label] || '';
        });
        setDisplayNamesMap(initialNames);
      }
      setIsLoading(false);
    });
  }, []);

  const handleDisplayNameChange = (label: string, value: string) => {
    setDisplayNamesMap((prev) => ({
      ...prev,
      [label]: value,
    }));
  };

  const handleNext = () => {
    startTransition(async () => {
      const session = await getOnboardingSession();
      if (!session.success || !session.data) return;

      const result = await updateOnboardingDraft(5, {
        ...session.data.draft,
        displayNamesMap,
      });

      if (result.success) {
        router.push('/onboarding/keys/step-6');
      }
    });
  };

  const handleBack = () => {
    router.push('/onboarding/keys/step-4');
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
        <h2 className="text-2xl font-bold">Display Names</h2>
        <p className="text-muted-foreground mt-2">
          Optionally give each key a descriptive name (e.g., "Main entrance key"). If left blank,
          the label will be used.
        </p>
      </div>

      <div className="space-y-3">
        {allLabels.map((label) => (
          <div key={label} className="space-y-2">
            <Label htmlFor={`name-${label}`} className="text-sm font-medium">
              {label}
            </Label>
            <Input
              id={`name-${label}`}
              type="text"
              value={displayNamesMap[label] || ''}
              onChange={(e) => handleDisplayNameChange(label, e.target.value)}
              placeholder={`e.g., Main entrance key, Apt ${label.replace('Z', '')} key`}
              className="h-11"
              maxLength={100}
            />
          </div>
        ))}
      </div>

      <div className="bg-muted p-4 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Tip:</strong> Display names help you and others quickly identify what each key
          is for.
        </p>
      </div>

      <div className="flex gap-3 pt-4">
        <Button onClick={handleBack} variant="outline" className="h-11 min-w-32" size="lg">
          <IconArrowLeft className="mr-2 h-5 w-5" />
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={isPending}
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

