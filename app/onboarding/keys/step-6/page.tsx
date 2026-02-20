'use client';

import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useRouter } from 'next/navigation';
import { getOnboardingSession, updateOnboardingDraft } from '@/app/actions/onboarding';
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import { generateSeries } from '@/lib/label-generators';

export default function Step6Page() {
  const router = useRouter();
  const [allLabels, setAllLabels] = useState<string[]>([]);
  const [accessAreas, setAccessAreas] = useState<string[]>([]);
  const [areaMappings, setAreaMappings] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load existing draft
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
        setAccessAreas(draft.accessAreas || []);

        // Initialize mappings
        const initialMappings: Record<string, string[]> = {};
        labels.forEach((label) => {
          initialMappings[label] = draft.areaMappings?.[label] || [];
        });
        setAreaMappings(initialMappings);
      }
      setIsLoading(false);
    });
  }, []);

  const handleToggleArea = (label: string, area: string) => {
    setAreaMappings((prev) => {
      const current = prev[label] || [];
      const updated = current.includes(area)
        ? current.filter((a) => a !== area)
        : [...current, area];
      return { ...prev, [label]: updated };
    });
  };

  const handleSelectAll = (label: string) => {
    setAreaMappings((prev) => ({
      ...prev,
      [label]: [...accessAreas],
    }));
  };

  const handleClearAll = (label: string) => {
    setAreaMappings((prev) => ({
      ...prev,
      [label]: [],
    }));
  };

  const handleNext = () => {
    startTransition(async () => {
      const session = await getOnboardingSession();
      if (!session.success || !session.data) return;

      const result = await updateOnboardingDraft(6, {
        ...session.data.draft,
        areaMappings,
      });

      if (result.success) {
        router.push('/onboarding/keys/review');
      }
    });
  };

  const handleBack = () => {
    router.push('/onboarding/keys/step-5');
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
        <h2 className="text-2xl font-bold">Map Keys to Areas</h2>
        <p className="text-muted-foreground mt-2">
          Select which access areas each key provides access to.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {allLabels.map((label) => {
          const selectedCount = areaMappings[label]?.length || 0;
          return (
            <AccordionItem key={label} value={label}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <span className="font-medium">{label}</span>
                  <span className="text-sm text-muted-foreground">
                    {selectedCount} of {accessAreas.length} areas
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectAll(label)}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleClearAll(label)}
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {accessAreas.map((area) => (
                      <div key={area} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${label}-${area}`}
                          checked={areaMappings[label]?.includes(area)}
                          onCheckedChange={() => handleToggleArea(label, area)}
                        />
                        <Label
                          htmlFor={`${label}-${area}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {area}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <div className="bg-muted p-4 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Tip:</strong> You can change these mappings later if needed.
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
          {isPending ? 'Saving...' : 'Review'}
          <IconArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

