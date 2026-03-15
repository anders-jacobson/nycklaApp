'use client';

import { useEffect, useState, useTransition } from 'react';
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

// Conventional meanings for specific letters in Swedish housing cooperatives
const LETTER_HINTS: Record<string, string> = {
  Z: 'Default prefix for apartment keys (Z1, Z2…)',
  P: 'Common for parking / garage',
  B: 'Common for basement',
  G: 'Common for garage',
  T: 'Common for trash room / terrace',
  F: 'Common for laundry room',
};

export default function Step3Page() {
  const router = useRouter();
  const [letterLabels, setLetterLabels] = useState<string[]>([]);
  const [showAllLetters, setShowAllLetters] = useState(false);
  const [seriesPrefix, setSeriesPrefix] = useState('Z');
  const [seriesFrom, setSeriesFrom] = useState('');
  const [seriesTo, setSeriesTo] = useState('');
  const [apartmentPresetsOpen, setApartmentPresetsOpen] = useState(false);
  const [customPresetsOpen, setCustomPresetsOpen] = useState(false);

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
      setError('Label must be 1-50 characters');
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
        setError(`"${trimmed}" already exists in Common Keys`);
      } else if (seriesLabels.includes(trimmed)) {
        setError(`"${trimmed}" already exists in Apartment Keys series`);
      } else {
        setError(`"${trimmed}" already exists in Custom Labels`);
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
    if (!seriesFrom || !seriesTo) return 'Not configured';
    const from = parseInt(seriesFrom);
    const to = parseInt(seriesTo);
    if (isNaN(from) || isNaN(to) || from > to) return 'Invalid range';
    const prefix = seriesPrefix.trim();
    const count = to - from + 1;
    return `${prefix}${from}–${prefix}${to} · ${count} key${count !== 1 ? 's' : ''}`;
  };

  const handleNext = () => {
    const totalLabels = getTotalLabels();
    if (totalLabels === 0) {
      setError('Please select at least one key label');
      return;
    }

    // Validate series if provided (both fields must be filled to use series)
    let seriesPreset = undefined;
    let seriesLabels: string[] = [];
    if (seriesFrom && seriesTo) {
      const from = parseInt(seriesFrom);
      const to = parseInt(seriesTo);
      if (isNaN(from) || isNaN(to) || from > to || from < 1 || to > 9999) {
        setError('Invalid series range (must be 1-9999, from ≤ to)');
        return;
      }
      seriesPreset = { prefix: seriesPrefix.trim(), from, to };
      seriesLabels = generateSeries(seriesPrefix.trim(), from, to);
    } else if (seriesFrom || seriesTo) {
      // One field is filled but not the other
      setError(
        'Please fill both "from" and "to" fields for apartment keys, or leave both empty to skip',
      );
      return;
    }

    // Check for duplicate labels across all three sources
    const allLabels: string[] = [...letterLabels, ...seriesLabels, ...customLabels];

    const duplicates = allLabels.filter((label, index, arr) => arr.indexOf(label) !== index);

    if (duplicates.length > 0) {
      const uniqueDuplicates = Array.from(new Set(duplicates));
      setError(
        `Duplicate labels found: ${uniqueDuplicates.join(', ')}. Each key label must be unique.`,
      );
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
        <h2 className="text-2xl font-bold">Key Labels</h2>
        <p className="text-muted-foreground mt-2">
          Choose labels for your keys. Expand the sections you need.
        </p>
      </div>

      <TooltipProvider delayDuration={300}>
        <Accordion type="multiple" className="space-y-2">
          {/* ── Common Keys ── */}
          <AccordionItem value="common" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center justify-between w-full pr-2">
                <span className="font-medium">Common Keys</span>
                <span className="text-sm text-muted-foreground">
                  {letterLabels.length > 0
                    ? `${letterLabels.length} selected`
                    : 'Letters for shared areas'}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Pick letters that label your common-area keys.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllLetters(!showAllLetters)}
                >
                  {showAllLetters ? 'Hide I & O' : 'Show all letters'}
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
                    ? `${letter} is used as apartment keys prefix`
                    : isDisabledByCustom
                      ? `${letter} is already in custom labels`
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
                        Letter {seriesPrefix.toUpperCase()} is reserved for apartment keys — change
                        the prefix under{' '}
                        <span className="font-medium text-foreground">Apartment Keys</span> if you
                        want to use it here.
                      </p>
                    )}
                  {customLabels.some((label) => availableLetters.includes(label)) && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <IconBulb className="h-3.5 w-3.5 shrink-0" />
                      {customLabels
                        .filter((label) => availableLetters.includes(label))
                        .join(', ')}{' '}
                      disabled (used in custom labels)
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
                <span className="font-medium">Apartment Keys</span>
                <span className="text-sm text-muted-foreground">
                  {seriesFrom && seriesTo ? getSeriesSummary() : 'Optional — numbered series'}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Most cooperatives use Z1–Z14 format, but you can customize the prefix or use pure
                numbers.
              </p>

              {/* Quick Presets */}
              <Collapsible open={apartmentPresetsOpen} onOpenChange={setApartmentPresetsOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between" type="button">
                    <span className="text-sm">Quick Presets</span>
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
                        Z is the most common prefix in Swedish housing cooperatives. You can change
                        it to any letter, or leave it empty for plain numbers (101, 102…).
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
                Example: Prefix &quot;Z&quot;, From 1, To 14 → creates Z1, Z2, ... Z14 (14 keys)
              </p>

              {seriesFrom && seriesTo && (
                <div className="bg-muted/50 p-3 rounded-md">
                  <div className="flex items-start gap-2">
                    <IconInfoCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium mb-1">Preview:</p>
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
                <span className="font-medium">Custom Labels</span>
                <span className="text-sm text-muted-foreground">
                  {customLabels.length > 0
                    ? `${customLabels.length} label${customLabels.length !== 1 ? 's' : ''}`
                    : 'Optional — anything else'}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-3">
              {/* Common Area presets */}
              <Collapsible open={customPresetsOpen} onOpenChange={setCustomPresetsOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between" type="button">
                    <span className="text-sm">Common Area Keys</span>
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
                  placeholder="e.g., Office, Storage-1"
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
          <p className="text-sm font-medium">Key types to create</p>
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
          <p className="text-xs text-muted-foreground">No keys selected yet</p>
        )}

        <p className="text-xs text-muted-foreground">
          You&apos;ll specify the number of copies for each type in the next step
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 pt-4">
        <Button onClick={handleBack} variant="outline" className="min-w-32" size="lg">
          <IconArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={getTotalLabels() === 0 || isPending}
          className="ml-auto min-w-32"
          size="lg"
        >
          {isPending ? 'Saving...' : 'Next'}
          <IconArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
