'use client';

import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { getOnboardingSession, updateOnboardingDraft } from '@/app/actions/onboarding';
import {
  IconArrowLeft,
  IconArrowRight,
  IconPlus,
  IconX,
  IconInfoCircle,
  IconChevronDown,
  IconCheck,
} from '@tabler/icons-react';
import { ALPHABET, ALPHABET_NO_IO, validateLabel, generateSeriesPreview, generateSeries, DEFAULT_ACCESS_AREAS } from '@/lib/label-generators';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

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
      setLetterLabels(letterLabels.filter((l) => l !== prefixUpper));
    }
  }, [seriesPrefix, letterLabels]);

  // Auto-deselect any common letter that's added as a custom label (bidirectional conflict prevention)
  useEffect(() => {
    const conflictingLetters = letterLabels.filter((letter) => customLabels.includes(letter));
    if (conflictingLetters.length > 0) {
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
      // Determine which section has the conflict for a more helpful error message
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
      if (
        isNaN(from) ||
        isNaN(to) ||
        from > to ||
        from < 1 ||
        to > 9999
      ) {
        setError('Invalid series range (must be 1-9999, from ≤ to)');
        return;
      }
      seriesPreset = { prefix: seriesPrefix.trim(), from, to };
      seriesLabels = generateSeries(seriesPrefix.trim(), from, to);
    } else if (seriesFrom || seriesTo) {
      // One field is filled but not the other
      setError('Please fill both "from" and "to" fields for apartment keys, or leave both empty to skip');
      return;
    }

    // Check for duplicate labels across all three sources
    const allLabels: string[] = [
      ...letterLabels,
      ...seriesLabels,
      ...customLabels,
    ];

    const duplicates = allLabels.filter((label, index, arr) => arr.indexOf(label) !== index);
    
    if (duplicates.length > 0) {
      const uniqueDuplicates = Array.from(new Set(duplicates));
      setError(`Duplicate labels found: ${uniqueDuplicates.join(', ')}. Each key label must be unique.`);
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
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Key Labels</h2>
        <p className="text-muted-foreground mt-2">
          Choose labels for your keys. Select common area keys (letters), apartment keys (series),
          or create custom labels.
        </p>
      </div>

      <div className="space-y-6">
        {/* Letter Labels */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Common Keys (Letters)</Label>
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
              
              let title = undefined;
              if (isDisabledByPrefix) {
                title = `${letter} is used in apartment keys series`;
              } else if (isDisabledByCustom) {
                title = `${letter} is already used in custom labels`;
              }
              
              return (
                <button
                  key={letter}
                  onClick={() => !isDisabled && handleToggleLetter(letter)}
                  disabled={isDisabled}
                  className={`h-11 rounded-md border-2 font-medium transition-colors ${
                    letterLabels.includes(letter)
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isDisabled
                        ? 'border-border bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                        : 'border-border hover:border-primary/50'
                  }`}
                  title={title}
                >
                  {letter}
                </button>
              );
            })}
          </div>
          {(seriesPrefix.trim().length === 1 && availableLetters.includes(seriesPrefix.trim().toUpperCase())) ||
           customLabels.some(label => availableLetters.includes(label)) ? (
            <p className="text-xs text-muted-foreground">
              {seriesPrefix.trim().length === 1 && availableLetters.includes(seriesPrefix.trim().toUpperCase()) && (
                <>💡 Letter {seriesPrefix.toUpperCase()} is disabled (used as apartment keys prefix)</>
              )}
              {seriesPrefix.trim().length === 1 && availableLetters.includes(seriesPrefix.trim().toUpperCase()) && 
               customLabels.some(label => availableLetters.includes(label)) && (
                <br />
              )}
              {customLabels.some(label => availableLetters.includes(label)) && (
                <>💡 {customLabels.filter(label => availableLetters.includes(label)).join(', ')} disabled (used in custom labels)</>
              )}
            </p>
          ) : null}
          {letterLabels.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {letterLabels.map((letter) => (
                <Badge key={letter} variant="secondary">
                  {letter}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Apartment Keys (Series Generator) */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Apartment Keys (Optional)</Label>
          <p className="text-sm text-muted-foreground">
            Most cooperatives use Z1–Z14 format, but you can customize the prefix or use pure numbers.
          </p>
          
          <div className="space-y-3">
            {/* Collapsible Quick Presets */}
            <Collapsible open={apartmentPresetsOpen} onOpenChange={setApartmentPresetsOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  type="button"
                >
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
                <Label htmlFor="prefix" className="text-sm">Prefix</Label>
                <Input
                  id="prefix"
                  type="text"
                  value={seriesPrefix}
                  onChange={(e) => setSeriesPrefix(e.target.value)}
                  placeholder="e.g., Z"
                  maxLength={10}
                  className="h-11 mt-1 placeholder:text-muted-foreground/50 placeholder:italic"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="from" className="text-sm">From</Label>
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
                <Label htmlFor="to" className="text-sm">To</Label>
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
            <p className="text-xs text-muted-foreground">
              💡 Example: Prefix "Z", From 1, To 14 → creates Z1, Z2, ... Z14 (14 keys)
            </p>
          </div>
          
          {seriesFrom && seriesTo && (
            <div className="bg-muted/50 p-3 rounded-md">
              <div className="flex items-start gap-2">
                <IconInfoCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Preview:</p>
                  <p className="text-muted-foreground">
                    {generateSeriesPreview(seriesPrefix, parseInt(seriesFrom), parseInt(seriesTo))}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md border border-blue-200 dark:border-blue-900">
            <p className="text-xs text-blue-900 dark:text-blue-100 font-medium mb-1">Examples:</p>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Z + numbers → Z1, Z2, Z3 (most common)</li>
              <li>• Pure numbers → 101, 102, 103 (apartment numbers)</li>
              <li>• L + numbers → L1, L2, L3 (alternative letter)</li>
              <li>• Multiple buildings? Use custom labels for additional series</li>
            </ul>
          </div>
        </div>

        {/* Custom Labels */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Custom Labels</Label>
          
          {/* Collapsible Common Areas */}
          <Collapsible open={customPresetsOpen} onOpenChange={setCustomPresetsOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between"
                type="button"
              >
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
                    variant={isAdded ? "secondary" : "outline"}
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
            <Button onClick={handleAddCustomLabel} size="lg" className="h-11">
              <IconPlus className="h-5 w-5" />
            </Button>
          </div>
          {customLabels.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {customLabels.map((label, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {label}
                  <button
                    onClick={() => handleRemoveCustomLabel(index)}
                    className="ml-1 hover:text-destructive"
                  >
                    <IconX className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Total count */}
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm font-medium">
            Key types to create: <span className="text-lg font-bold">{getTotalLabels()}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            You'll specify the number of copies for each type in the next step
          </p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="flex gap-3 pt-4">
        <Button onClick={handleBack} variant="outline" className="h-11 min-w-32" size="lg">
          <IconArrowLeft className="mr-2 h-5 w-5" />
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={getTotalLabels() === 0 || isPending}
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

