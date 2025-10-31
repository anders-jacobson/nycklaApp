# Key Management Features

## Overview

This document covers the key type and key copy management features in the application.

---

## Key Types Page

### Location

`/keys` route - Protected dashboard page

### Features

The Keys page provides comprehensive management of key types and their copies:

1. **Key Status Charts**
   - Total status pie chart showing distribution of all copies (Available/Out/Lost)
   - Bar chart showing status breakdown per key type

2. **Key Types Table**
   - List of all key types with label, name, access area
   - Copy count per key type
   - Column customization (show/hide name and access area columns)
   - Filter by label
   - Pagination support

3. **Expandable Copy Details** ✅ NEW
   - Click chevron icon to expand/collapse copy details
   - View all copies for a key type with status badges
   - Quick actions per copy (Mark Lost/Found)

### Key Type Management

#### Create Key Type

**Trigger:** "Add Key Type" button (top-right of table)

**Dialog Fields:**
- Label (required, max 2 chars, e.g., "A1")
- Name/Function (required, min 2 chars, e.g., "Main entrance")
- Access Area (optional, e.g., "Lobby")
- Total Copies (optional, default 0)

**Behavior:**
- Creates key type with specified number of copies
- Copies are numbered sequentially (1, 2, 3, ...)
- All copies start with AVAILABLE status
- Revalidates `/keys` and `/active-loans` routes

#### Edit Key Type

**Trigger:** Actions dropdown → Edit

**Editable Fields:**
- Name/Function
- Access Area

**Non-editable:**
- Label (cannot be changed after creation)
- Copies (use Add Copy action instead)

#### Delete Key Type

**Trigger:** Actions dropdown → Delete

**Behavior:**
- Deletes key type and all associated copies
- Cascade deletes issue records
- Confirms deletion (should add confirmation dialog for safety)

#### Add Copy

**Trigger:** Actions dropdown → Add Copy

**Behavior:**
- Adds one new copy to the key type
- Copy number is next sequential number (max + 1)
- New copy starts with AVAILABLE status
- Instant server action (no dialog)

---

## Expandable Copy Details ✅ NEW FEATURE

### Overview

Each key type row can be expanded to show detailed information about individual copies and perform quick actions.

### User Interaction

**Expand/Collapse:**
- Click the chevron icon (◀/▼) in the first column
- Only visible for key types with at least one copy
- Click again to collapse

**Expanded View Shows:**
- Copy number (e.g., "Copy #1", "Copy #2")
- Status badge (color-coded):
  - **Available** - Green badge
  - **In Use** - Amber badge
  - **Lost** - Red badge
- Quick action buttons based on status

### Quick Actions

#### Mark Lost (for AVAILABLE copies)

**Trigger:** "Mark Lost" button in expanded row

**Behavior:**
- Updates copy status from AVAILABLE to LOST
- No confirmation dialog (instant action)
- Use when a copy is lost while in storage
- Revalidates `/keys` and `/active-loans`

**Business Logic:**
- Only available for AVAILABLE copies
- Cannot mark IN USE copies as lost (must return first)
- Cannot mark already LOST copies

#### Mark Found (for LOST copies)

**Trigger:** "Mark Found" button in expanded row

**Behavior:**
- Updates copy status from LOST to AVAILABLE
- No confirmation dialog (instant action)
- Use when a lost copy is recovered
- Revalidates `/keys` and `/active-loans`

**Business Logic:**
- Only available for LOST copies
- Returns copy to circulation immediately

#### In Use Copies

**Display:**
- No action button shown
- Status badge shows "In Use"
- Future enhancement: Show borrower name and due date

---

## Technical Implementation

### Data Fetching

**Server Component:** `app/(dashboard)/keys/page.tsx`

```typescript
async function getKeyTypes() {
  const userId = await getCurrentUserId();
  const keyTypes = await prisma.keyType.findMany({
    where: { userId },
    orderBy: [{ label: 'asc' }],
    include: {
      keyCopies: {
        select: { id: true, copyNumber: true, status: true },
        orderBy: { copyNumber: 'asc' },
      },
    },
  });
  // Returns full copy details with status
}
```

**Key Points:**
- Fetches all copy details server-side (no client-side fetching)
- Includes full status information for instant expansion
- Ordered by copy number for consistent display

### Components

**Main Table:** `components/keys/key-types-table.tsx`
- Manages expanded state (Set<string> of key type IDs)
- Toggles expansion on chevron click
- Passes expanded state and actions to columns

**Column Definitions:** `components/keys/key-type-columns.tsx`
- Chevron column (first column)
- Shows IconChevronRight when collapsed, IconChevronDown when expanded
- Only visible if key type has copies
- Passes all necessary props to ExpandedCopiesRow

**Expanded Row Component:** `ExpandedCopiesRow` in `key-type-columns.tsx`
- Renders as separate table row with full colspan
- Maps over copies array
- Displays copy number, status badge, and action button
- Form-based actions with hidden copyId input

### Server Actions

**File:** `app/actions/keyTypes.ts`

```typescript
// Mark AVAILABLE copy as LOST
export async function markAvailableCopyLost(copyId: string)

// Mark LOST copy as FOUND (AVAILABLE)
export async function markLostCopyFound(copyId: string)
```

**Wrapper Actions:** `app/(dashboard)/keys/page.tsx`

```typescript
async function markLostAction(formData: FormData)
async function markFoundAction(formData: FormData)
```

**Validation:**
- Verifies copy belongs to current user
- Checks current status matches expected status
- Returns error if status is incorrect

**Revalidation:**
- `/keys` - Updates table and charts
- `/active-loans` - Updates borrower table if needed

---

## Database Schema

### KeyType

```prisma
model KeyType {
  id         String     @id @default(uuid())
  label      String     // 2 chars max, e.g., "A1"
  function   String     // Description, e.g., "Main entrance"
  accessArea String?    // Optional, e.g., "Lobby"
  userId     String     // Cooperative isolation
  keyCopies  KeyCopy[]  // One-to-many
}
```

### KeyCopy

```prisma
model KeyCopy {
  id           String        @id @default(uuid())
  copyNumber   Int           // Sequential: 1, 2, 3...
  status       KeyStatus     // AVAILABLE | OUT | LOST
  keyTypeId    String
  keyType      KeyType       @relation(...)
  issueRecords IssueRecord[] // One-to-many
}

enum KeyStatus {
  AVAILABLE
  OUT
  LOST
}
```

---

## Status State Machine

```
AVAILABLE ──┐
    ▲       │
    │       │ Issue Key
    │       │
    │       ▼
    │      OUT
    │       │
    │       │ Return Key
    └───────┘

AVAILABLE ──┐
    ▲       │
    │       │ Mark Lost
    │       │
    │       ▼
    │     LOST
    │       │
    │       │ Mark Found
    └───────┘
```

**Valid Transitions:**
- AVAILABLE → OUT (via Issue Key workflow)
- OUT → AVAILABLE (via Return Key workflow)
- AVAILABLE → LOST (via Mark Lost action)
- LOST → AVAILABLE (via Mark Found action)

**Invalid Transitions:**
- OUT → LOST (must return first, then mark lost)
- LOST → OUT (must mark found first, then issue)

---

## Testing Checklist

### Expandable Rows

- [ ] Chevron icon appears only for key types with copies
- [ ] Chevron icon disappears when key type has 0 copies
- [ ] Click chevron expands row showing copies
- [ ] Click chevron again collapses row
- [ ] Expanded row shows correct copy numbers
- [ ] Status badges have correct colors and text:
  - [ ] Green for AVAILABLE ("Available")
  - [ ] Amber for OUT ("In Use")
  - [ ] Red for LOST ("Lost")

### Mark Lost Action

- [ ] "Mark Lost" button appears for AVAILABLE copies
- [ ] "Mark Lost" button does not appear for IN USE copies
- [ ] "Mark Lost" button does not appear for LOST copies
- [ ] Clicking "Mark Lost" updates copy status to LOST
- [ ] Status badge changes to red after marking lost
- [ ] Action button changes to "Mark Found"
- [ ] Key charts update to reflect new LOST status
- [ ] No confirmation dialog (instant action)

### Mark Found Action

- [ ] "Mark Found" button appears for LOST copies
- [ ] "Mark Found" button does not appear for AVAILABLE copies
- [ ] "Mark Found" button does not appear for IN USE copies
- [ ] Clicking "Mark Found" updates copy status to AVAILABLE
- [ ] Status badge changes to green after marking found
- [ ] Action button changes to "Mark Lost"
- [ ] Key charts update to reflect new AVAILABLE status
- [ ] Copy becomes available for issuing

### Integration Testing

- [ ] Mark copy lost → Charts reflect change
- [ ] Mark copy found → Charts reflect change
- [ ] Mark copy lost → Cannot issue this copy
- [ ] Mark copy found → Can issue this copy
- [ ] Expand multiple rows simultaneously
- [ ] Collapse all rows and reopen
- [ ] Filter table while rows are expanded
- [ ] Sort table while rows are expanded
- [ ] Paginate while rows are expanded

### Error Handling

- [ ] Try to mark IN USE copy as lost (should fail gracefully)
- [ ] Try to mark AVAILABLE copy as found (should fail gracefully)
- [ ] Network error during action (should show error message)
- [ ] Verify user can only mark their own copies

---

## User Experience Notes

### Design Decisions

1. **Chevron-only expansion** - Clicking chevron is more intentional than clicking anywhere in row, prevents accidental expansion when trying to select text or open dropdown menu.

2. **No confirmation dialogs** - Mark Lost/Found actions are instant because:
   - They are reversible (Mark Lost ↔ Mark Found)
   - They don't delete data
   - They don't affect borrowers
   - Quick actions are needed for daily operations

3. **Server-side data fetching** - All copy details are fetched on page load:
   - Instant expansion with no loading delay
   - Minimal extra payload (~50 bytes per copy)
   - Simpler implementation
   - Better for typical use cases (10-50 keys × 2-5 copies)

4. **Color-coded badges** - Immediate visual status recognition:
   - Green = good (available for use)
   - Amber = neutral (in use by borrower, expected state)
   - Red = attention needed (lost, requires action)

5. **Minimal copy information** - Only show essential fields in expanded view:
   - Copy number (identity)
   - Status (current state)
   - Action button (next step)
   - Future: Add borrower name and due date for IN USE copies

### Performance Considerations

**Page Load:**
- Extra data: ~50 bytes × number of copies
- Example: 50 keys × 3 copies = 7.5 KB extra
- Negligible impact on modern connections

**Expansion:**
- Instant (no API calls)
- Pure client-side state management
- No re-rendering of other rows

**Actions:**
- Server action triggers revalidation
- Full page data refresh
- Expanded state preserved during refresh (future enhancement)

---

## Completed Enhancements

### Phase 1: Basic Expandable Rows ✅
- [x] Expandable rows with chevron icon
- [x] Status badges (Available/In Use/Lost)
- [x] Mark Lost action for AVAILABLE copies
- [x] Mark Found action for LOST copies

### Phase 2: View Borrower Link ✅
- [x] Show borrower name for IN USE copies
- [x] "View →" link to navigate to Active Loans
- [x] Smart pagination navigation
- [x] Smooth scroll with highlight animation

## Future Enhancements

### Phase 3: Enhanced IN USE Copy Display (Next Priority)

- [ ] Show due date for IN USE copies
- [ ] Show overdue indicator for IN USE copies (red badge)
- [ ] Show days remaining / days overdue
- [ ] Click copy to see full history

### Bulk Actions

- [ ] Mark multiple copies lost at once
- [ ] Mark multiple copies found at once
- [ ] Select all copies checkbox

### Advanced Features

- [ ] Copy history (show past issue/return events)
- [ ] Notes per copy (damage reports, etc.)
- [ ] Copy replacement workflow
- [ ] QR code generation per copy
- [ ] Physical location tracking per copy

### UX Improvements

- [ ] Preserve expanded state after actions
- [ ] Keyboard shortcuts (Space to expand/collapse)
- [ ] Expand all / Collapse all buttons
- [ ] Search within expanded rows
- [ ] Export copy inventory to CSV

---

## Summary

The expandable copy details feature provides:

✅ Quick access to individual copy information
✅ Instant status visibility with color-coded badges
✅ Fast actions for marking copies lost/found
✅ No page navigation required
✅ Server-side data fetching for instant expansion
✅ Transaction-safe status updates
✅ User isolation and security

This feature complements the existing Issue/Return workflows by providing direct copy management when keys are not actively loaned out.

