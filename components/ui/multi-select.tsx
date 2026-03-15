'use client';

import * as React from 'react';
import { IconKey, IconCheck, IconX, IconChevronDown } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

export interface MultiSelectOption {
  label: string;
  value: string;
  disabled?: boolean;
  badge?: string;
  description?: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selectedValues: string[];
  onValueChange: (values: string[]) => void;
  placeholder?: string;
  maxCount?: number;
  disabled?: boolean;
  className?: string;
  emptyIndicator?: React.ReactNode;
}

export function MultiSelect({
  options,
  selectedValues,
  onValueChange,
  placeholder = 'Select options...',
  maxCount = 3,
  disabled = false,
  className,
  emptyIndicator,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');
  const [container, setContainer] = React.useState<HTMLElement | null>(null);
  const [pendingValues, setPendingValues] = React.useState<string[]>(selectedValues || []);

  const handleUnselect = (value: string) => {
    if (disabled) return;
    const newValues = (pendingValues || []).filter((v) => v !== value);
    setPendingValues(newValues);
    onValueChange(newValues); // Immediately update parent when removing from badge
  };

  const handleSelect = (value: string) => {
    if (disabled) return;
    const option = options?.find((opt) => opt.value === value);
    if (option?.disabled) return;

    if ((pendingValues || []).includes(value)) {
      handleUnselect(value);
    } else {
      setPendingValues([...(pendingValues || []), value]);
    }
    // Keep the popover open for multi-selection
  };

  const handleClear = () => {
    if (disabled) return;
    setPendingValues([]);
  };

  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options || [];
    return (options || []).filter(
      (option) =>
        option.label.toLowerCase().includes(searchValue.toLowerCase()) ||
        option.value.toLowerCase().includes(searchValue.toLowerCase()),
    );
  }, [options, searchValue]);

  const selectedOptions = (pendingValues || [])
    .map((value) => options?.find((opt) => opt.value === value))
    .filter(Boolean) as MultiSelectOption[];

  const displayedOptions = selectedOptions.slice(0, maxCount);
  const remainingCount = selectedOptions.length - maxCount;

  // Set container ref to detect where we're being rendered
  React.useEffect(() => {
    // Find if we're inside a dialog
    const dialogElement = document.querySelector('[data-slot="dialog-content"]');
    if (dialogElement) {
      setContainer(dialogElement as HTMLElement);
    }
  }, []);

  // Sync pending state with external value when it changes
  React.useEffect(() => {
    setPendingValues(selectedValues || []);
  }, [selectedValues]);

  // When popover closes by any means (including outside click), commit selection
  React.useEffect(() => {
    if (!open) {
      if (JSON.stringify(pendingValues) !== JSON.stringify(selectedValues)) {
        onValueChange(pendingValues || []);
      }
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between min-h-10 h-auto',
            disabled && 'opacity-50 cursor-not-allowed',
            className,
          )}
          disabled={disabled}
        >
          <div className="flex flex-1 flex-wrap items-center gap-1">
            {(pendingValues || []).length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <>
                {displayedOptions.map((option) => (
                  <Badge key={option.value} variant="secondary" className="gap-1 pr-1 text-xs">
                    <span className="max-w-[100px] truncate">{option.label}</span>
                    <div
                      role="button"
                      tabIndex={0}
                      className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleUnselect(option.value);
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleUnselect(option.value);
                      }}
                    >
                      <IconX className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </div>
                  </Badge>
                ))}
                {remainingCount > 0 && (
                  <Badge variant="secondary" className="gap-1 pr-1 text-xs">
                    +{remainingCount} more
                    <div
                      role="button"
                      tabIndex={0}
                      className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleClear();
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleClear();
                      }}
                    >
                      <IconX className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </div>
                  </Badge>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {(pendingValues || []).length > 0 && (
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleClear();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClear();
                  }
                }}
                className="rounded-full p-1 hover:bg-muted cursor-pointer"
              >
                <IconX className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </div>
            )}
            <IconChevronDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        container={container}
      >
        <Command>
          <CommandInput
            placeholder="Search..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>{emptyIndicator || 'No options found.'}</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => {
                const isSelected = (pendingValues || []).includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      handleSelect(option.value);
                    }}
                    className={cn(
                      'cursor-pointer hover:bg-accent',
                      option.disabled && 'opacity-50 cursor-not-allowed',
                    )}
                    disabled={option.disabled}
                  >
                    <div
                      className={cn(
                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary cursor-pointer hover:border-primary/80',
                        isSelected ? 'bg-primary text-white' : 'opacity-50',
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(option.value);
                      }}
                    >
                      {isSelected && <IconCheck className="h-4 w-4 text-white" />}
                    </div>
                    <div
                      className="flex-1 flex items-center justify-between cursor-pointer gap-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(option.value);
                      }}
                    >
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-medium">{option.label}</span>
                        {option.description && (
                          <span className="text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        )}
                      </div>
                      {option.badge && (
                        <Badge
                          variant="secondary"
                          className="text-xs flex items-center gap-1 shrink-0"
                        >
                          <IconKey className="h-3 w-3" />
                          {option.badge}
                        </Badge>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
          <div className="p-2 border-t flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onValueChange(pendingValues || []);
                setOpen(false);
              }}
              className="gap-1"
            >
              Done
            </Button>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
