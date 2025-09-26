'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  IconUser,
  IconMail,
  IconPhone,
  IconBuilding,
  IconWand,
  IconAlertCircle,
  IconNotes,
} from '@tabler/icons-react';
import {
  generatePlaceholderEmail,
  isPlaceholderEmail,
  validateBorrowerData,
  type BorrowerValidationResult,
} from '@/lib/borrower-utils';

interface BorrowerFormProps {
  onSubmit: (borrowerData: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    borrowerPurpose?: string;
  }) => void;
  onCancel: () => void;
  existingBorrower?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    borrowerPurpose?: string;
  } | null;
  isLoading?: boolean;
}

export function BorrowerForm({
  onSubmit,
  onCancel,
  existingBorrower,
  isLoading = false,
}: BorrowerFormProps) {
  const [formData, setFormData] = useState({
    name: existingBorrower?.name || '',
    email: existingBorrower?.email || '',
    phone: existingBorrower?.phone || '',
    company: existingBorrower?.company || '',
    borrowerPurpose: existingBorrower?.borrowerPurpose || '',
  });

  const [validation, setValidation] = useState<BorrowerValidationResult>({
    isValid: false,
    errors: {},
    sanitized: { name: '', email: '' },
  });

  const [duplicateCheck, setDuplicateCheck] = useState<{
    isDuplicate: boolean;
    existingBorrower?: { id: string; name: string; email: string };
  }>({ isDuplicate: false });

  // Validate form data whenever it changes
  useEffect(() => {
    const result = validateBorrowerData(formData);
    setValidation(result);
  }, [formData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear duplicate check when email changes
    if (field === 'email') {
      setDuplicateCheck({ isDuplicate: false });
    }
  };

  const generatePlaceholder = () => {
    if (formData.name.trim()) {
      const placeholderEmail = generatePlaceholderEmail(formData.name);
      setFormData((prev) => ({ ...prev, email: placeholderEmail }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validation.isValid) {
      onSubmit(validation.sanitized);
    }
  };

  const hasPlaceholderEmail = isPlaceholderEmail(formData.email);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconUser className="h-5 w-5" />
          {existingBorrower ? 'Edit Borrower' : 'Add Borrower'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter full name"
              className={validation.errors.name ? 'border-destructive' : ''}
              disabled={isLoading}
            />
            {validation.errors.name && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <IconAlertCircle className="h-3.5 w-3.5" />
                {validation.errors.name}
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
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
                className={validation.errors.email ? 'border-destructive' : ''}
                disabled={isLoading}
              />
              {formData.name && !formData.email && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={generatePlaceholder}
                  disabled={isLoading}
                  title="Generate placeholder email"
                >
                  <IconWand className="h-4 w-4" />
                </Button>
              )}
            </div>
            {validation.errors.email && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <IconAlertCircle className="h-3.5 w-3.5" />
                {validation.errors.email}
              </p>
            )}
            {hasPlaceholderEmail && (
              <p className="text-sm text-amber-600 flex items-center gap-1">
                <IconAlertCircle className="h-3.5 w-3.5" />
                This is a placeholder email. Please update with real email when possible.
              </p>
            )}
            {duplicateCheck.isDuplicate && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>{duplicateCheck.existingBorrower?.name}</strong> already uses this email.
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
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="Enter phone number"
              className={validation.errors.phone ? 'border-destructive' : ''}
              disabled={isLoading}
            />
            {validation.errors.phone && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <IconAlertCircle className="h-3.5 w-3.5" />
                {validation.errors.phone}
              </p>
            )}
          </div>

          {/* Affiliation Field */}
          <div className="space-y-2">
            <Label htmlFor="company" className="flex items-center gap-2">
              <IconBuilding className="h-4 w-4" />
              Affiliation
            </Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              placeholder="Enter affiliation (optional)"
              className={validation.errors.company ? 'border-destructive' : ''}
              disabled={isLoading}
            />
            {validation.errors.company && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <IconAlertCircle className="h-3.5 w-3.5" />
                {validation.errors.company}
              </p>
            )}
          </div>

          {/* Purpose Field (only show if affiliation is filled - indicates external borrower) */}
          {formData.company && (
            <div className="space-y-2">
              <Label htmlFor="borrowerPurpose" className="flex items-center gap-2">
                <IconNotes className="h-4 w-4" />
                Purpose/Description
              </Label>
              <Textarea
                id="borrowerPurpose"
                value={formData.borrowerPurpose}
                onChange={(e) => handleInputChange('borrowerPurpose', e.target.value)}
                placeholder="Describe why they need access to keys (optional)"
                className={validation.errors.borrowerPurpose ? 'border-destructive' : ''}
                disabled={isLoading}
                rows={3}
              />
              {validation.errors.borrowerPurpose && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <IconAlertCircle className="h-3.5 w-3.5" />
                  {validation.errors.borrowerPurpose}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={!validation.isValid || isLoading} className="flex-1">
              {existingBorrower ? 'Update' : 'Add'} Borrower
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default BorrowerForm;
