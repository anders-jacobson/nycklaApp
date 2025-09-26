'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IconKey, IconCheck, IconAlertCircle, IconPlus } from '@tabler/icons-react';

interface KeyType {
  id: string;
  label: string;
  function: string;
  accessArea: string | null;
  totalCopies: number;
  availableCopies: number;
}

interface KeySelectorProps {
  keyTypes: KeyType[];
  onSelectKey: (keyType: KeyType) => void;
  onCreateNewCopy?: (keyTypeId: string) => void;
  selectedKeyTypeId?: string;
  disabled?: boolean;
}

export function KeySelector({
  keyTypes,
  onSelectKey,
  onCreateNewCopy,
  selectedKeyTypeId,
  disabled = false,
}: KeySelectorProps) {
  const [selectedId, setSelectedId] = useState<string>(selectedKeyTypeId || '');

  const handleSelectKey = (keyType: KeyType) => {
    setSelectedId(keyType.id);
    onSelectKey(keyType);
  };

  const getAvailabilityStatus = (availableCopies: number) => {
    if (availableCopies === 0) return 'none';
    if (availableCopies <= 2) return 'low';
    return 'good';
  };

  const getAvailabilityBadge = (availableCopies: number) => {
    const status = getAvailabilityStatus(availableCopies);

    if (status === 'none') {
      return (
        <Badge variant="destructive" className="gap-1">
          <IconAlertCircle className="h-3 w-3" />
          None available
        </Badge>
      );
    }

    if (status === 'low') {
      return (
        <Badge variant="outline" className="gap-1 border-amber-200 text-amber-700">
          <IconAlertCircle className="h-3 w-3" />
          {availableCopies} available
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="gap-1 border-green-200 text-green-700">
        <IconCheck className="h-3 w-3" />
        {availableCopies} available
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconKey className="h-5 w-5" />
          Select Key Type
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {keyTypes.map((keyType) => {
            const isSelected = selectedId === keyType.id;
            const hasAvailable = keyType.availableCopies > 0;

            return (
              <div
                key={keyType.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : hasAvailable
                      ? 'border-border hover:border-primary/50'
                      : 'border-destructive/30 bg-destructive/5'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !disabled && hasAvailable && handleSelectKey(keyType)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="font-mono text-lg font-semibold">{keyType.label}</div>
                        {isSelected && <IconCheck className="h-4 w-4 text-primary" />}
                      </div>
                      {getAvailabilityBadge(keyType.availableCopies)}
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-medium">{keyType.function}</h3>
                      {keyType.accessArea && (
                        <p className="text-sm text-muted-foreground">
                          Access: {keyType.accessArea}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Total copies: {keyType.totalCopies}
                      </p>
                    </div>
                  </div>

                  {!hasAvailable && onCreateNewCopy && (
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateNewCopy(keyType.id);
                        }}
                        disabled={disabled}
                        className="gap-1"
                      >
                        <IconPlus className="h-3.5 w-3.5" />
                        Create Copy
                      </Button>
                    </div>
                  )}
                </div>

                {!hasAvailable && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      No copies available. You&apos;ll need to create a new copy before issuing this
                      key.
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {keyTypes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <IconKey className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No key types found. Create some key types first.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default KeySelector;
