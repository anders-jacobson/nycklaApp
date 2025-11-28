# UI Components Guide

This document describes the custom UI components and patterns used in the application.

## ResponsiveDialog Component

### Overview

The `ResponsiveDialog` component is a responsive wrapper that automatically renders:
- **Dialog** on desktop (≥ 768px)
- **Drawer** on mobile (< 768px)

This provides a better mobile UX while maintaining desktop dialog behavior.

### Key Features

1. **Automatic Responsive Behavior** - No manual viewport detection needed
2. **Built-in Pointer-Events Cleanup** - Prevents body from staying locked after close
3. **Consistent API** - Same props work for both Dialog and Drawer
4. **Centralized Logic** - One component handles all responsive dialog needs

### Usage

```typescript
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';

function MyComponent() {
  const [open, setOpen] = useState(false);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title="Dialog Title"
      description="Optional description text"
      trigger={<Button>Open</Button>}  // Optional trigger
      footer={                          // Optional footer
        <>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </>
      }
    >
      <div>Your dialog content here</div>
    </ResponsiveDialog>
  );
}
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `open` | `boolean` | ✅ | Controls dialog open/close state |
| `onOpenChange` | `(open: boolean) => void` | ✅ | Callback when dialog state changes |
| `title` | `string` | ❌ | Dialog/Drawer title |
| `description` | `string \| ReactNode` | ❌ | Dialog/Drawer description |
| `children` | `ReactNode` | ✅ | Content to display |
| `trigger` | `ReactNode` | ❌ | Button/element to trigger dialog |
| `footer` | `ReactNode` | ❌ | Footer content (buttons, etc.) |
| `showCloseButton` | `boolean` | ❌ | Show close button (default: true) |

### Examples

#### Basic Dialog

```typescript
<ResponsiveDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Confirm Action"
  description="Are you sure you want to proceed?"
>
  <p>This action cannot be undone.</p>
</ResponsiveDialog>
```

#### Form Dialog with Footer

```typescript
<ResponsiveDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Create Organisation"
  description="Enter the name of your new organisation."
  footer={
    <>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button type="submit" form="org-form">
        Create
      </Button>
    </>
  }
>
  <form id="org-form" onSubmit={handleSubmit}>
    <Label htmlFor="name">Name</Label>
    <Input id="name" value={name} onChange={e => setName(e.target.value)} />
  </form>
</ResponsiveDialog>
```

#### With Trigger Button

```typescript
<ResponsiveDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Borrower Purpose"
  description="Why this borrower needs key access."
  trigger={
    <Button variant="ghost" size="icon">
      <IconInfoCircle className="h-4 w-4" />
    </Button>
  }
  footer={<Button onClick={handleSave}>Save</Button>}
>
  <Textarea value={purpose} onChange={e => setPurpose(e.target.value)} />
</ResponsiveDialog>
```

### Migrated Dialogs

The following dialogs have been migrated to use ResponsiveDialog:

**Team Management:**
- `components/shared/team-switcher.tsx` - Create organisation dialog

**Borrower Actions:**
- `components/active-loans/dialogs/return-keys-dialog.tsx`
- `components/active-loans/dialogs/lost-key-dialog.tsx`
- `components/active-loans/dialogs/replace-key-dialog.tsx`

**Borrower Info:**
- `components/active-loans/borrower-columns-clean.tsx` - Affiliation info
- `components/active-loans/borrower-columns.tsx` - Affiliation info

### Implementation Details

#### Mobile Detection

Uses the `useIsMobile()` hook from `hooks/use-mobile.ts`:
- Breakpoint: 768px (matches Tailwind's `md:` breakpoint)
- Returns `true` for mobile, `false` for desktop
- Handles window resize events automatically

#### Pointer-Events Cleanup

Built-in cleanup logic prevents the body from staying locked after dialog closes:

```typescript
React.useEffect(() => {
  if (!open) {
    const cleanup = () => {
      document.body.style.pointerEvents = '';
      document.body.style.overflow = '';
    };
    const timer = setTimeout(cleanup, 250); // After animation
    return () => clearTimeout(timer);
  }
}, [open]);
```

This prevents the common issue where the body becomes unclickable after closing a dialog.

### When NOT to Use

Do not use ResponsiveDialog for:
- **UI Primitives** - Command palette, combobox dropdowns (use base Dialog)
- **Non-modal overlays** - Tooltips, popovers (use appropriate components)
- **Already mobile-optimized** - Components that work well on both sizes as-is

## shadcn/ui Components

The project uses [shadcn/ui](https://ui.shadcn.com/) for all UI components:

### Installation

```bash
npx shadcn@latest add [component-name]
```

### Component List

All components are in `components/ui/`:
- `button.tsx` - Button component (all variants)
- `input.tsx` - Text input fields
- `label.tsx` - Form labels
- `textarea.tsx` - Multi-line text input
- `checkbox.tsx` - Checkbox input
- `radio-group.tsx` - Radio button groups
- `select.tsx` - Select dropdowns
- `badge.tsx` - Status badges
- `table.tsx` - Data tables
- `dialog.tsx` - Base dialog (use ResponsiveDialog instead)
- `drawer.tsx` - Base drawer (used by ResponsiveDialog)
- `responsive-dialog.tsx` - **⭐ Use this for user dialogs**

### Icons

**ONLY use Tabler Icons:**

```typescript
import { IconPlus, IconCheck, IconX } from '@tabler/icons-react';

// ❌ Never use other icon libraries
import { PlusIcon } from 'lucide-react'; // NO
import { FaPlus } from 'react-icons/fa'; // NO
```

## Best Practices

1. **Always use ResponsiveDialog for user-facing dialogs** - Better mobile UX
2. **Use Tabler Icons exclusively** - Consistent icon style
3. **Follow shadcn/ui patterns** - Don't create custom UI primitives
4. **Keep dialogs focused** - One clear action per dialog
5. **Provide feedback** - Use loading states and toast notifications

## Related Documentation

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tabler Icons](https://tabler.io/icons)
- [Project Patterns](.cursor/rules/patterns.mdc)

---

**Last Updated**: January 2025  
**Next Review**: When adding new dialog types



