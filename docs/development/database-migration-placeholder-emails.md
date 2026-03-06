# Database Migration: Placeholder Email System

## Overview

This migration implements a placeholder email system for borrowers transitioning from paper-based systems to the digital key management platform.

## Changes Made

### 1. Database Schema Updates

```sql
-- Step 1: Add placeholder emails for existing borrowers without emails
UPDATE "Borrower"
SET email = CASE
  WHEN name = 'Anita Axelsson' THEN 'anita.axelsson@placeholder.com'
  WHEN name = 'Gunhild Åberg' THEN 'gunhild.aberg@placeholder.com'
  WHEN name = 'Ulf Henriksson' THEN 'ulf.henriksson@placeholder.com'
  WHEN name = 'Ulla Viklund' THEN 'ulla.viklund@placeholder.com'
  WHEN name = 'Elisabet Hansson' THEN 'elisabet.hansson@placeholder.com'
END
WHERE email IS NULL;

-- Step 2: Make email column required (after all records have emails)
ALTER TABLE "Borrower" ALTER COLUMN email SET NOT NULL;

-- Step 3: Add unique constraint for email within each cooperative
ALTER TABLE "Borrower" ADD CONSTRAINT unique_email_per_user
UNIQUE (email, "userId");
```

### 2. Placeholder Email Convention

**Domain**: `@placeholder.com`  
**Format**: `firstname.lastname@placeholder.com`

**Examples**:

- Anna Andersson → `anna.andersson@placeholder.com`
- Erik Sven-Eriksson → `erik.sven-eriksson@placeholder.com`
- Åsa Öberg → `asa.oberg@placeholder.com`

### 3. Character Conversion Rules

Swedish characters are converted for email compatibility:

- `å` → `a`
- `ä` → `a`
- `ö` → `o`

Special characters (except spaces) are removed, spaces become dots.

## Implementation Files

### Core Utilities: `lib/borrower-utils.ts`

- `generatePlaceholderEmail()` - Creates placeholder emails from names
- `isPlaceholderEmail()` - Detects placeholder emails
- `validateBorrowerData()` - Comprehensive validation with security
- `sanitizePhoneNumber()` - Prevents injection attacks

### UI Components: `components/shared/`

- `borrower-form.tsx` - Form with placeholder email generation
- `borrower-search.tsx` - Search with placeholder email indicators

## Workflow Integration

### During Lending Process:

1. **Search Existing**: Shows borrowers with placeholder email badges
2. **Add New**:
   - Enter name
   - Click "Generate Placeholder" wand button if no email available
   - System creates `firstname.lastname@placeholder.com`
3. **Visual Indicators**: Placeholder emails clearly marked in UI

### Email Update Process:

1. **Gradual Collection**: Update real emails during normal operations
2. **Clear Indicators**: Placeholder emails marked with warning badges
3. **Validation**: System accepts both real and placeholder emails
4. **Unique Constraints**: Prevents duplicates within same cooperative

## Security Features

### Phone Number Validation:

```typescript
// Only allows: digits, spaces, hyphens, parentheses, plus sign
const phoneRegex = /^[\d\s\-\(\)\+]+$/;
```

### Input Sanitization:

- Names: Letters, spaces, hyphens, apostrophes only
- Emails: Standard email validation + placeholder detection
- Companies: Alphanumeric + common business characters
- Phones: Sanitized to prevent injection attacks

## GDPR Compliance

- **Data Minimization**: Borrowers only stored when holding keys
- **Purpose Limitation**: Placeholder emails clearly temporary
- **Right to Rectification**: Easy update to real emails
- **Right to Erasure**: Automatic deletion when no active keys

## Future Considerations

### Email Collection Strategies:

1. **Progressive Enhancement**: Replace placeholders during normal use
2. **Batch Update Tool**: Admin interface to update multiple emails
3. **Email Verification**: Optional verification for real emails
4. **Migration Wizard**: Guided setup for transitioning cooperatives

### Monitoring:

- Track percentage of placeholder vs real emails
- Report on email collection progress
- Alert when placeholder emails need attention

## Testing

### Validation Tests:

- ✅ Placeholder email generation from various name formats
- ✅ Swedish character conversion
- ✅ Phone number sanitization
- ✅ Unique constraint enforcement
- ✅ GDPR compliance scenarios

### UI Tests:

- ✅ Placeholder email visual indicators
- ✅ Generate placeholder button functionality
- ✅ Search with placeholder filtering
- ✅ Form validation with placeholders

This system provides immediate GDPR compliance while enabling smooth transition from paper-based systems to digital key management.



