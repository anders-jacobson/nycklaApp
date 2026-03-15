'use client';

import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { getOnboardingSession, createOnboardingKeys } from '@/app/actions/onboarding';
import { IconArrowLeft, IconCheck, IconKey } from '@tabler/icons-react';
import { generateSeries } from '@/lib/label-generators';

export default function ReviewPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<any>(null);
  const [currentOrgName, setCurrentOrgName] = useState('');
  const [allLabels, setAllLabels] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load draft for review
    getOnboardingSession().then((result) => {
      if (result.success && result.data) {
        setDraft(result.data.draft);
        setCurrentOrgName(result.data.currentOrgName);

        // Collect all labels
        const labels: string[] = [
          ...(result.data.draft.letterLabels || []),
          ...(result.data.draft.seriesPreset
            ? generateSeries(
                result.data.draft.seriesPreset.prefix,
                result.data.draft.seriesPreset.from,
                result.data.draft.seriesPreset.to,
              )
            : []),
          ...(result.data.draft.customLabels || []),
        ];
        setAllLabels(labels);
      }
      setIsLoading(false);
    });
  }, []);

  const handleCreateKeys = () => {
    startTransition(async () => {
      const result = await createOnboardingKeys();
      if (result.success) {
        router.push('/onboarding/keys/done');
      } else {
        setError(result.error);
      }
    });
  };

  const handleBack = () => {
    router.push('/onboarding/keys/step-4');
  };

  const getTotalCopies = () => {
    if (!draft?.copiesMap) return 0;
    return Object.values(draft.copiesMap as Record<string, number>).reduce(
      (sum, count) => sum + count,
      0,
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-64" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-destructive">No draft data found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Review & Create</h2>
        <p className="text-muted-foreground mt-2">Review your setup before creating the keys.</p>
      </div>

      <div className="space-y-4">
        {/* Organization */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{draft.orgName || currentOrgName || 'Not set'}</p>
          </CardContent>
        </Card>

        {/* Access Areas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Access Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {draft.accessAreas?.map((area: string) => (
                <Badge key={area} variant="secondary">
                  {area}
                </Badge>
              )) || <p className="text-muted-foreground">None</p>}
            </div>
          </CardContent>
        </Card>

        {/* Keys Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Keys Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Key Types</p>
                <p className="text-2xl font-bold">{allLabels.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Copies</p>
                <p className="text-2xl font-bold">{getTotalCopies()}</p>
              </div>
            </div>

            {/* Letter Labels */}
            {draft.letterLabels && draft.letterLabels.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Letter Keys</p>
                <div className="flex flex-wrap gap-1">
                  {draft.letterLabels.map((label: string) => (
                    <Badge key={label} variant="outline" className="font-mono">
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Series Keys */}
            {draft.seriesPreset && (
              <div>
                <p className="text-sm font-medium mb-2">Apartment Keys (Series)</p>
                <p className="text-sm">
                  {draft.seriesPreset.prefix || ''}
                  {draft.seriesPreset.from} through {draft.seriesPreset.prefix || ''}
                  {draft.seriesPreset.to}
                  {!draft.seriesPreset.prefix && ' (pure numbers)'}
                </p>
              </div>
            )}

            {/* Custom Labels */}
            {draft.customLabels && draft.customLabels.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Custom Keys</p>
                <div className="flex flex-wrap gap-1">
                  {draft.customLabels.map((label: string) => (
                    <Badge key={label} variant="outline">
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Per-key breakdown */}
            {allLabels.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <IconKey className="h-3.5 w-3.5" />
                  Keys to create
                </p>
                <div
                  className={`space-y-1 ${allLabels.length > 10 ? 'max-h-56 overflow-y-auto pr-1' : ''}`}
                >
                  {allLabels.map((label) => {
                    const copies = draft.copiesMap?.[label] ?? 1;
                    return (
                      <div
                        key={label}
                        className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-muted/50"
                      >
                        <span className="font-mono font-medium">{label}</span>
                        <span className="text-muted-foreground">
                          {copies} {copies === 1 ? 'copy' : 'copies'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3 pt-4">
        <Button onClick={handleBack} variant="outline" className="min-w-32" size="lg">
          <IconArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back
        </Button>
        <Button
          onClick={handleCreateKeys}
          disabled={isPending}
          className="ml-auto min-w-32"
          size="lg"
        >
          {isPending ? 'Creating...' : 'Create Keys'}
          <IconCheck className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
