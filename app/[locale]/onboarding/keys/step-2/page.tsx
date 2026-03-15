'use client';

import { useEffect, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from '@/i18n/navigation';
import { getOnboardingSession, updateOnboardingDraft } from '@/app/actions/onboarding';
import { IconArrowLeft, IconArrowRight, IconPlus, IconX } from '@tabler/icons-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DEFAULT_ACCESS_AREAS } from '@/lib/label-generators';

export default function Step2Page() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const [areas, setAreas] = useState<string[]>([...DEFAULT_ACCESS_AREAS]);
  const [newArea, setNewArea] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load existing draft
    getOnboardingSession().then((result) => {
      if (result.success && result.data) {
        const existingAreas = result.data.draft.accessAreas;
        if (existingAreas && existingAreas.length > 0) {
          setAreas(existingAreas);
        }
      }
      setIsLoading(false);
    });
  }, []);

  const handleAddArea = () => {
    const trimmed = newArea.trim();
    if (!trimmed) return;

    if (areas.includes(trimmed)) {
      setError(t('step2ErrorExists'));
      return;
    }

    if (trimmed.length > 100) {
      setError(t('step2ErrorTooLong'));
      return;
    }

    setAreas([...areas, trimmed]);
    setNewArea('');
    setError('');
  };

  const handleRemoveArea = (index: number) => {
    setAreas(areas.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (areas.length === 0) {
      setError(t('step2ErrorMinOne'));
      return;
    }

    startTransition(async () => {
      const session = await getOnboardingSession();
      if (!session.success || !session.data) return;

      const result = await updateOnboardingDraft(2, {
        ...session.data.draft,
        accessAreas: areas,
      });

      if (result.success) {
        router.push('/onboarding/keys/step-3');
      }
    });
  };

  const handleBack = () => {
    router.push('/onboarding/keys/step-1');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t('step2Heading')}</h2>
        <p className="text-muted-foreground mt-2">{t('step2Description')}</p>
      </div>

      <div className="space-y-4">
        {/* Current areas */}
        <div>
          <Label className="text-base">{t('step2AreasLabel', { count: areas.length })}</Label>
          <div className="mt-2 space-y-2">
            {areas.map((area, index) => (
              <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-card">
                <span className="flex-1">{area}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveArea(index)}
                  className="h-8 w-8 p-0"
                >
                  <IconX className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Add new area */}
        <div>
          <Label htmlFor="newArea" className="text-base">
            {t('step2AddLabel')}
          </Label>
          <div className="flex gap-2 mt-2">
            <Input
              id="newArea"
              type="text"
              value={newArea}
              onChange={(e) => {
                setNewArea(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddArea();
                }
              }}
              placeholder={t('step2Placeholder')}
              className="h-11"
              maxLength={100}
            />
            <Button onClick={handleAddArea} size="lg">
              <IconPlus className="h-3.5 w-3.5" />
            </Button>
          </div>
          {error && <p className="text-sm text-destructive mt-1">{error}</p>}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button onClick={handleBack} variant="outline" className="min-w-32" size="lg">
          <IconArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          {t('back')}
        </Button>
        <Button
          onClick={handleNext}
          disabled={areas.length === 0 || isPending}
          className="ml-auto min-w-32"
          size="lg"
        >
          {isPending ? t('saving') : t('next')}
          <IconArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
