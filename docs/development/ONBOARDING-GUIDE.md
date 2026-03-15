# Key Onboarding Wizard Guide

## Overview

The onboarding wizard is a **4-step mobile-first flow** that guides new organizations through setting up their key management system. It's triggered automatically when an organization has zero keys.

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

## Layout

The wizard shell (`app/onboarding/keys/layout.tsx`) renders a minimal sticky header:

- **Left**: "Nyckla" wordmark
- **Right**: "Skip Setup" ghost button (hidden on Review page)
- **Below header**: Full-width 1px progress bar (25 / 50 / 75 / 100% across steps 1–4)
- **Main area**: Fraction text "Step N of 4 · Label" above page content

The Review and Done pages bypass the stepper/fraction display entirely.

## User Flow

### Step 1: Organization Name

- Input: Organization name (max 200 chars)
- Validates: Required, non-empty
- Saves: Immediately updates `Entity.name`
- **Skip**: Auto-skipped if org already has a name

### Step 2: Access Areas

- Defaults: Port, Laundry, Basement, Attic, Garage, Bike room, Storage
- Input: Add/remove areas
- Validates: Unique names, max 100 chars per area
- Saves: Array of area names in draft

### Step 3: Key Labels

Three sections, each in a collapsible **accordion** (all collapsed by default). The accordion trigger shows a live summary so the user can see their selections at a glance without opening the section.

**A) Common Keys (Letters A–Z)**

- Multi-select grid (5 cols mobile, 7 tablet, 9 desktop)
- Toggle to show/hide I & O (visually ambiguous letters)
- **Conflict prevention**: Disables letters used in apartment series prefix or custom labels
- Disabled-letter hint updated to explain: *"Letter Z is reserved for apartment keys — change the prefix under Apartment Keys if you want to use it here."*
- Letter tooltips on conventionally used letters (Z, P, B, G, T, F) show their common Swedish housing coop meaning

**B) Apartment Keys (Optional Numbered Series)**

- **Prefix input**: Editable (default "Z"), max 10 chars
- Tooltip on Prefix label: "Z is the most common prefix in Swedish housing cooperatives. Change it to any letter, or leave empty for plain numbers."
- **Range inputs**: "From" and "To" (both empty or both filled)
- Validates: 1–9999, from ≤ to
- **Live preview**: "Z1, Z2, ... Z14 (14 keys)"
- **Quick Presets** collapsible: Z1-14, Z1-20, Z1-30, 101-120, L1-15
- **Conflict prevention**: Auto-disables common letter if it matches prefix

**C) Custom Labels**

- **Common Area Keys** collapsible: tap to add preset labels
- Free text input with add button (Enter key supported)
- Max 50 chars per label
- **Real-time validation**: Checks duplicates against all labels (common, series, custom)
- **Context-aware errors**: "L already exists in Common Keys"

**Bottom summary box — all selected keys in one place:**

- Letter badges (click × to deselect)
- Apartment series as single compact badge, e.g. `Z1–Z14 · 14`
- Custom label badges with × to remove
- Live count: "Key types to create: N"

### Step 4: Copies Per Label

- Lists each label from Step 3
- Stepper (+/−) for each label
- Min: 1, Max: 99
- Default: 1 per label
- Displays total copies at bottom
- **Next routes directly to Review**

### Review Page

Summary cards:
- Organization name
- Access areas (badges)
- Keys Summary: total types, total copies, letter/series/custom breakdown, and a full per-key list with copy counts (scrollable if >10 keys)

"Create Keys" button triggers the database transaction.

### Done Page

- Success message
- Auto-redirect to `/keys` after 3 seconds
- Manual "Go to Keys Now" button

## Skip Functionality

- "Skip Setup" button visible on every step (except Review)
- Shows confirmation dialog
- If confirmed:
  - Marks `OnboardingSession.completedAt = now()`
  - Redirects to `/keys`
  - User sees empty keys page, can add keys manually later

## Removed Steps (Display Names & Area Mappings)

Steps 5 (Display Names) and 6 (Map Keys to Areas) were removed from the wizard. The underlying draft fields (`displayNamesMap`, `areaMappings`) remain in the schema for future use. These settings will be configurable from Settings once that UI is built.

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
  displayNamesMap?: Record<string, string | null>; // reserved, not collected during onboarding
  areaMappings?: Record<string, string[]>; // reserved, not collected during onboarding
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
- Sticky header: "Nyckla" wordmark + Skip button on same line
- Full-width progress bar directly below header (1px height, no label)
- Fraction text "Step N of 4 · Label" in main content area
- Large touch targets (≥44px)
- Minimum 16px font size

### Navigation

- Back/Next buttons at bottom
- Back button: outline style
- Next button: primary, aligned right
- Disabled states for invalid data

### Components

- Letter grid: 5 columns on mobile, 7 on tablet, 9 on desktop
- Accordion: Full-width, all three sections collapsed by default
- Stepper: Large +/− buttons
- Progress bar: shadcn `Progress` component, `h-1 rounded-none`

## Error Handling

### Validation Errors

- Inline error messages below inputs
- Prevent navigation if current step invalid
- Clear errors on input change

### Server Errors

- Toast notifications for action failures
- Graceful degradation (show error, keep user on page)

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
- [ ] Step 1: Can update org name (skipped if org already named)
- [ ] Step 2: Can add/remove areas, default suggestions loaded
- [ ] Step 3: Can select letters, define series with any prefix, add custom labels
- [ ] Step 3: Accordion sections collapsed by default, trigger shows live summary
- [ ] Step 3: Bottom summary shows all selected keys as badges
- [ ] Step 3: Letter badges in summary are clickable to deselect
- [ ] Step 3: Custom label badges in summary have × to remove
- [ ] Step 3: Apartment series shown as single summary badge
- [ ] Step 4: Can adjust copy counts; Next goes to Review
- [ ] Review: Shows org, areas, keys breakdown, per-key list with copy counts
- [ ] Done: Redirects to `/keys` with created keys

### Skip Flow

- [ ] Can skip from any step (1–4)
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
- [ ] Step 3: Disabled-letter hint links to "Apartment Keys" section
- [ ] Step 3: Custom labels checked against all existing labels
- [ ] Step 3: Custom labels unique and ≤50 chars

### Mobile Responsive

- [ ] Header fits on one line at 375px (no overflow)
- [ ] Progress bar full-width
- [ ] Fraction text "Step N of 4 · Label" correct at each step
- [ ] Touch targets ≥44px
- [ ] Accordion expands without horizontal scroll

### Edge Cases

- [ ] Empty areas list (validation error)
- [ ] No labels selected (validation error)
- [ ] Large Z-series (Z1-Z100) performance acceptable
- [ ] Long custom labels (50 char limit enforced)
- [ ] Org already has keys (idempotency check works)

## Future Enhancements

1. **Display Names**: Set per-key display names from Settings
2. **Area Mappings**: Map keys to access areas from Settings
3. **Area icons**: Add icon picker for visual identification
4. **Bulk import**: CSV import for large key inventories
5. **Templates**: Save/load common key configurations

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

## Support & Maintenance

For issues or questions, see:

- **Schema**: `prisma/schema.prisma`
- **Server Actions**: `app/actions/onboarding.ts`
- **Guard Logic**: `lib/onboarding-utils.ts`
- **Wizard UI**: `app/onboarding/keys/`
