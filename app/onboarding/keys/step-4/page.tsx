'use client';

import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { getOnboardingSession, updateOnboardingDraft } from '@/app/actions/onboarding';
import { IconArrowLeft, IconArrowRight, IconMinus, IconPlus } from '@tabler/icons-react';
import { generateSeries } from '@/lib/label-generators';

export default function Step4Page() {
  const router = useRouter();
  const [allLabels, setAllLabels] = useState<string[]>([]);
  const [copiesMap, setCopiesMap] = useState<Record<string, number>>({});
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

        // Initialize copies map with existing values or defaults
        const initialCopies: Record<string, number> = {};
        labels.forEach((label) => {
          initialCopies[label] = draft.copiesMap?.[label] || 1;
        });
        setCopiesMap(initialCopies);
      }
      setIsLoading(false);
    });
  }, []);

  const handleIncrement = (label: string) => {
    setCopiesMap((prev) => ({
      ...prev,
      [label]: Math.min((prev[label] || 1) + 1, 99),
    }));
  };

  const handleDecrement = (label: string) => {
    setCopiesMap((prev) => ({
      ...prev,
      [label]: Math.max((prev[label] || 1) - 1, 1),
    }));
  };

  const handleNext = () => {
    startTransition(async () => {
      const session = await getOnboardingSession();
      if (!session.success || !session.data) return;

      const result = await updateOnboardingDraft(4, {
        ...session.data.draft,
        copiesMap,
      });

      if (result.success) {
        router.push('/onboarding/keys/step-5');
      }
    });
  };

  const handleBack = () => {
    router.push('/onboarding/keys/step-3');
  };

  const getTotalCopies = () => {
    return Object.values(copiesMap).reduce((sum, count) => sum + count, 0);
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
        <h2 className="text-2xl font-bold">Number of Copies</h2>
        <p className="text-muted-foreground mt-2">
          How many physical copies do you have for each key?
        </p>
      </div>

      <div className="space-y-3">
        {allLabels.map((label) => (
          <div
            key={label}
            className="flex items-center gap-4 p-4 border rounded-lg bg-card"
          >
            <div className="flex-1">
              <span className="font-medium">{label}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDecrement(label)}
                disabled={copiesMap[label] <= 1}
                className="h-10 w-10 p-0"
              >
                <IconMinus className="h-4 w-4" />
              </Button>
              <div className="w-12 text-center font-medium text-lg">
                {copiesMap[label]}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleIncrement(label)}
                disabled={copiesMap[label] >= 99}
                className="h-10 w-10 p-0"
              >
                <IconPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Total count */}
      <div className="bg-muted p-4 rounded-lg">
        <p className="text-sm font-medium">
          Total key copies: <span className="text-lg font-bold">{getTotalCopies()}</span>
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

