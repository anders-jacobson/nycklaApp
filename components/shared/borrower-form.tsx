'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  IconUser,
  IconMail,
  IconPhone,
  IconBuilding,
  IconAlertCircle,
  IconNotes,
  IconPlus,
} from '@tabler/icons-react';
import {
  isPlaceholderEmail,
  validateBorrowerData,
  type BorrowerValidationResult,
} from '@/lib/borrower-pure-utils';

interface BorrowerFormProps {
  onSubmit: (borrowerData: {
    id?: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    address?: string;
    borrowerPurpose?: string;
  }) => void;
  onCancel: () => void;
  formId?: string;
  hideActions?: boolean;
  existingBorrower?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    address?: string;
    borrowerPurpose?: string;
  } | null;
  isLoading?: boolean;
}

export function BorrowerForm({
  onSubmit,
  onCancel,
  formId,
  hideActions,
  existingBorrower,
  isLoading = false,
}: BorrowerFormProps) {
  const [formData, setFormData] = useState({
    name: existingBorrower?.name || '',
    email: existingBorrower?.email || '',
    phone: existingBorrower?.phone || '',
    company: existingBorrower?.company || '',
    address: existingBorrower?.address || '',
    borrowerPurpose: existingBorrower?.borrowerPurpose || '',
  });

  const [validation, setValidation] = useState<BorrowerValidationResult>({
    isValid: false,
    errors: {},
    sanitized: { name: '', email: '' },
  });

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
    company: false,
    address: false,
    borrowerPurpose: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const [affiliation, setAffiliation] = useState<'RESIDENT' | 'EXTERNAL' | ''>(
    existingBorrower?.company || existingBorrower?.borrowerPurpose
      ? 'EXTERNAL'
      : existingBorrower
        ? 'RESIDENT'
        : '',
  );

  const [duplicateCheck, setDuplicateCheck] = useState<{
    isDuplicate: boolean;
    existingBorrower?: { id: string; name: string; email: string };
  }>({ isDuplicate: false });

  const [emailExists, setEmailExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const [nameOpen, setNameOpen] = useState(false);
  const [nameQuery, setNameQuery] = useState('');
  const [nameOptions, setNameOptions] = useState<
    Array<{
      id: string;
      name: string;
      email: string;
      phone?: string;
      company?: string;
      address?: string;
      borrowerPurpose?: string;
    }>
  >([]);
  const [selectedBorrowerId, setSelectedBorrowerId] = useState<string>('');
  const emailRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;
    const q = nameQuery.trim();
    async function run() {
      if (q.length < 2) {
        if (active) setNameOptions([]);
        return;
      }
      try {
        const { searchBorrowers } = await import('@/app/actions/dashboard');
        const results = await searchBorrowers(q);
        if (!active) return;
        setNameOptions(
          (results.success ? (results.data ?? []) : []).map((b) => ({
            id: b.id,
            name: b.name,
            email: b.email ?? '',
            phone: b.phone ?? undefined,
            company: b.company ?? undefined,
          })),
        );
      } catch {}
    }
    run();
    return () => {
      active = false;
    };
  }, [nameQuery]);

  // Check if email exists (debounced)
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      const email = formData.email.trim();

      // Skip if email is empty, placeholder, or we're editing an existing borrower with this email
      if (!email || isPlaceholderEmail(email) || existingBorrower?.email === email) {
        if (active) {
          setEmailExists(false);
          setCheckingEmail(false);
        }
        return;
      }

      if (active) setCheckingEmail(true);

      try {
        const { checkEmailExists } = await import('@/app/actions/borrowers');
        const result = await checkEmailExists(email, selectedBorrowerId || undefined);

        if (active) {
          setEmailExists(result.success && result.data?.exists === true);
          setCheckingEmail(false);
        }
      } catch {
        if (active) {
          setEmailExists(false);
          setCheckingEmail(false);
        }
      }
    }, 500); // Debounce 500ms

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [formData.email, selectedBorrowerId, existingBorrower?.email]);

  // Validate form data whenever it changes
  useEffect(() => {
    const result = validateBorrowerData({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      borrowerPurpose: formData.borrowerPurpose,
    });
    setValidation(result);
  }, [formData, affiliation]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear duplicate check when email changes
    if (field === 'email') {
      setDuplicateCheck({ isDuplicate: false });
    }
    if (field === 'name') {
      // Clear selected borrower when user edits the name
      setSelectedBorrowerId('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    // Block submission if email already exists (unless it's the current borrower's email)
    if (emailExists) {
      return;
    }

    // Block submission if affiliation is not selected
    if (!affiliation) {
      return;
    }

    if (validation.isValid) {
      onSubmit({
        id: selectedBorrowerId || undefined,
        name: validation.sanitized.name,
        email: validation.sanitized.email,
        phone: validation.sanitized.phone,
        company: affiliation === 'EXTERNAL' ? validation.sanitized.company : undefined,
        address: affiliation === 'EXTERNAL' ? formData.address : undefined,
        borrowerPurpose:
          affiliation === 'EXTERNAL' ? validation.sanitized.borrowerPurpose : undefined,
      });
    }
  };

  const hasPlaceholderEmail = isPlaceholderEmail(formData.email);

  return (
    <div className="flex justify-center w-full">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconUser className="h-5 w-5" />
            {existingBorrower ? 'Edit Borrower' : 'Add Borrower'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form id={formId} onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              {validation.errors.name &&
                ((touched.name && formData.name.length > 0) || submitted) && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <IconAlertCircle className="h-3.5 w-3.5" />
                    {validation.errors.name}
                  </p>
                )}
              <div className="flex gap-2 items-start">
                <Popover open={nameOpen} onOpenChange={setNameOpen}>
                  <PopoverTrigger asChild>
                    <div className="relative w-full">
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => {
                          handleInputChange('name', e.target.value);
                          setNameQuery(e.target.value);
                          setNameOpen(true);
                        }}
                        onKeyDown={(e) => {
                          // Prevent Enter from submitting form when dropdown is closed
                          if (e.key === 'Enter' && !nameOpen) {
                            e.preventDefault();
                          }
                        }}
                        onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
                        placeholder="Enter full name"
                        className={
                          (validation.errors.name &&
                          ((touched.name && formData.name.length > 0) || submitted)
                            ? 'border-destructive '
                            : '') + ' cursor-text text-left pr-16'
                        }
                        disabled={isLoading}
                      />
                      {nameQuery.trim().length >= 2 && nameOptions.length === 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 text-xs"
                          onClick={() => {
                            setSelectedBorrowerId('');
                            setNameOpen(false);
                            setFormData((prev) => ({
                              ...prev,
                              name: nameQuery.trim() || prev.name,
                            }));
                            setTimeout(() => emailRef.current?.focus(), 0);
                          }}
                          title="Create new borrower with this name"
                        >
                          <IconPlus className="h-3.5 w-3.5 mr-1" /> New
                        </Button>
                      )}
                    </div>
                  </PopoverTrigger>
                  <PopoverContent
                    className="p-0 w-[var(--radix-popover-trigger-width)]"
                    align="start"
                  >
                    <Command>
                      <CommandInput
                        placeholder="Search names..."
                        value={nameQuery}
                        onValueChange={(value) => {
                          setNameQuery(value);
                          // Also update the main name field as we type in the search
                          handleInputChange('name', value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const trimmedName = nameQuery.trim();
                            // Only create new user if no matches and valid name length
                            if (trimmedName.length >= 2 && nameOptions.length === 0) {
                              e.preventDefault();
                              setSelectedBorrowerId('');
                              setNameOpen(false);
                              setFormData((prev) => ({ ...prev, name: trimmedName }));
                              setTimeout(() => emailRef.current?.focus(), 0);
                            }
                          }
                        }}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {nameQuery.trim().length < 2
                            ? 'Type at least 2 characters to search existing borrowers.'
                            : 'No matches. Press Enter or click New to create this borrower.'}
                        </CommandEmpty>
                        <CommandGroup>
                          {nameOptions.map((opt) => (
                            <CommandItem
                              key={opt.id}
                              value={opt.name}
                              onSelect={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  name: opt.name,
                                  email: opt.email || prev.email,
                                  phone: opt.phone || prev.phone,
                                  company: opt.company || prev.company,
                                  address: opt.address || prev.address,
                                  borrowerPurpose: opt.borrowerPurpose || prev.borrowerPurpose,
                                }));
                                setSelectedBorrowerId(opt.id);
                                // Set affiliation based on whether borrower has external fields
                                if (opt.company || opt.borrowerPurpose) {
                                  setAffiliation('EXTERNAL');
                                } else {
                                  setAffiliation('RESIDENT');
                                }
                                setNameOpen(false);
                                setTouched((prev) => ({ ...prev, name: true }));
                              }}
                              className="cursor-pointer"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{opt.name}</span>
                                <span className="text-xs text-muted-foreground truncate">
                                  {opt.email}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              {/* Helper hint below the name field */}
              {nameQuery.trim().length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Start typing to search existing borrowers or create a new one.
                </p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <IconMail className="h-4 w-4" />
                Email *
                {hasPlaceholderEmail && (
                  <Badge variant="outline" className="text-xs">
                    Placeholder
                  </Badge>
                )}
              </Label>
              {checkingEmail && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  Checking email availability...
                </p>
              )}
              {emailExists && !checkingEmail && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <IconAlertCircle className="h-3.5 w-3.5" />
                  This email is already registered with another borrower
                </p>
              )}
              {validation.errors.email &&
                ((touched.email && formData.email.length > 0) || submitted) && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <IconAlertCircle className="h-3.5 w-3.5" />
                    {validation.errors.email}
                  </p>
                )}
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                ref={emailRef}
                onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                placeholder="Enter email address"
                className={
                  (validation.errors.email &&
                    ((touched.email && formData.email.length > 0) || submitted)) ||
                  emailExists
                    ? 'border-destructive'
                    : ''
                }
                disabled={isLoading}
              />
              {hasPlaceholderEmail && (
                <p className="text-sm text-amber-600 flex items-center gap-1">
                  <IconAlertCircle className="h-3.5 w-3.5" />
                  This is a placeholder email. Please update with real email when possible.
                </p>
              )}
              {duplicateCheck.isDuplicate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>{duplicateCheck.existingBorrower?.name}</strong> already uses this
                    email.
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline">
                      Use Existing
                    </Button>
                    <Button size="sm" variant="ghost">
                      Different Email
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <IconPhone className="h-4 w-4" />
                Phone
              </Label>
              {validation.errors.phone &&
                ((touched.phone && formData.phone.length > 0) || submitted) && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <IconAlertCircle className="h-3.5 w-3.5" />
                    {validation.errors.phone}
                  </p>
                )}
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
                placeholder="Enter phone number"
                className={
                  validation.errors.phone &&
                  ((touched.phone && formData.phone.length > 0) || submitted)
                    ? 'border-destructive'
                    : ''
                }
                disabled={isLoading}
              />
            </div>

            {/* Affiliation Selector */}
            <div className="space-y-2">
              <Label>Affiliation *</Label>
              {!affiliation && submitted && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <IconAlertCircle className="h-3.5 w-3.5" />
                  Please select an affiliation type
                </p>
              )}
              <Select
                value={affiliation}
                onValueChange={(value: 'RESIDENT' | 'EXTERNAL') => {
                  setAffiliation(value);
                  if (value === 'RESIDENT') {
                    setFormData((prev) => ({
                      ...prev,
                      company: '',
                      address: '',
                      borrowerPurpose: '',
                    }));
                  }
                }}
                disabled={isLoading}
              >
                <SelectTrigger className={!affiliation && submitted ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select affiliation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RESIDENT">Resident</SelectItem>
                  <SelectItem value="EXTERNAL">External</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* External Borrower Fields */}
            {affiliation === 'EXTERNAL' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="company" className="flex items-center gap-2">
                    <IconBuilding className="h-4 w-4" />
                    Company
                  </Label>
                  {validation.errors.company &&
                    ((touched.company && formData.company.length > 0) || submitted) && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <IconAlertCircle className="h-3.5 w-3.5" />
                        {validation.errors.company}
                      </p>
                    )}
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    onBlur={() => setTouched((prev) => ({ ...prev, company: true }))}
                    placeholder="Enter company (optional)"
                    className={
                      validation.errors.company &&
                      ((touched.company && formData.company.length > 0) || submitted)
                        ? 'border-destructive'
                        : ''
                    }
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  {validation.errors.address &&
                    ((touched.address && formData.address.length > 0) || submitted) && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <IconAlertCircle className="h-3.5 w-3.5" />
                        {validation.errors.address}
                      </p>
                    )}
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    onBlur={() => setTouched((prev) => ({ ...prev, address: true }))}
                    placeholder="Enter address (optional)"
                    className={
                      validation.errors.address &&
                      ((touched.address && formData.address.length > 0) || submitted)
                        ? 'border-destructive'
                        : ''
                    }
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="borrowerPurpose" className="flex items-center gap-2">
                    <IconNotes className="h-4 w-4" />
                    Purpose/Description
                  </Label>
                  {validation.errors.borrowerPurpose &&
                    ((touched.borrowerPurpose && formData.borrowerPurpose.length > 0) ||
                      submitted) && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <IconAlertCircle className="h-3.5 w-3.5" />
                        {validation.errors.borrowerPurpose}
                      </p>
                    )}
                  <Textarea
                    id="borrowerPurpose"
                    value={formData.borrowerPurpose}
                    onChange={(e) => handleInputChange('borrowerPurpose', e.target.value)}
                    onBlur={() => setTouched((prev) => ({ ...prev, borrowerPurpose: true }))}
                    placeholder="Describe why they need access to keys (optional)"
                    className={
                      validation.errors.borrowerPurpose &&
                      ((touched.borrowerPurpose && formData.borrowerPurpose.length > 0) ||
                        submitted)
                        ? 'border-destructive'
                        : ''
                    }
                    disabled={isLoading}
                    rows={3}
                  />
                </div>
              </>
            )}

            {/* Action Buttons (optional) */}
            {!hideActions && (
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {existingBorrower ? 'Update' : 'Add'} Borrower
                </Button>
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                  Cancel
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default BorrowerForm;
