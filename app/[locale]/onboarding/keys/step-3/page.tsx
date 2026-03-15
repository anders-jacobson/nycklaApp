'use client';

import { useEffect, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRouter } from '@/i18n/navigation';
import { getOnboardingSession, updateOnboardingDraft } from '@/app/actions/onboarding';
import {
  IconArrowLeft,
  IconArrowRight,
  IconPlus,
  IconX,
  IconInfoCircle,
  IconBulb,
  IconChevronDown,
  IconCheck,
  IconHelpCircle,
} from '@tabler/icons-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ALPHABET,
  ALPHABET_NO_IO,
  validateLabel,
  generateSeriesPreview,
  generateSeries,
  DEFAULT_ACCESS_AREAS,
} from '@/lib/label-generators';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function Step3Page() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const [letterLabels, setLetterLabels] = useState<string[]>([]);
  const [showAllLetters, setShowAllLetters] = useState(false);
  const [seriesPrefix, setSeriesPrefix] = useState('Z');
  const [seriesFrom, setSeriesFrom] = useState('');
  const [seriesTo, setSeriesTo] = useState('');
  const [apartmentPresetsOpen, setApartmentPresetsOpen] = useState(false);
  const [customPresetsOpen, setCustomPresetsOpen] = useState(false);

  // Conventional meanings for specific letters in Swedish housing cooperatives
  const LETTER_HINTS: Record<string, string> = {
    Z: t('step3LetterHintZ'),
    P: t('step3LetterHintP'),
    B: t('step3LetterHintB'),
    G: t('step3LetterHintG'),
    T: t('step3LetterHintT'),
    F: t('step3LetterHintF'),
  };

  // Apartment key presets
  const apartmentPresets = [
    { label: 'Z1-14 (14 apartments)', prefix: 'Z', from: 1, to: 14 },
    { label: 'Z1-20 (20 apartments)', prefix: 'Z', from: 1, to: 20 },
    { label: 'Z1-30 (30 apartments)', prefix: 'Z', from: 1, to: 30 },
    { label: '101-120 (20 apartments)', prefix: '', from: 101, to: 120 },
    { label: 'L1-15 (15 apartments)', prefix: 'L', from: 1, to: 15 },
  ];
  const [customLabels, setCustomLabels] = useState<string[]>([]);
  const [newCustomLabel, setNewCustomLabel] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const availableLetters = showAllLetters ? ALPHABET : ALPHABET_NO_IO;

  useEffect(() => {
    // Load existing draft
    getOnboardingSession().then((result) => {
      if (result.success && result.data) {
        const draft = result.data.draft;
        if (draft.letterLabels) setLetterLabels(draft.letterLabels);
        if (draft.seriesPreset) {
          setSeriesPrefix(draft.seriesPreset.prefix);
          setSeriesFrom(draft.seriesPreset.from.toString());
          setSeriesTo(draft.seriesPreset.to.toString());
        }
        if (draft.customLabels) setCustomLabels(draft.customLabels);
      }
      setIsLoading(false);
    });
  }, []);

  const handleToggleLetter = (letter: string) => {
    setLetterLabels((prev) =>
      prev.includes(letter) ? prev.filter((l) => l !== letter) : [...prev, letter],
    );
  };

  // Auto-deselect any letter that matches the series prefix (conflict prevention)
  useEffect(() => {
    const prefixUpper = seriesPrefix.trim().toUpperCase();
    // Only deselect if prefix is a single letter
    if (prefixUpper.length === 1 && letterLabels.includes(prefixUpper)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLetterLabels(letterLabels.filter((l) => l !== prefixUpper));
    }
  }, [seriesPrefix, letterLabels]);

  // Auto-deselect any common letter that's added as a custom label (bidirectional conflict prevention)
  useEffect(() => {
    const conflictingLetters = letterLabels.filter((letter) => customLabels.includes(letter));
    if (conflictingLetters.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLetterLabels(letterLabels.filter((l) => !customLabels.includes(l)));
    }
  }, [customLabels, letterLabels]);

  const handleAddCustomLabel = () => {
    const trimmed = newCustomLabel.trim();
    if (!trimmed) return;

    if (!validateLabel(trimmed)) {
      setError(t('step3ErrorLabelLength'));
      return;
    }

    // Generate series labels if configured
    let seriesLabels: string[] = [];
    if (seriesFrom && seriesTo) {
      const from = parseInt(seriesFrom);
      const to = parseInt(seriesTo);
      if (!isNaN(from) && !isNaN(to) && from <= to && from >= 1 && to <= 9999) {
        seriesLabels = generateSeries(seriesPrefix.trim(), from, to);
      }
    }

    // Check against all existing labels
    const allLabels = [...letterLabels, ...seriesLabels, ...customLabels];
    if (allLabels.includes(trimmed)) {
      if (letterLabels.includes(trimmed)) {
        setError(t('step3ErrorExistsCommon', { label: trimmed }));
      } else if (seriesLabels.includes(trimmed)) {
        setError(t('step3ErrorExistsApartment', { label: trimmed }));
      } else {
        setError(t('step3ErrorExistsCustom', { label: trimmed }));
      }
      return;
    }

    setCustomLabels([...customLabels, trimmed]);
    setNewCustomLabel('');
    setError('');
  };

  const handleRemoveCustomLabel = (index: number) => {
    setCustomLabels(customLabels.filter((_, i) => i !== index));
  };

  const getTotalLabels = () => {
    let count = letterLabels.length + customLabels.length;
    if (seriesFrom && seriesTo) {
      const from = parseInt(seriesFrom);
      const to = parseInt(seriesTo);
      if (!isNaN(from) && !isNaN(to) && from <= to && from >= 1 && to <= 9999) {
        count += to - from + 1;
      }
    }
    return count;
  };

  const getSeriesSummary = () => {
    if (!seriesFrom || !seriesTo) return t('step3OptionalNumbered');
    const from = parseInt(seriesFrom);
    const to = parseInt(seriesTo);
    if (isNaN(from) || isNaN(to) || from > to) return t('step3OptionalNumbered');
    const prefix = seriesPrefix.trim();
    const count = to - from + 1;
    return `${prefix}${from}–${prefix}${to} · ${count}`;
  };

  const handleNext = () => {
    const totalLabels = getTotalLabels();
    if (totalLabels === 0) {
      setError(t('step3ErrorMinOne'));
      return;
    }

    // Validate series if provided (both fields must be filled to use series)
    let seriesPreset = undefined;
    let seriesLabels: string[] = [];
    if (seriesFrom && seriesTo) {
      const from = parseInt(seriesFrom);
      const to = parseInt(seriesTo);
      if (isNaN(from) || isNaN(to) || from > to || from < 1 || to > 9999) {
        setError(t('step3ErrorInvalidRange'));
        return;
      }
      seriesPreset = { prefix: seriesPrefix.trim(), from, to };
      seriesLabels = generateSeries(seriesPrefix.trim(), from, to);
    } else if (seriesFrom || seriesTo) {
      // One field is filled but not the other
      setError(t('step3ErrorFillBothFields'));
      return;
    }

    // Check for duplicate labels across all three sources
    const allLabels: string[] = [...letterLabels, ...seriesLabels, ...customLabels];

    const duplicates = allLabels.filter((label, index, arr) => arr.indexOf(label) !== index);

    if (duplicates.length > 0) {
      const uniqueDuplicates = Array.from(new Set(duplicates));
      setError(t('step3ErrorDuplicates', { labels: uniqueDuplicates.join(', ') }));
      return;
    }

    startTransition(async () => {
      const session = await getOnboardingSession();
      if (!session.success || !session.data) return;

      const result = await updateOnboardingDraft(3, {
        ...session.data.draft,
        letterLabels,
        seriesPreset,
        customLabels,
      });

      if (result.success) {
        router.push('/onboarding/keys/step-4');
      }
    });
  };

  const handleBack = () => {
    router.push('/onboarding/keys/step-2');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t('step3Heading')}</h2>
        <p className="text-muted-foreground mt-2">{t('step3Description')}</p>
      </div>

      <TooltipProvider delayDuration={300}>
        <Accordion type="multiple" className="space-y-2">
          {/* ── Common Keys ── */}
          <AccordionItem value="common" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center justify-between w-full pr-2">
                <span className="font-medium">{t('step3CommonKeys')}</span>
                <span className="text-sm text-muted-foreground">
                  {letterLabels.length > 0
                    ? t('step3SeriesSelectedSummary', { count: letterLabels.length })
                    : t('step3LettersForShared')}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{t('step3CommonLettersDesc')}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllLetters(!showAllLetters)}
                >
                  {showAllLetters ? t('step3HideLetters') : t('step3ShowAllLetters')}
                </Button>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 gap-2">
                {availableLetters.map((letter) => {
                  const prefixUpper = seriesPrefix.trim().toUpperCase();
                  const isDisabledByPrefix = prefixUpper.length === 1 && letter === prefixUpper;
                  const isDisabledByCustom = customLabels.includes(letter);
                  const isDisabled = isDisabledByPrefix || isDisabledByCustom;
                  const hint = LETTER_HINTS[letter];

                  const disabledTitle = isDisabledByPrefix
                    ? t('step3LetterUsedAsPrefix', { letter })
                    : isDisabledByCustom
                      ? t('step3LetterInCustom', { letter })
                      : undefined;

                  const btn = (
                    <Button
                      key={letter}
                      variant={letterLabels.includes(letter) ? 'default' : 'outline'}
                      onClick={() => !isDisabled && handleToggleLetter(letter)}
                      disabled={isDisabled}
                      className="h-11 font-medium w-full"
                      title={disabledTitle}
                    >
                      {letter}
                    </Button>
                  );

                  if (hint && !isDisabled) {
                    return (
                      <Tooltip key={letter}>
                        <TooltipTrigger asChild>{btn}</TooltipTrigger>
                        <TooltipContent side="top" className="max-w-48 text-center">
                          {hint}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return <span key={letter}>{btn}</span>;
                })}
              </div>

              {(seriesPrefix.trim().length === 1 &&
                availableLetters.includes(seriesPrefix.trim().toUpperCase())) ||
              customLabels.some((label) => availableLetters.includes(label)) ? (
                <div className="flex flex-col gap-1">
                  {seriesPrefix.trim().length === 1 &&
                    availableLetters.includes(seriesPrefix.trim().toUpperCase()) && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <IconBulb className="h-3.5 w-3.5 shrink-0" />
                        {t('step3LetterUsedAsPrefix', { letter: seriesPrefix.toUpperCase() })}
                      </p>
                    )}
                  {customLabels.some((label) => availableLetters.includes(label)) && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <IconBulb className="h-3.5 w-3.5 shrink-0" />
                      {t('step3LetterInCustom', {
                        letter: customLabels
                          .filter((label) => availableLetters.includes(label))
                          .join(', '),
                      })}
                    </p>
                  )}
                </div>
              ) : null}
            </AccordionContent>
          </AccordionItem>

          {/* ── Apartment Keys ── */}
          <AccordionItem value="apartment" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center justify-between w-full pr-2">
                <span className="font-medium">{t('step3ApartmentKeys')}</span>
                <span className="text-sm text-muted-foreground">{getSeriesSummary()}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-3">
              <p className="text-sm text-muted-foreground">{t('step3ApartmentDesc')}</p>

              {/* Quick Presets */}
              <Collapsible open={apartmentPresetsOpen} onOpenChange={setApartmentPresetsOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between" type="button">
                    <span className="text-sm">{t('step3QuickPresets')}</span>
                    <IconChevronDown
                      className={`h-4 w-4 transition-transform ${
                        apartmentPresetsOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-2 rounded-lg border p-3 bg-muted/30">
                  {apartmentPresets.map((preset, index) => (
                    <Button
                      key={index}
                      variant="secondary"
                      className="w-full justify-start text-sm"
                      type="button"
                      onClick={() => {
                        setSeriesPrefix(preset.prefix);
                        setSeriesFrom(preset.from.toString());
                        setSeriesTo(preset.to.toString());
                        setApartmentPresetsOpen(false);
                      }}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              <div className="flex items-center gap-3">
                <div className="w-24 flex-shrink-0">
                  <div className="flex items-center gap-1 mb-1">
                    <Label htmlFor="prefix" className="text-sm">
                      Prefix
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <IconHelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-52">
                        {t('step3PrefixTooltip')}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="prefix"
                    type="text"
                    value={seriesPrefix}
                    onChange={(e) => setSeriesPrefix(e.target.value)}
                    placeholder="e.g., Z"
                    maxLength={10}
                    className="h-11 placeholder:text-muted-foreground/50 placeholder:italic"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="from" className="text-sm">
                    From
                  </Label>
                  <Input
                    id="from"
                    type="number"
                    value={seriesFrom}
                    onChange={(e) => setSeriesFrom(e.target.value)}
                    placeholder=""
                    min="1"
                    max="9999"
                    className="h-11 mt-1"
                  />
                </div>
                <span className="text-muted-foreground mt-6 px-1">to</span>
                <div className="flex-1">
                  <Label htmlFor="to" className="text-sm">
                    To
                  </Label>
                  <Input
                    id="to"
                    type="number"
                    value={seriesTo}
                    onChange={(e) => setSeriesTo(e.target.value)}
                    placeholder=""
                    min="1"
                    max="9999"
                    className="h-11 mt-1"
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <IconBulb className="h-3.5 w-3.5 shrink-0" />
                {t('step3SeriesHint')}
              </p>

              {seriesFrom && seriesTo && (
                <div className="bg-muted/50 p-3 rounded-md">
                  <div className="flex items-start gap-2">
                    <IconInfoCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium mb-1">{t('step3Preview')}</p>
                      <p className="text-muted-foreground">
                        {generateSeriesPreview(
                          seriesPrefix,
                          parseInt(seriesFrom),
                          parseInt(seriesTo),
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* ── Custom Labels ── */}
          <AccordionItem value="custom" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center justify-between w-full pr-2">
                <span className="font-medium">{t('step3CustomLabels')}</span>
                <span className="text-sm text-muted-foreground">
                  {customLabels.length > 0
                    ? t('step3SeriesSelectedSummary', { count: customLabels.length })
                    : t('step3OptionalAnything')}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-3">
              {/* Common Area presets */}
              <Collapsible open={customPresetsOpen} onOpenChange={setCustomPresetsOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between" type="button">
                    <span className="text-sm">{t('step3CommonAreaKeysButton')}</span>
                    <IconChevronDown
                      className={`h-4 w-4 transition-transform ${
                        customPresetsOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 grid grid-cols-2 gap-2 rounded-lg border p-3 bg-muted/30">
                  {DEFAULT_ACCESS_AREAS.map((area) => {
                    const isAdded = customLabels.includes(area) || letterLabels.includes(area);
                    return (
                      <Button
                        key={area}
                        variant={isAdded ? 'secondary' : 'outline'}
                        className="text-sm"
                        type="button"
                        disabled={isAdded}
                        onClick={() => {
                          if (!isAdded) {
                            setCustomLabels([...customLabels, area]);
                            setError('');
                          }
                        }}
                      >
                        {isAdded && <IconCheck className="mr-1 h-3 w-3" />}
                        {area}
                      </Button>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>

              <div className="flex gap-2">
                <Input
                  type="text"
                  value={newCustomLabel}
                  onChange={(e) => {
                    setNewCustomLabel(e.target.value);
                    setError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomLabel();
                    }
                  }}
                  placeholder={t('step3CustomPlaceholder')}
                  className="h-11"
                  maxLength={50}
                />
                <Button onClick={handleAddCustomLabel} size="lg">
                  <IconPlus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </TooltipProvider>

      {/* Total count + badge summary */}
      <div className="bg-muted p-4 rounded-lg space-y-3">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium">{t('step3KeyTypesToCreate')}</p>
          <span className="text-lg font-bold">{getTotalLabels()}</span>
        </div>

        {getTotalLabels() > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {/* Letter key badges — click to deselect */}
            {letterLabels.map((letter) => (
              <Badge
                key={letter}
                variant="secondary"
                className="cursor-pointer gap-1 pr-1 hover:bg-destructive/10"
                onClick={() => handleToggleLetter(letter)}
              >
                {letter}
                <IconX className="h-2.5 w-2.5" />
              </Badge>
            ))}

            {/* Apartment series — single summary badge */}
            {seriesFrom &&
              seriesTo &&
              (() => {
                const from = parseInt(seriesFrom);
                const to = parseInt(seriesTo);
                if (isNaN(from) || isNaN(to) || from > to) return null;
                const prefix = seriesPrefix.trim();
                const count = to - from + 1;
                return (
                  <Badge key="series" variant="secondary">
                    {prefix}
                    {from}–{prefix}
                    {to} · {count}
                  </Badge>
                );
              })()}

            {/* Custom label badges — click × to remove */}
            {customLabels.map((label, index) => (
              <Badge key={index} variant="secondary" className="gap-1 pr-1">
                {label}
                <button
                  onClick={() => handleRemoveCustomLabel(index)}
                  className="hover:text-destructive"
                  aria-label={`Remove ${label}`}
                >
                  <IconX className="h-2.5 w-2.5" />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{t('step3NoKeysSelected')}</p>
        )}

        <p className="text-xs text-muted-foreground">{t('step3NextStepHint')}</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 pt-4">
        <Button onClick={handleBack} variant="outline" className="min-w-32" size="lg">
          <IconArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          {t('back')}
        </Button>
        <Button
          onClick={handleNext}
          disabled={getTotalLabels() === 0 || isPending}
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
