# Key Onboarding Wizard Guide

## Overview

The onboarding wizard is a 6-step mobile-first flow that guides new organizations through setting up their key management system. It's triggered automatically when an organization has zero keys.

## Architecture Decisions

### AccessArea as Separate Model

We chose to create a separate `AccessArea` model with a join table (`KeyTypeAccessArea`) instead of storing comma-separated strings in `KeyType.accessArea`. This provides:

1. **Data integrity**: Foreign key constraints prevent typos and ensure consistency
2. **Better queries**: Easily find all keys for a specific area or all areas for a key
3. **Scalability**: Supports future features like area-specific permissions
4. **Consistency**: Matches the existing multi-tenant pattern (Entity, User, etc.)

### Server-Side Draft Persistence

Draft data is stored in `OnboardingSession.draftJson` to ensure:

- Users don't lose progress on browser refresh
- State is accessible across devices (if needed in future)
- Simple resume logic on step navigation

## User Flow

### Step 1: Organization Name

- Input: Organization name (max 200 chars)
- Validates: Required, non-empty
- Saves: Immediately updates `Entity.name`

### Step 2: Access Areas

- Defaults: Port, Laundry, Basement, Attic, Garage, Bike room, Storage
- Input: Add/remove areas
- Validates: Unique names, max 100 chars per area
- Saves: Array of area names in draft

### Step 3: Key Labels

Three input sections:

**A) Common Keys (Letters A-Z)**

- Multi-select grid (5 cols mobile, 7 tablet, 9 desktop)
- Toggle to show/hide I & O (confusing letters)
- Displays selected as badges
- **Conflict prevention**: Disables letters used in apartment series or custom labels

**B) Apartment Keys (Optional Numbered Series)**

- **Prefix input**: Editable (default "Z"), max 10 chars, italic placeholder "e.g., Z"
- **Range inputs**: "From" and "To" (both empty or both filled)
- Validates: 1-9999, from ≤ to
- **Live preview**: "Z1, Z2, ... Z14 (14 keys)"
- **Examples provided**: Z1-Z14 (default), L1-L20, pure numbers (101-104)
- **Conflict prevention**: Auto-disables common letter if it matches prefix

**C) Custom Labels**

- Free text input with add button
- Max 50 chars
- **Real-time validation**: Checks duplicates against all labels (common, series, custom)
- **Context-aware errors**: "L already exists in Common Keys"
- Displays added labels as removable badges

**Total count**: Displays sum of all selected labels (updates live)

**Duplicate Protection**:

- Bidirectional conflict prevention between all three sections
- Visual feedback (disabled buttons, tooltips, warning hints)
- Final validation before proceeding to Step 4

### Step 4: Copies Per Label

- Lists each label from Step 3
- Stepper (+/-) for each label
- Min: 1, Max: 99
- Default: 1 per label
- Displays total copies at bottom

### Step 5: Display Names

- Optional text input for each label
- Placeholder suggests use case (e.g., "Main entrance key")
- If blank, label is used as display name
- Max 100 chars

### Step 6: Map Keys to Areas

- Accordion per key label
- Checkboxes for each area
- "Select All" / "Clear All" helpers
- Shows count: "3 of 7 areas"

### Review Page

- Summary cards:
  - Organization name
  - Access areas (badges)
  - Key types (grouped by letter/Z-series/custom)
  - Total copies
  - Sample area mappings
- "Create Keys" button triggers transaction

### Done Page

- Success message
- Auto-redirect to `/keys` after 3 seconds
- Manual "Go to Keys Now" button

## Skip Functionality

- "Skip Setup" button visible on every step (except review)
- Shows confirmation dialog
- If confirmed:
  - Marks `OnboardingSession.completedAt = now()`
  - Redirects to `/keys`
  - User sees empty keys page, can add keys manually later

## Data Model

### OnboardingSession

```prisma
model OnboardingSession {
  id          String    @id @default(uuid())
  entityId    String    @unique
  step        Int       @default(1)
  draftJson   Json?
  completedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

### Draft JSON Schema

```typescript
interface OnboardingDraft {
  orgName?: string;
  accessAreas?: string[];
  letterLabels?: string[]; // e.g., ["A", "B", "C"]
  seriesPreset?: { prefix: string; from: number; to: number }; // e.g., { prefix: "Z", from: 1, to: 14 }
  customLabels?: string[]; // e.g., ["Office", "Storage-1"]
  copiesMap?: Record<string, number>; // label -> count, e.g., { "A": 2, "Z1": 1 }
  displayNamesMap?: Record<string, string | null>; // label -> display name, e.g., { "A": "Main entrance" }
  areaMappings?: Record<string, string[]>; // label -> area names, e.g., { "A": ["Port", "Laundry"] }
}
```

## Server Actions

### `getOnboardingSession()`

Returns: `{ step: number, draft: OnboardingDraft }`

### `updateOnboardingDraft(step, draft)`

Upserts session with new step and draft data

### `createOnboardingKeys()`

**Transaction flow:**

1. Update `Entity.name` (if provided)
2. Create `AccessArea` records
3. For each label:
   - Create `KeyType` (label, function/displayName)
   - Create `KeyCopy` records (1..N)
   - Create `KeyTypeAccessArea` joins
4. Mark `OnboardingSession.completedAt`

**Idempotency**: Checks if keys exist before creating

### `skipOnboarding()`

Marks session as completed without creating keys

## Guard Logic

### Dashboard Layout Guard

```typescript
const needsOnboarding = await shouldShowOnboarding(entityId);
if (needsOnboarding) {
  redirect('/onboarding/keys');
}
```

### Keys Page Guard

```typescript
const needsOnboarding = await shouldShowOnboarding(entityId);
if (needsOnboarding) {
  redirect('/onboarding/keys');
}
```

### Trigger Condition

```typescript
export async function shouldShowOnboarding(entityId: string): Promise<boolean> {
  const keyCount = await prisma.keyType.count({
    where: { entityId },
  });
  return keyCount === 0;
}
```

## Mobile UX Considerations

### Layout

- Single-column on mobile
- Sticky header with skip button
- Progress indicator at top (dots on mobile, labeled stepper on desktop)
- Large touch targets (≥44px)
- Minimum 16px font size

### Navigation

- Back/Next buttons at bottom
- Back button: outline style
- Next button: primary, aligned right
- Disabled states for invalid data

### Components

- Letter grid: 5 columns on mobile, 7 on tablet, 9 on desktop
- Accordion: Full-width, clear tap targets
- Stepper: Large +/- buttons

## Recent UX Improvements (Jan 2026)

### Flexible Apartment Series Design

- **Before**: Hardcoded "Z-series" (Z1-Z14 only)
- **After**: Editable prefix supporting any pattern (Z, L, Apt, or empty for pure numbers)
- **Rationale**: Different cooperatives use different naming conventions

### Compact Single-Line Layout

- **Before**: Prefix on separate line from range inputs
- **After**: All three inputs (Prefix, From, To) on same line
- **Benefit**: Saves vertical space on mobile, clearer visual grouping

### Improved Placeholder Clarity

- **Before**: Placeholders "1" and "14" looked like actual input (confusion!)
- **After**:
  - Prefix: Italic "e.g., Z" at 50% opacity
  - From/To: Empty (no placeholder)
  - Example hint below: "Prefix 'Z', From 1, To 14 → creates Z1, Z2, ... Z14"
- **Benefit**: Crystal clear when fields are empty vs. filled

### Bidirectional Conflict Prevention

- **Common ↔ Series**: Letter "Z" auto-disables if used as apartment prefix
- **Common ↔ Custom**: Letter "L" auto-disables if added as custom label
- **Series ↔ Custom**: "Z5" blocked if Z1-Z14 series exists
- **Visual feedback**: Grayed buttons, tooltips, inline hints

### Enhanced Validation Messages

- **Generic**: "This label already exists" ❌
- **Specific**: "L already exists in Common Keys" ✅
- **Context-aware**: Shows which section has the conflict
- **Partial input**: "Please fill both 'from' and 'to' fields or leave both empty"

## Error Handling

### Validation Errors

- Inline error messages below inputs
- Prevent navigation if current step invalid
- Clear errors on input change

### Server Errors

- Toast notifications for action failures
- Graceful degradation (show error, keep user on page)
- Retry logic for transient failures

### Edge Cases

- **Race condition**: Multiple tabs creating keys simultaneously
  - Solution: Idempotency check in `createOnboardingKeys()`
- **Large label count**: Z1-Z999 performance
  - Solution: Batch inserts in transaction
- **Browser close mid-flow**: Draft saved server-side
  - Solution: Resume from last saved step
- **Duplicate area names**: Validation prevents
- **Special characters in labels**: Allowed, max 50 chars

## Testing Checklist

### Complete Flow

- [ ] New org with 0 keys redirects to onboarding
- [ ] Step 1: Can update org name
- [ ] Step 2: Can add/remove areas, default suggestions loaded
- [ ] Step 3: Can select letters, define Z-series, add custom labels
- [ ] Step 4: Can adjust copy counts
- [ ] Step 5: Can add display names (optional)
- [ ] Step 6: Can map keys to areas via accordion
- [ ] Review: All data displayed correctly
- [ ] Done: Redirects to `/keys` with created keys

### Skip Flow

- [ ] Can skip from any step (1-6)
- [ ] Confirmation dialog shown
- [ ] Redirects to `/keys` (empty)
- [ ] Can manually add keys after skip

### Data Persistence

- [ ] Refresh mid-flow resumes at correct step
- [ ] Back/next preserves entered data
- [ ] Draft JSON matches input values

### Validation

- [ ] Step 1: Org name required
- [ ] Step 2: Duplicate area names prevented
- [ ] Step 3: Total labels > 0 required
- [ ] Step 3: Series range validated (1-9999, from ≤ to, both fields required)
- [ ] Step 3: Series prefix auto-disables matching common letter
- [ ] Step 3: Custom labels checked against all existing labels
- [ ] Step 3: Custom labels unique and ≤50 chars
- [ ] Step 3: Real-time duplicate detection with helpful error messages

### Mobile Responsive

- [ ] Layout adapts to screen size
- [ ] Touch targets ≥44px
- [ ] Text readable (≥16px)
- [ ] Progress indicator switches (dots vs stepper)
- [ ] Accordion works on mobile

### Edge Cases

- [ ] Empty areas list (validation error)
- [ ] No labels selected (validation error)
- [ ] Large Z-series (Z1-Z100) performance acceptable
- [ ] Long custom labels (50 char limit enforced)
- [ ] Special characters in labels allowed
- [ ] Org already has keys (idempotency check works)

## Future Enhancements

1. **Area icons**: Add icon picker for visual identification
2. **Key photos**: Upload photos during or after creation
3. **Bulk import**: CSV import for large key inventories
4. **Templates**: Save/load common key configurations
5. **Area permissions**: Restrict access by user role
6. **Key history**: Track who created keys and when

## Troubleshooting

### Onboarding doesn't trigger

- Check: Does organization have `keyCount === 0`?
- Check: Is `activeOrganisationId` set for user?
- Check: Guard logic in dashboard layout

### Draft not persisting

- Check: `updateOnboardingDraft()` called on each step?
- Check: `draftJson` column type is JSONB
- Check: Network requests succeed

### Keys not created

- Check: Review page calls `createOnboardingKeys()`
- Check: Transaction logs for errors
- Check: All foreign keys valid (entityId, keyTypeId)
- Check: AccessArea records created before joins

### Redirect loop

- Check: `OnboardingSession.completedAt` is set after creation
- Check: `shouldShowOnboarding()` respects completedAt
- Check: `/onboarding/*` paths excluded from guard

## Database Queries

### Check onboarding status

```sql
SELECT step, completedAt, draftJson
FROM "OnboardingSession"
WHERE "entityId" = '<uuid>';
```

### View created keys

```sql
SELECT kt.label, kt.function, COUNT(kc.id) as copies
FROM "KeyType" kt
LEFT JOIN "KeyCopy" kc ON kt.id = kc."keyTypeId"
WHERE kt."entityId" = '<uuid>'
GROUP BY kt.id;
```

### View area mappings

```sql
SELECT kt.label, aa.name as area
FROM "KeyType" kt
JOIN "KeyTypeAccessArea" ktaa ON kt.id = ktaa."keyTypeId"
JOIN "AccessArea" aa ON ktaa."accessAreaId" = aa.id
WHERE kt."entityId" = '<uuid>'
ORDER BY kt.label, aa.name;
```

## Support & Maintenance

For issues or questions, see:

- **Schema**: `prisma/schema.prisma`
- **Server Actions**: `app/actions/onboarding.ts`
- **Guard Logic**: `lib/onboarding-utils.ts`
- **Wizard UI**: `app/onboarding/keys/`
