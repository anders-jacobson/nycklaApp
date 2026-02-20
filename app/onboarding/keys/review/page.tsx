'use client';

import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { getOnboardingSession, createOnboardingKeys } from '@/app/actions/onboarding';
import { IconArrowLeft, IconCheck } from '@tabler/icons-react';
import { generateSeries } from '@/lib/label-generators';

export default function ReviewPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<any>(null);
  const [allLabels, setAllLabels] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load draft for review
    getOnboardingSession().then((result) => {
      if (result.success && result.data) {
        setDraft(result.data.draft);

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
    router.push('/onboarding/keys/step-6');
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
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading...</p>
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
        <p className="text-muted-foreground mt-2">
          Review your setup before creating the keys.
        </p>
      </div>

      <div className="space-y-4">
        {/* Organization */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{draft.orgName || 'Not set'}</p>
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
          </CardContent>
        </Card>

        {/* Sample Area Mappings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sample Area Mappings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {allLabels.slice(0, 3).map((label) => {
                const areas = draft.areaMappings?.[label] || [];
                return (
                  <div key={label} className="flex items-start gap-2">
                    <span className="font-medium min-w-12">{label}:</span>
                    <span className="text-muted-foreground">
                      {areas.length > 0 ? areas.join(', ') : 'No areas mapped'}
                    </span>
                  </div>
                );
              })}
              {allLabels.length > 3 && (
                <p className="text-muted-foreground text-xs">
                  ... and {allLabels.length - 3} more
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive p-4 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button onClick={handleBack} variant="outline" className="h-11 min-w-32" size="lg">
          <IconArrowLeft className="mr-2 h-5 w-5" />
          Back
        </Button>
        <Button
          onClick={handleCreateKeys}
          disabled={isPending}
          className="ml-auto h-11 min-w-32"
          size="lg"
        >
          {isPending ? 'Creating...' : 'Create Keys'}
          <IconCheck className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

