# Modern Cursor Rules Setup (.mdc format)

**UPDATED FOR CURRENT SETUP**: Next.js 15 + Tailwind CSS v4 + Tabler Icons + shadcn/ui

Create these files in `.cursor/rules/` directory:

## 1. `.cursor/rules/project-context.mdc`

```mdc
---
description: Core context for Swedish housing cooperative key management app
globs:
alwaysApply: true
---

# Key Management App Context

This is a Swedish housing cooperative key management app for nyckelansvariga (key managers) in bostadsrättsföreningar.

## Key Requirements
- Mobile-first web app using Next.js 15 + React 19 + TypeScript + Supabase
- Track physical keys, borrowers, and lending records
- Swedish context: pensioner-friendly UI, GDPR compliance
- Authentication: Email + Google OAuth via Supabase Auth
- UI: Tailwind CSS v4 + shadcn/ui components (MANDATORY)
- Icons: Tabler Icons ONLY (@tabler/icons-react)

## Core Features
1. Key lending/return workflow with server actions
2. Dashboard with stacked bar charts (recharts)
3. Key inventory management with Prisma ORM
4. Borrower tracking (separate table)
5. Mobile-responsive design with App Router

## Swedish Terms
- nyckelansvarig = key manager
- bostadsrättsförening = housing cooperative
- copies = key copies (physical duplicates)

## Technical Constraints
- No localStorage/sessionStorage (not supported in artifacts)
- EU data storage (GDPR compliance)
- Mobile-first responsive design
- Online-only (no offline capability)
- Server-side rendering for better performance

## Supabase Configuration
- **Organization**: test-ai-build (pxskhfvbsxtaaulctibz)
- **Project**: anders.ebrev@gmail.com's Project (fxrmufcdhibqojyodrdu)
- **Region**: EU North (Stockholm) - GDPR compliant
- **Database**: PostgreSQL 17.4

Reference: @PRD.md for complete requirements
```

## 2. `.cursor/rules/tech-stack.mdc`

````mdc
---
description: Technology stack and dependencies - CURRENT SETUP
globs:
alwaysApply: true
---

# Technology Stack - CURRENT SETUP

## Frontend Stack
- **Next.js 15** with TypeScript (strict mode) and App Router
- **React 19** with server components by default
- **Tailwind CSS v4** with @theme directive configuration
- **shadcn/ui** for ALL UI components (MANDATORY)
- **Tabler Icons** (@tabler/icons-react) for ALL icons (MANDATORY)
- **Recharts** for stacked bar charts and data visualization
- **TanStack Table** for data tables

## Backend & Database
- **Supabase** (PostgreSQL + Auth + Real-time)
- **Prisma** as ORM for type-safe database operations
- **Row Level Security (RLS)** for data isolation
- **EU servers** for GDPR compliance

## Key Dependencies - ACTUAL VERSIONS
```json
{
  "dependencies": {
    "next": "15.3.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.50.0",
    "@supabase/auth-helpers-nextjs": "^0.10.0",
    "@prisma/client": "^6.9.0",
    "prisma": "^6.9.0",
    "@tabler/icons-react": "^3.34.0",
    "@tanstack/react-table": "^8.21.3",
    "recharts": "^2.15.3",
    "tailwindcss": "^4",
    "@shadcn/ui": "^0.0.4",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.3.1"
  }
}
````

## Architecture Patterns

- **Next.js 15 App Router** with server components by default
- **Client components** for interactive features only
- **Custom hooks** for Supabase + Prisma operations
- **Server actions** for data mutations
- **Middleware** for authentication
- **Mobile-first responsive design**
- **TypeScript** for all files

## MANDATORY Component Usage

- NEVER use plain HTML elements
- ALWAYS use shadcn/ui components
- ONLY use Tabler Icons from @tabler/icons-react
- See ui-component-standards.mdc for complete guide

## File Structure (Next.js 15 App Router)

```
├── app/                    # App Router directory
│   ├── globals.css        # Global styles + Tailwind v4 @theme
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── (dashboard)/       # Route groups
│   ├── (root)/           # Route groups
│   ├── actions/          # Server actions
│   ├── api/              # API routes
│   └── auth/             # Authentication routes
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui components (mandatory)
│   ├── dashboard/       # Feature-specific components
│   └── root/            # Root layout components
├── lib/                 # Utility functions
├── hooks/               # Custom hooks
├── prisma/              # Prisma schema and migrations
└── middleware.ts        # Next.js middleware for auth
```

````

## 3. `.cursor/rules/ui-component-standards.mdc`
```mdc
---
description: MANDATORY UI component usage - shadcn/ui and Tabler Icons only
globs: ["**/*.tsx", "**/*.ts"]
alwaysApply: true
---

# UI Component Standards - MANDATORY

## 🚨 CRITICAL RULE: NEVER USE PLAIN HTML ELEMENTS

### ❌ FORBIDDEN
```typescript
<button>Click me</button>      // NEVER
<input type="text" />          // NEVER
<table>...</table>             // NEVER
<select>...</select>           // NEVER
````

### ✅ REQUIRED

```typescript
// ALWAYS use shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';

<Button>Click me</Button>
<Input />
<Table>...</Table>
<Select>...</Select>
```

## Icon Library - ONLY Tabler Icons

### ❌ FORBIDDEN Icon Libraries

```typescript
import { Plus } from 'lucide-react'; // ❌ NO
import { FaPlus } from 'react-icons/fa'; // ❌ NO
```

### ✅ REQUIRED - Tabler Icons Only

```typescript
import { IconPlus, IconTrash, IconEdit, IconFilter } from '@tabler/icons-react';

<IconPlus className="h-4 w-4" />
<Button className="gap-1">
  <IconPlus className="h-3.5 w-3.5" />
  Add Item
</Button>
```

## Complete Component Usage Guide

See full ui-component-standards.mdc for detailed patterns.

````

## 4. `.cursor/rules/database-schema.mdc`
```mdc
---
description: Database schema and Prisma operations for key management
globs: ["**/*prisma*", "**/*database*", "**/*schema*"]
alwaysApply: false
---

# Database Schema - Prisma + Supabase

## Core Tables

### key_types (Prisma Model: KeyType)
```prisma
model KeyType {
  id            String     @id @default(cuid())
  name          String
  accessArea    String?
  totalCopies   Int        @default(0)
  cooperativeId String
  createdAt     DateTime   @default(now())
  keyCopies     KeyCopy[]

  @@map("key_types")
}
````

### key_copies (Prisma Model: KeyCopy)

```prisma
model KeyCopy {
  id           String          @id @default(cuid())
  keyTypeId    String
  copyNumber   Int
  status       KeyCopyStatus   @default(AVAILABLE)
  createdAt    DateTime        @default(now())
  keyType      KeyType         @relation(fields: [keyTypeId], references: [id], onDelete: Cascade)
  lendingRecords LendingRecord[]

  @@unique([keyTypeId, copyNumber])
  @@map("key_copies")
}

enum KeyCopyStatus {
  AVAILABLE
  OUT
  LOST
}
```

### borrowers (Prisma Model: Borrower)

```prisma
model Borrower {
  id            String          @id @default(cuid())
  name          String
  email         String?
  phone         String?
  company       String?
  cooperativeId String
  createdAt     DateTime        @default(now())
  lendingRecords LendingRecord[]

  @@map("borrowers")
}
```

### lending_records (Prisma Model: LendingRecord)

```prisma
model LendingRecord {
  id            String    @id @default(cuid())
  keyCopyId     String
  borrowerId    String
  lentDate      DateTime  @default(now())
  dueDate       DateTime?
  notes         String?
  idChecked     Boolean   @default(false)
  returnedDate  DateTime?
  cooperativeId String
  createdAt     DateTime  @default(now())
  keyCopy       KeyCopy   @relation(fields: [keyCopyId], references: [id], onDelete: Cascade)
  borrower      Borrower  @relation(fields: [borrowerId], references: [id], onDelete: Cascade)

  @@map("lending_records")
}
```

## TypeScript Types (Generated by Prisma)

```typescript
import { KeyType, KeyCopy, Borrower, LendingRecord, KeyCopyStatus } from '@prisma/client';

// Extended types with relations
type KeyTypeWithCopies = KeyType & {
  keyCopies: KeyCopy[];
};

type LendingRecordWithRelations = LendingRecord & {
  keyCopy: KeyCopy & { keyType: KeyType };
  borrower: Borrower;
};
```

## Prisma Client Usage

```typescript
import { prisma } from '@/lib/prisma';

// Always include relations for dashboard data
const keyTypesWithCopies = await prisma.keyType.findMany({
  where: { cooperativeId },
  include: {
    keyCopies: true,
  },
});

// Transaction for creating key type with copies
const result = await prisma.$transaction(async (tx) => {
  const keyType = await tx.keyType.create({ data: keyTypeData });

  if (totalCopies > 0) {
    const copies = Array.from({ length: totalCopies }, (_, i) => ({
      keyTypeId: keyType.id,
      copyNumber: i + 1,
      status: 'AVAILABLE' as const,
    }));

    await tx.keyCopy.createMany({ data: copies });
  }

  return keyType;
});
```

````

## 5. `.cursor/rules/coding-standards.mdc`
```mdc
---
description: Development patterns for Next.js 15 + shadcn/ui + Tabler Icons
globs: ["**/*.tsx", "**/*.ts"]
alwaysApply: true
---

# Coding Standards - UPDATED FOR CURRENT SETUP

## MANDATORY Component Usage (Critical)

### ❌ NEVER Use Plain HTML
```typescript
<button onClick={handleClick}>Click</button>   // FORBIDDEN
<input type="text" />                          // FORBIDDEN
<table><tr><td>Data</td></tr></table>         // FORBIDDEN
````

### ✅ ALWAYS Use shadcn/ui + Tabler Icons

```typescript
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IconPlus, IconTrash } from '@tabler/icons-react';

<Button onClick={handleClick} className="gap-1">
  <IconPlus className="h-3.5 w-3.5" />
  Click me
</Button>
<Input />
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Data</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

## Server Component Structure (Next.js 15)

```typescript
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ServerPage({ params, searchParams }: PageProps) {
  const data = await prisma.keyType.findMany({
    where: { cooperativeId: params.id },
    include: { keyCopies: true }
  });

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Key Management</CardTitle>
        </CardHeader>
        <CardContent>
          <KeyDashboard data={data} />
        </CardContent>
      </Card>
    </div>
  );
}
```

## Client Component Structure

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IconPlus, IconLoader } from '@tabler/icons-react';

interface Props {
  data: KeyType[];
  onUpdate?: (data: KeyType) => void;
}

export default function ClientComponent({ data, onUpdate }: Props) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      const result = await createKeyType(formData);
      if (result.success) {
        onUpdate?.(result.data);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <IconLoader className="h-4 w-4 animate-spin" />
        Loading...
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Key Type</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <Input placeholder="Key name..." name="name" required />
          <Button type="submit" className="gap-1">
            <IconPlus className="h-3.5 w-3.5" />
            Add Key Type
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

## Tailwind CSS v4 Configuration

### CSS Configuration (app/globals.css)

```css
@import 'tailwindcss';

@theme {
  --radius: 0.65rem;
  --color-primary: var(--primary);
  --color-secondary: var(--secondary);
  /* All theme configuration here */
}
```

### JavaScript Config (tailwind.config.js)

```javascript
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

const config = {
  plugins: [forms, typography], // Only plugins
};

export default config;
```

## Data Table Pattern (TanStack Table + shadcn/ui)

```typescript
'use client';

import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { IconFilter, IconPlus } from '@tabler/icons-react';

export function DataTable({ columns, data }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input placeholder="Filter..." className="max-w-xs" />
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-1">
                <IconFilter className="h-3.5 w-3.5" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {/* Filter options */}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button className="gap-1">
            <IconPlus className="h-3.5 w-3.5" />
            Add Item
          </Button>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

```

This updated configuration reflects your actual current setup with Next.js 15, React 19, Tailwind CSS v4, shadcn/ui, and Tabler Icons.
```
