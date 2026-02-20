'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { IconArrowLeft, IconX, IconCheck, IconKey, IconCalendar } from '@tabler/icons-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select';
import { BorrowerForm } from '@/components/shared/borrower-form';
import { isPlaceholderEmail } from '@/lib/borrower-utils';
import { issueMultipleKeysAction } from '@/app/actions/issueKeyWrapper';
import { toastSuccess } from '@/components/ui/toast-store';

interface KeyType {
  id: string;
  label: string;
  function: string;
  accessArea?: string | null;
  totalCopies: number;
  availableCopies: number;
  availableCopyDetails?: Array<{ id: string; copyNumber: number }>;
}

interface Borrower {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string; // Note: Still using 'company' field name for database compatibility
  address?: string;
  borrowerPurpose?: string;
}

interface IssueKeyWorkflowProps {
  initialKeyTypes: KeyType[];
}

type WorkflowStep = 'select-keys' | 'borrower-details' | 'lending-details' | 'confirm';

export function IssueKeyWorkflow({ initialKeyTypes }: IssueKeyWorkflowProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('select-keys');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [selectedKeyIds, setSelectedKeyIds] = useState<string[]>([]);
  const [borrowerData, setBorrowerData] = useState<Borrower>({
    id: '',
    name: '',
    email: '',
    phone: '',
    company: '',
    borrowerPurpose: '',
  });
  const [lendingDetails, setLendingDetails] = useState({
    dueDate: '',
    idChecked: false,
  });

  // Workflow state
  const [keyTypes] = useState<KeyType[]>(initialKeyTypes);
  const [selectedCopyByType, setSelectedCopyByType] = useState<Record<string, string>>({});

  const handleBack = useCallback(() => {
    switch (currentStep) {
      case 'borrower-details':
        setCurrentStep('select-keys');
        break;
      case 'lending-details':
        setCurrentStep('borrower-details');
        break;
      case 'confirm':
        setCurrentStep('lending-details');
        break;
      default:
        // At the first step, navigate back to the borrower table (active loans)
        router.push('/active-loans');
    }
  }, [currentStep, router]);

  // Prevent browser back button during workflow
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      // Custom back handling within workflow
      handleBack();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentStep, handleBack]);

  // Clear error when keys are selected on the select-keys step
  useEffect(() => {
    if (currentStep === 'select-keys' && selectedKeyIds.length > 0 && error) {
      setError(null);
    }
  }, [selectedKeyIds, currentStep, error]);

  // Ensure a default copy is selected for any newly selected key type
  useEffect(() => {
    if (currentStep !== 'select-keys') return;
    setSelectedCopyByType((prev) => {
      const next = { ...prev };
      for (const typeId of selectedKeyIds) {
        if (!next[typeId]) {
          const kt = keyTypes.find((k) => k.id === typeId);
          const firstAvailable = kt?.availableCopyDetails?.sort(
            (a, b) => a.copyNumber - b.copyNumber,
          )[0];
          if (firstAvailable) next[typeId] = firstAvailable.id;
        }
      }
      // Clean up deselected types
      Object.keys(next).forEach((k) => {
        if (!selectedKeyIds.includes(k)) delete next[k];
      });
      return next;
    });
  }, [selectedKeyIds, keyTypes, currentStep]);

  const getBackLabel = () => {
    switch (currentStep) {
      case 'select-keys':
        return 'Cancel';
      case 'borrower-details':
        return 'Select keys';
      case 'lending-details':
        return 'Borrower details';
      case 'confirm':
        return 'Lending details';
      default:
        return 'Back';
    }
  };

  const handleExit = () => {
    router.push('/active-loans'); // Return to active loans (borrower list)
  };

  const handleNext = useCallback(() => {
    setError(null);

    switch (currentStep) {
      case 'select-keys':
        if (selectedKeyIds.length === 0) {
          setError('Please select at least one key to issue.');
          return;
        }
        setCurrentStep('borrower-details');
        break;
      case 'borrower-details':
        // Submit the borrower form to trigger per-field validation and save
        const form = document.getElementById('borrower-form') as HTMLFormElement | null;
        if (form) {
          form.requestSubmit();
        }
        break;
      case 'lending-details':
        if (!lendingDetails.idChecked) {
          setError('ID verification is required to issue keys.');
          return;
        }
        setCurrentStep('confirm');
        break;
    }
  }, [currentStep, selectedKeyIds, lendingDetails.idChecked]);

  // Selection is now handled inside BorrowerForm via form submit

  const handleBorrowerFormSubmit = (borrowerData: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    address?: string;
    borrowerPurpose?: string;
  }) => {
    // Convert form data to Borrower format for new borrowers
    const newBorrower: Borrower = {
      id: '', // Will be generated by server
      name: borrowerData.name,
      email: borrowerData.email,
      phone: borrowerData.phone,
      company: borrowerData.company,
      address: borrowerData.address,
      borrowerPurpose: borrowerData.borrowerPurpose,
    };
    setBorrowerData(newBorrower);
    setCurrentStep('lending-details');
  };

  const handleSubmit = useCallback(async () => {
    if (!lendingDetails.idChecked) {
      setError('ID verification is required to issue keys.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await issueMultipleKeysAction(
        {
          keyTypeIds: selectedKeyIds,
          borrowerName: borrowerData.name,
          borrowerEmail: borrowerData.email,
          borrowerPhone: borrowerData.phone,
          borrowerCompany: borrowerData.company,
          borrowerAddress: borrowerData.address,
          borrowerPurpose: borrowerData.borrowerPurpose,
          dueDate: lendingDetails.dueDate,
          idChecked: lendingDetails.idChecked,
          borrowerId: borrowerData.id || undefined, // Pass existing borrower ID if available
        },
        { keyCopyIdsByType: selectedCopyByType },
      );

      if (result.success) {
        // Show success toast with action to view keys page
        toastSuccess(
          'Keys issued successfully!',
          `${selectedKeyIds.length} ${selectedKeyIds.length === 1 ? 'key' : 'keys'} issued to ${borrowerData.name}`,
          {
            label: 'View Keys',
            onClick: () => router.push('/keys'),
          },
        );
        // Redirect to active loans (borrower list)
        router.push('/active-loans');
      } else {
        setError(result.error || 'Failed to issue keys.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [
    lendingDetails.idChecked,
    lendingDetails.dueDate,
    selectedKeyIds,
    borrowerData,
    selectedCopyByType,
    router,
  ]);

  const availableKeyOptions: MultiSelectOption[] = keyTypes.map((keyType) => ({
    label: `${keyType.label} - ${keyType.function}`,
    value: keyType.id,
    badge: `${keyType.availableCopies}`,
    description: keyType.accessArea || 'No specific access area',
    disabled: keyType.availableCopies === 0,
  }));

  const selectedKeys = useMemo(() => {
    return keyTypes.filter((keyType) => selectedKeyIds.includes(keyType.id));
  }, [keyTypes, selectedKeyIds]);

  const accessAreasSummary = useMemo(() => {
    const areas = selectedKeys
      .map((key) => key.accessArea)
      .filter((area) => area !== null)
      .filter((area, index, arr) => arr.indexOf(area) === index); // Remove duplicates

    return areas.length > 0 ? areas.join(', ') : 'No areas';
  }, [selectedKeys]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 'select-keys':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold">Select Keys to Issue</h1>
              <p className="text-muted-foreground">
                Choose one or more keys to issue to the borrower
              </p>
            </div>

            <MultiSelect
              options={availableKeyOptions}
              onValueChange={setSelectedKeyIds}
              selectedValues={selectedKeyIds}
              placeholder="Select keys to issue..."
              emptyIndicator="No keys found."
              disabled={isLoading}
            />

            <Card>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <IconKey className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      Combined Access Areas ({selectedKeyIds.length} keys):
                    </span>
                  </div>
                  <p className="text-muted-foreground">{accessAreasSummary}</p>
                </div>
                {selectedKeyIds.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {selectedKeyIds.map((typeId) => {
                      const kt = keyTypes.find((k) => k.id === typeId);
                      if (!kt) return null;
                      const copies = (kt.availableCopyDetails || []).sort(
                        (a, b) => a.copyNumber - b.copyNumber,
                      );
                      return (
                        <div key={typeId} className="flex items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">
                              {kt.label} — {kt.function}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Select copy to issue
                            </div>
                          </div>
                          <div className="w-36">
                            <Select
                              value={selectedCopyByType[typeId] || ''}
                              onValueChange={(val) =>
                                setSelectedCopyByType((prev) => ({ ...prev, [typeId]: val }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Copy" />
                              </SelectTrigger>
                              <SelectContent>
                                {copies.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    #{c.copyNumber}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 'borrower-details':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold">Borrower Details</h1>
              <p className="text-muted-foreground">Type a name to search or enter a new one.</p>
            </div>

            <BorrowerForm
              onSubmit={handleBorrowerFormSubmit}
              onCancel={handleBack}
              formId="borrower-form"
              hideActions
              isLoading={isLoading}
            />
          </div>
        );

      case 'lending-details':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold">Lending Details</h1>
              <p className="text-muted-foreground">Set due date, notes, and verify ID</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <IconCalendar className="h-5 w-5" />
                  Due Date (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <input
                  type="date"
                  value={lendingDetails.dueDate}
                  onChange={(e) =>
                    setLendingDetails({ ...lendingDetails, dueDate: e.target.value })
                  }
                  className="w-full p-2 border rounded-md"
                />
              </CardContent>
            </Card>

            {/* Notes section removed per requirements */}

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="idChecked"
                    checked={lendingDetails.idChecked}
                    onChange={(e) =>
                      setLendingDetails({ ...lendingDetails, idChecked: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                  <label htmlFor="idChecked" className="text-sm font-medium">
                    I have verified the borrower&apos;s ID
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'confirm':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold">Confirm Key Issue</h1>
              <p className="text-muted-foreground">Review the details and confirm the key issue</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Issue Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Keys ({selectedKeyIds.length})</p>
                    <ul className="list-disc list-inside text-muted-foreground">
                      {selectedKeys.map((key) => {
                        const copyId = selectedCopyByType[key.id];
                        const copyNum = key.availableCopyDetails?.find(
                          (c) => c.id === copyId,
                        )?.copyNumber;
                        return (
                          <li key={key.id}>
                            {key.label} - {key.function}
                            {copyNum ? ` (copy #${copyNum})` : ''}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium">Borrower</p>
                    <p className="text-muted-foreground">{borrowerData.name}</p>
                  </div>
                  <div>
                    <p className="font-medium">Email</p>
                    <div className="flex items-center gap-2">
                      <p className="text-muted-foreground">{borrowerData.email}</p>
                      {isPlaceholderEmail(borrowerData.email) && (
                        <Badge variant="outline" className="text-xs">
                          Placeholder
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Due Date</p>
                    <p className="text-muted-foreground">
                      {lendingDetails.dueDate || 'No due date set'}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <IconKey className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Combined Access Areas:</span>
                  </div>
                  <p className="text-muted-foreground">{accessAreasSummary}</p>
                </div>

                <Separator />

                <div className="flex items-center gap-2">
                  <IconCheck
                    className={`h-4 w-4 ${
                      lendingDetails.idChecked ? 'text-green-500' : 'text-muted-foreground'
                    }`}
                  />
                  <span
                    className={
                      lendingDetails.idChecked ? 'text-foreground' : 'text-muted-foreground'
                    }
                  >
                    ID verification: {lendingDetails.idChecked ? 'Completed' : 'Not completed'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with navigation */}
      <header className="flex items-center justify-between px-4 py-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={handleBack} className="gap-2">
            <IconArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{getBackLabel()}</span>
          </Button>
        </div>

        <Button variant="ghost" size="icon" onClick={handleExit}>
          <IconX className="h-4 w-4" />
        </Button>
      </header>

      {/* Progress indicator */}
      <div className="px-4 py-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2 pl-6">
            <span className="font-semibold text-foreground">Issue Keys</span>
            <span>—</span>
            <span>
              Step{' '}
              {currentStep === 'select-keys'
                ? 1
                : currentStep === 'borrower-details'
                  ? 2
                  : currentStep === 'lending-details'
                    ? 3
                    : 4}{' '}
              of 4
            </span>
          </div>
          <div className="flex gap-1 pr-6">
            {['select-keys', 'borrower-details', 'lending-details', 'confirm'].map(
              (step, index) => (
                <div
                  key={step}
                  className={`h-2 w-8 rounded-full ${
                    currentStep === step
                      ? 'bg-primary'
                      : index <
                          ['select-keys', 'borrower-details', 'lending-details', 'confirm'].indexOf(
                            currentStep,
                          )
                        ? 'bg-primary/50'
                        : 'bg-muted'
                  }`}
                />
              ),
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {renderStepContent()}

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Navigation buttons positioned after content */}
          <div className="flex justify-end pt-4">
            {currentStep === 'confirm' ? (
              <Button onClick={handleSubmit} disabled={isLoading} size="lg" className="gap-2">
                {isLoading && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
                Issue Keys
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={isLoading} size="lg">
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
