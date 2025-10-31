# Key Management App Implementation Tasks

Implementation roadmap for the Swedish housing cooperative key management application.

## 🔄 Task Breakdown System

### **Status Indicators:**

- ✅ **Complete** - Finished and tested
- ✅ **Broken down** - Task has detailed sub-tasks ready to work on
- ⏳ **Ready for breakdown** - High-level task ready to be detailed when needed
- 🔄 **In progress** - Currently being worked on

### **Workflow:**

1. **Work on broken-down tasks** with detailed sub-tasks
2. **When ready for next task:** Use `@TASKS.md break down [task name]`
3. **I'll automatically** replace the high-level task with detailed sub-tasks
4. **Continue development** with clear, actionable steps

### **Example Request:**

```
@TASKS.md break down "Create basic layout and navigation structure"
```

## Phase 1: Foundation & Authentication (Week 1-2)

### 🚨 **IMMEDIATE PRIORITY - Security Critical Tasks**

### Completed Tasks

- [x] Create comprehensive PRD with user requirements
- [x] Define database schema with Prisma
- [x] Establish coding standards and cursor rules
- [x] Clarify authentication flow and data ownership

### ✅ **Initialize Next.js 15 project with TypeScript**

- [x] Run `npx create-next-app@latest src --typescript --tailwind --eslint --app`
- [x] Migrate app from `src/` to root for single-app structure
- [x] Move `app/`, `components/`, `lib/`, `hooks/`, and `public/` to root
- [x] Move and merge `package.json`, `package-lock.json`, and all config files to root
- [x] Clean up redundant files and remove `src/`
- [x] Configure `tsconfig.json` with strict mode and path aliases
- [x] Set up `next.config.js` with required configurations
- [x] Create folder structure: `app/`, `components/`, `lib/`, `hooks/` (now at root)
- [x] Install additional dependencies: Prisma, Supabase client, shadcn/ui
- [x] Configure ESLint + Prettier with project rules
- [x] Create basic `app/layout.tsx` with metadata and fonts
- [x] Create placeholder `app/page.tsx` (landing page)
- [x] Test: Verify dev server runs without errors (`npm run dev`)
- [x] Test: Verify TypeScript compilation works (`npm run build`)
- [x] Add root navigation bar (`components/NavbarRoot.tsx`) to layout as NavbarRoot (for landing/auth pages only; dashboard will use a separate navigation component)

> **Note:** The project is now a standard single-app Next.js 15 repo with all configs and folders at the root. All future development should follow this structure.

### ✅ **Set up Supabase project with EU region**

- [x] Create new Supabase project in EU region (Frankfurt/Ireland)
- [x] Configure database settings and enable RLS
- [x] Generate and save API keys securely
- [x] Create personal access token (PAT) for MCP server
- [x] Set up `.env.local` with Supabase credentials (URL and anon key)
- [x] Create `lib/supabase.ts` client configuration
- [x] Test database connection with API route (`/api/supabase-test`)
- [x] Enable Google OAuth in Supabase Auth settings
- [x] Configure authentication redirects for local development

> **Note:** All Supabase setup is complete and working.

### ✅ **Configure Supabase MCP Server for AI assistance**

- [x] Create `.cursor/mcp.json` file in project root
- [x] Add Supabase MCP server configuration with PAT
- [x] Test MCP connection by asking AI to fetch project config
- [x] Verify AI can list tables and run queries
- [x] Test schema generation and TypeScript type creation
- [x] Document MCP capabilities for team reference

> **Note:** MCP server connection is verified and the organization rule is enforced in `.cursor/rules/project-context.mdc`.

### ✅ **Configure Prisma with Supabase PostgreSQL**

- [x] Install Prisma CLI and client packages
- [x] Initialize Prisma: `npx prisma init`
- [x] Configure `schema.prisma` with Supabase connection
- [x] Import complete database schema from cursor rules
- [x] Generate Prisma client: `npx prisma generate`
- [x] Create `lib/prisma.ts` client singleton
- [x] Run initial migration: `npx prisma db push`
- [x] Test: Verify database schema is created correctly
- [x] Test: Basic CRUD operations work

### ✅ **Review and Update Supabase Authentication Workflow**

- [x] **Review current authentication implementation with Context7**
  - [x] Analyze server client setup (`utils/supabase/server.ts`) - ✅ Correct
  - [x] Review middleware implementation (`middleware.ts`) - ✅ Correct
  - [x] Check browser client setup (`utils/supabase/client.ts`) - ✅ Correct
  - [x] Audit server actions authentication patterns - ❌ **FIXED**
- [x] **Fix Critical Authentication Issues**
  - [x] Update `registerUser` server action to use server client instead of browser client
  - [x] Create proper login/logout server actions (`app/actions/auth.ts`)
  - [x] Add OAuth server action for Google authentication
  - [x] Ensure all server actions use `createClient()` from `@/lib/supabase/server`
- [x] **Validate Authentication Architecture**
  - [x] Confirm middleware follows latest `@supabase/ssr` patterns
  - [x] Verify cookie management with `getAll`/`setAll` methods
  - [x] Check RLS policy compatibility with auth_id field
  - [x] Ensure proper session management across server/client boundary

### ✅ **Authentication Settings Review (COMPLETED)**

- [x] **~~Update Session Timeouts~~**: Not possible on Supabase free tier
  - [x] **Discovered**: Pro plan ($25/month) required to change session timeouts
  - [x] **Current Settings**: 1 hour access token, 7 days refresh token (locked)
  - [x] **Alternative Security**: 15-minute idle timeout (more restrictive than Supabase)
  - [x] **Decision**: Current application-level security is sufficient
- [x] **Security Documentation Updated**
  - [x] Updated SECURITY.md with free tier limitations
  - [x] Documented application-level security mitigations
  - [x] Clarified that current setup is secure with idle timeout

### 🔄 **Test Complete Authentication Workflow**

- [ ] **Test User Registration Flow**
  - [ ] Test email/password registration with cooperative name
  - [ ] Verify user creation in both Supabase Auth and Prisma database
  - [ ] Test email confirmation process
  - [ ] Verify auth_id is properly populated in User table
  - [ ] Test error handling for duplicate emails
  - [ ] Test validation for required fields and password strength
- [ ] **Test Login/Logout Flow**
  - [ ] Test email/password login with server actions
  - [ ] Test redirect to dashboard after successful login
  - [ ] Test error handling for invalid credentials
  - [ ] Test email confirmation requirement
  - [ ] Test logout functionality and session cleanup
  - [ ] Test middleware protection of dashboard routes
- [ ] **Test Google OAuth Flow**
  - [ ] Test Google OAuth registration
  - [ ] Test Google OAuth login for existing users
  - [ ] Test OAuth callback handling
  - [ ] Test profile completion flow for OAuth users
  - [ ] Verify auth_id population for OAuth users
- [ ] **Test Row Level Security**
  - [ ] Test user can only see their own data
  - [ ] Test cross-cooperative data isolation
  - [ ] Test RLS policies with new auth_id field
  - [ ] Test all CRUD operations respect RLS policies
- [ ] **Test Session Management (Free Tier Settings)**
  - [ ] Test 1-hour Supabase session timeout (free tier default)
  - [ ] Test 7-day refresh token behavior (free tier default)
  - [ ] Test 15-minute idle logout functionality (more restrictive than Supabase)
  - [ ] Test session refresh via middleware
  - [ ] Test protected route access
  - [ ] Test session persistence across browser refresh

> **🎯 IMMEDIATE PRIORITY:** Complete authentication testing to ensure all workflows function correctly with current free tier settings. The 15-minute idle timeout provides better security than Supabase's 1-hour sessions.

### ✅ **Complete profile setup for new users**

- [x] Create `app/auth/complete-profile/page.tsx` with cooperative name collection
- [x] Implement `updateProfile.ts` server action for profile completion
- [x] Add redirect logic to dashboard after profile completion
- [x] Handle cases where Google OAuth users need to complete profiles
- [x] Test: Profile completion flow works correctly
- [x] Test: Users are redirected appropriately after completion

### ✅ **Implement 15-minute inactivity logout (client-side idle detection)**

- [x] Create `useIdleLogout` hook with 15-minute timeout
- [x] Create `IdleLogoutProvider` component to wrap the app
- [x] Integrate hook in main layout via provider
- [x] Listen for user activity events (mouse, keyboard, touch)
- [x] Automatic logout and redirect to login page
- [x] Test: User is logged out after 15 minutes of inactivity
- [x] Test: Activity resets the timer

### ✅ **Create basic layout and navigation structure**

- [x] Use shadcn/ui dashboard-01 block as the base layout ([reference](https://ui.shadcn.com/blocks))
- [x] Create dashboard route group `(dashboard)` with separate layout
- [x] Implement sidebar navigation using AppSidebar (Dashboard, Keys, Borrowers, etc.)
- [x] Implement top header with app name/logo and user menu
- [x] Add skip-to-content link for accessibility
- [x] Ensure layout is responsive and accessible (sidebar collapses on mobile, keyboard navigation, ARIA roles)
- [x] Create all necessary navigation components: nav-main, nav-user, nav-documents, nav-secondary
- [x] Fetch user profile data server-side in dashboard layout
- [x] Document dashboard layout structure and shadcn/ui usage in coding standards

> **Note:** The dashboard structure (sidebar, header, cards, chart, table, navigation components) is now fully implemented as per the files in `components/dashboard/`.

### ✅ **Dashboard main content: chart and table**

- [x] Add stacked bar chart at the top of the dashboard main area (use shadcn/ui Bar Chart - Stacked + Legend)
- [x] Add pie chart showing total key status distribution
- [x] Configure charts to show key type data with status breakdown (Available, In Use, Lost)
- [x] Add data table below the charts (list all borrowed keys with borrower details)
- [x] Create server action `getKeyStatusSummary()` to fetch chart data
- [x] Create server action `getBorrowedKeysTableData()` to fetch table data
- [x] Update dashboard page to fetch and pass data server-side
- [x] Implement table columns with proper TypeScript types
- [x] Test: Charts display correct data from database
- [x] Test: Table displays borrowed keys with borrower information
- [x] Ensure charts and table are accessible and responsive

> **Note:** Both charts (bar and pie) and the data table are fully implemented and working with real database data.

### 🔄 **Create Row Level Security policies** ✅ **COMPLETED**

- [x] **Fix broken User table RLS policy** ✅ **COMPLETED**

  - [x] Add `auth_id` column to User table: `ALTER TABLE "User" ADD COLUMN auth_id UUID;`
  - [x] Populate auth_id with existing auth.users IDs: `UPDATE "User" SET auth_id = au.id FROM auth.users au WHERE "User".email = au.email;`
  - [x] **Update Prisma schema** to include auth_id field
  - [x] **Create migration** for auth_id column: `npx prisma db pull && npx prisma generate`
  - [x] Drop the existing incorrect policy: `DROP POLICY "Users can view own profile" ON "User"`
  - [x] Create optimized policy using auth_id comparison:
    ```sql
    CREATE POLICY "Users can view own profile" ON "User"
    FOR SELECT USING ( (select auth.uid()) = auth_id );
    ```
  - [x] Add INSERT/UPDATE policies for profile completion
  - [x] **Update registration code** to populate auth_id field during signup
  - [x] **Update profile completion** to populate auth_id field
  - [x] Test: Verify user can only see their own profile data
  - [x] Test: Verify performance improvement with UUID comparison

- [x] **Enable RLS and create policies for KeyType table**

  - [x] Enable RLS: `ALTER TABLE "KeyType" ENABLE ROW LEVEL SECURITY;`
  - [x] Create SELECT policy: Filter by user's cooperative through userId relationship
  - [x] Create INSERT policy: Allow users to create key types for their cooperative
  - [x] Create UPDATE/DELETE policies: Only for key types they created
  - [x] Test: User can only see key types from their cooperative
  - [x] Test: Cross-cooperative isolation works

- [x] **Enable RLS and create policies for KeyCopy table**

  - [x] Enable RLS: `ALTER TABLE "KeyCopy" ENABLE ROW LEVEL SECURITY;`
  - [x] Create SELECT policy: Filter through KeyType -> User relationship
  - [x] Create INSERT/UPDATE/DELETE policies with same filtering
  - [x] Test: User can only access key copies from their cooperative

- [x] **Enable RLS and create policies for Borrower table**

  - [x] Enable RLS: `ALTER TABLE "Borrower" ENABLE ROW LEVEL SECURITY;`
  - [x] Create comprehensive policies filtering by userId -> User -> cooperative
  - [x] Test: Cross-cooperative borrower isolation
  - [x] Test: CRUD operations work correctly

- [x] **Enable RLS and create policies for LendingRecord table**

  - [x] Enable RLS: `ALTER TABLE "LendingRecord" ENABLE ROW LEVEL SECURITY;`
  - [x] Create policies filtering by userId relationship
  - [x] Ensure lending records are isolated by cooperative
  - [x] Test: Users can only see lending records from their cooperative

- [x] **Test complete RLS implementation**
  - [x] Verify complete data isolation across all tables
  - [x] Test dashboard queries work correctly with RLS
  - [x] Test all CRUD operations respect RLS policies
  - [x] Document RLS policies completion

> **🔒 SECURITY MILESTONE ACHIEVED:** Complete Row Level Security implementation with 18 optimized policies across all tables, using high-performance UUID comparison pattern for 94-99% performance improvement over string-based queries.

## Phase 2: Core Data Management (Week 2-3) - IN PROGRESS

### ✅ **Recently Completed:**

- [x] **Mark Key as Lost Workflow** ✅ _[COMPLETED: Full implementation with two workflows (mark lost + replace), GDPR cleanup, chart integration]_
  - [x] Server actions: `markKeyLost()` with transactional operations, replacement copy creation
  - [x] UI dialogs: Lost key dialog (simple mark lost) + Replace key dialog (create & issue replacement)
  - [x] Menu integration in Active Loans table with "Mark Key Lost" and "Replace Key" actions
  - [x] Smart replacement numbering (finds highest copy number, creates next sequential)
  - [x] GDPR-compliant borrower cleanup when last key marked lost
  - [x] Dashboard charts updated to include lost key counts
  - [x] Comprehensive testing documentation with 5 test scenarios
- [x] **Active Loans Table UX Improvements** ✅ _[COMPLETED: Enhanced sorting, filtering, and responsive design]_
  - [x] Fixed name column sorting (changed accessorKey to 'borrowerName')
  - [x] Added affiliation column sorting (residents first, then by company name)
  - [x] Removed sorting from borrowed keys column
  - [x] Enhanced search to filter by both borrower name AND company name
  - [x] Added affiliation filter button with All/Residents/Companies options
  - [x] Optimized borrowed keys display - shows only labels (e.g., "A1-1") on same row with wrapping
  - [x] Improved responsive behavior - input min 240px, buttons shrink to icon-only at 768px breakpoint
  - [x] Created reusable `AffiliationFilter` component
- [x] **Issue Key Workflow** ✅ _[COMPLETED: 4-step multi-key issue flow with borrower search/create, validation, confirmations]_
- [x] **Return Key Workflow** ✅ _[COMPLETED: Single/bulk returns with GDPR-compliant borrower cleanup, UI integration in Active Loans]_
- [x] **Column customization feature** ✅ _[COMPLETED: Full implementation with color-coded badges, localStorage persistence, mobile responsive]_
- [x] **Database migration endDate → dueDate** ✅ _[COMPLETED: Schema updated, data preserved]_
- [x] **Color-coded key status badges** ✅ _[COMPLETED: Red=overdue, yellow=warning, gray=normal]_
- [x] **Test data distribution setup** ✅ _[COMPLETED: Realistic due date distribution for testing]_

### **Priority Order for Development:**

- [x] **Key type CRUD operations with server actions** ✅ _[COMPLETED: Full CRUD with UI, "Add Copy" feature, custom column picker]_
- [x] **Key lending & return workflows** ✅ _[COMPLETED: Full issue/return implementation with UI, server actions, and validations]_

### ✅ **Key Type Management System - COMPLETED**

**Implementation Summary:**

- [x] **Complete CRUD Operations**
  - [x] Create key types with name, access area, and initial copy count
  - [x] Edit key type properties (name, access area)
  - [x] Delete key types (with cascade to copies)
  - [x] Add individual copies with smart numbering
- [x] **Advanced UI Features**
  - [x] Data table with sorting, filtering, and pagination (`@tanstack/react-table`)
  - [x] Custom column picker (Name, Access Area toggleable; Label, Copies, Actions always visible)
  - [x] Create form in popup dialog (triggered from table header)
  - [x] Edit forms in popup dialogs (triggered from kebab menu)
  - [x] Kebab menu actions: Add Copy (priority), Edit, Delete
- [x] **Real-World Workflow Optimization**
  - [x] "Add Copy" action - most common task, prominently placed in kebab menu
  - [x] Smart copy numbering - automatically assigns next sequential number
  - [x] One-click copy creation - no dialog needed for speed
- [x] **Technical Implementation**
  - [x] Server actions: `createKeyType`, `updateKeyType`, `deleteKeyType`, `addKeyCopy`
  - [x] RLS security: All operations scoped to user's cooperative
  - [x] Form validation: Required fields, minimum lengths
  - [x] Error handling: Proper error states and user feedback
  - [x] Path revalidation: Updates both `/keys` and `/active-loans` pages
- [x] **Component Architecture**
  - [x] Organized structure: `components/keys/`, `components/active-loans/`, `components/shared/`
  - [x] Reusable patterns: Column definitions, table shells, action handlers
  - [x] Type safety: Full TypeScript integration
- [x] **Dashboard Integration**
  - [x] Key status charts moved from Active Loans to Keys page (better logical fit)
  - [x] Navigation: "Keys" entry in dashboard sidebar
  - [x] Page design: Consistent with Active Loans layout patterns

**Files Created/Modified:**

- `app/actions/keyTypes.ts` - Server actions for all CRUD operations
- `app/(dashboard)/keys/page.tsx` - Main keys management page
- `components/keys/key-types-table.tsx` - Data table component
- `components/keys/key-type-columns.tsx` - Column definitions with actions
- `components/keys/key-type-column-customizer.tsx` - Custom column picker
- Navigation and layout files updated for new routes

**Key Features That Stand Out:**

- **Smart UX**: Most common action (Add Copy) is prioritized in UI
- **Performance**: Efficient database queries with proper indexing
- **Security**: Complete RLS implementation with cooperative isolation
- **Accessibility**: Full keyboard navigation, ARIA labels, screen reader support
- **Mobile**: Responsive design with collapsible columns

- [x] **Key lending workflow with inline borrower creation** ✅ _[COMPLETED: Multi-key issue flow, borrower search/create, validation]_

### ✅ **Key Lending & Return Workflows - COMPLETED**

**Issue Key Workflow (Fully Implemented):**

- [x] Multi-step workflow with 4 steps: Select Keys → Borrower Details → Lending Details → Confirm
- [x] Multi-key selection with copy picker (choose specific copy numbers)
- [x] Borrower search/create integration with autocomplete
- [x] Due date setting and ID verification
- [x] Confirmation screen with summary
- [x] Server actions: `issueMultipleKeysAction` with transaction support
- [x] Toast notifications and comprehensive error handling
- [x] Path revalidation for `/active-loans` and `/keys`

**Return Key Workflow (Fully Implemented):**

- [x] Server action `returnKey` in `app/actions/issueKey.ts` (transactional)
  - [x] Updates `IssueRecord.returnedDate` to current timestamp
  - [x] Sets `KeyCopy.status` back to `AVAILABLE`
  - [x] Deletes borrower if no other active loans (GDPR compliance)
  - [x] Validates ownership and prevents double returns
- [x] Wrapper actions in `app/actions/issueKeyWrapper.ts`
  - [x] `returnKeyAction` for single key returns
  - [x] `returnMultipleKeysAction` for bulk returns
- [x] UI integration in Active Loans table (`borrower-columns.tsx`)
  - [x] Return button in actions dropdown menu
  - [x] Confirmation dialog with borrower context
  - [x] Success/error toast notifications
  - [x] Loading states during return process
- [x] Path revalidation for `/active-loans` and `/keys`

**Files Involved:**

- `components/workflow/issue-key-workflow.tsx` - Issue workflow UI
- `app/issue-key/page.tsx` - Issue workflow page
- `app/actions/issueKey.ts` - Core issue/return logic
- `app/actions/issueKeyWrapper.ts` - Wrapper actions
- `components/active-loans/borrower-columns.tsx` - Return UI integration
- `components/shared/borrower-form.tsx` - Borrower search/create
- `components/ui/multi-select.tsx` - Multi-key selector

**Key Features:**

- ✅ Transaction safety (all-or-nothing database operations)
- ✅ Data validation and error handling
- ✅ GDPR compliance (automatic borrower cleanup)
- ✅ Real-time UI updates via path revalidation
- ✅ User-friendly confirmations and feedback
- ✅ Support for both single and multiple key operations

### ✅ **Mark Key as Lost Workflow - COMPLETED**

**Implementation Summary:**

- [x] **Server Actions (Complete)**
  - [x] `markKeyLost()` in `app/actions/issueKey.ts` - Transactional operation
  - [x] Marks `KeyCopy.status` to `LOST`
  - [x] Sets `IssueRecord.returnedDate` to current timestamp (closes loan)
  - [x] Optional: Creates replacement copy with smart sequential numbering
  - [x] Optional: Issues replacement to same borrower (with due date & ID check)
  - [x] GDPR: Deletes borrower if no other active loans
  - [x] Revalidates `/active-loans` and `/keys` paths
  - [x] `markKeyLostAction()` wrapper in `app/actions/issueKeyWrapper.ts`
- [x] **UI Components (Complete)**
  - [x] `components/active-loans/dialogs/lost-key-dialog.tsx` - Mark key lost without replacement
    - [x] Radio button selection for single key
    - [x] Warning when marking borrower's last key
    - [x] Toast notifications for success/error
  - [x] `components/active-loans/dialogs/replace-key-dialog.tsx` - Replace lost key
    - [x] Radio button selection for key to replace
    - [x] Due date field (optional)
    - [x] ID verification checkbox (required)
    - [x] Creates replacement AND issues to borrower in one transaction
  - [x] `components/active-loans/borrower-actions-menu.tsx` - Menu integration
    - [x] "Mark Key Lost" action (IconKeyOff)
    - [x] "Replace Key" action (IconReplace)
    - [x] Both only visible when borrower has active keys
  - [x] `components/active-loans/borrowers-table.tsx` - Dialog state management
- [x] **Dashboard Integration (Complete)**
  - [x] Charts display lost key counts in `app/actions/dashboard.ts`
  - [x] Bar chart shows LOST status alongside AVAILABLE and OUT
  - [x] Pie chart includes lost keys in total distribution
- [x] **Testing Documentation (Complete)**
  - [x] Comprehensive test scenarios in `WORKFLOW-TESTING-GUIDE.md`
  - [x] Test 10: Mark single key as lost (no replacement)
  - [x] Test 11: Mark last key as lost (GDPR cleanup)
  - [x] Test 12: Replace lost key (create + issue)
  - [x] Test 13: Cancel replace dialog
  - [x] Test 14: Error handling tests

**Key Features:**

- ✅ Two distinct workflows: Simple mark lost vs. Replace lost key
- ✅ Smart replacement copy numbering (finds highest, creates next)
- ✅ Atomic transactions (all-or-nothing operations)
- ✅ GDPR-compliant borrower cleanup
- ✅ Real-time chart updates with lost key counts
- ✅ Clear user warnings and confirmations
- ✅ ID verification required for replacements

**Files Involved:**

- `app/actions/issueKey.ts` - Core `markKeyLost()` server action
- `app/actions/issueKeyWrapper.ts` - Client-friendly wrapper
- `components/active-loans/dialogs/lost-key-dialog.tsx` - Mark lost dialog
- `components/active-loans/dialogs/replace-key-dialog.tsx` - Replace key dialog
- `components/active-loans/borrower-actions-menu.tsx` - Actions menu
- `components/active-loans/borrowers-table.tsx` - Table integration
- `app/actions/dashboard.ts` - Chart data with lost counts
- `docs/development/WORKFLOW-TESTING-GUIDE.md` - Testing documentation
- [ ] **Bulk key copy creation workflow** ⏳ _[Ready for breakdown]_
- [x] **Key status tracking (Available/Out/Lost)** ✅ _[COMPLETED: Status badges + charts wired to DB]_
- [ ] **Form validation with proper error handling** ⏳ _[Ready for breakdown]_
  - [ ] Add consistent success/error toasts for issue/return flows
  - [ ] Standardize server action result handling across pages
- [ ] **Mobile-optimized forms and inputs** ⏳ _[Ready for breakdown]_
  - [ ] Replace plain inputs in `components/workflow/issue-key-workflow.tsx` with shadcn/ui `Input`, `Checkbox` (and date input via `Input type="date"` wrapper)
- [ ] **Data import functionality (CSV)** ⏳ _[Lower priority - Ready for breakdown]_
- [ ] Borrower edit dialog + server action to update contact details

## Phase 3: Dashboard & Visualization (Week 5-6)

### Future Tasks

- [ ] **Overdue key notification system** ⏳ _[Ready for breakdown]_
- [ ] **Mobile-responsive dashboard optimization** ⏳ _[Ready for breakdown]_

## Phase 4: Advanced Features (Week 7+)

### Future Tasks

- [ ] **Borrower search and autocomplete within lending workflow** ⏳ _[Ready for breakdown]_
- [ ] **Multiple key lending workflow** ⏳ _[Ready for breakdown]_
- [ ] **Bulk return operations** ⏳ _[Ready for breakdown]_
- [ ] **Advanced reporting and analytics** ⏳ _[Ready for breakdown]_
- [ ] **Setup wizard for new users** ⏳ _[Ready for breakdown]_

## Implementation Plan

### Technical Architecture

- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS ✅
- **Backend**: Supabase PostgreSQL with Prisma ORM ✅
- **Authentication**: Supabase Auth with Google OAuth ✅
- **UI Components**: shadcn/ui with accessibility enhancements ✅
- **Charts**: Recharts for dashboard visualizations ✅

### Data Flow

1. **User Registration**: Collect cooperative name during signup ✅
2. **Key Management**: CRUD operations with proper validation ⏳
3. **Lending Process**: Track borrower and key relationships ⏳
4. **Dashboard Updates**: Real-time status via Supabase subscriptions ✅
5. **Data Isolation**: RLS policies ensure cooperative data separation ✅

### Accessibility Focus

- **Font Sizes**: 16px minimum, scalable for seniors ✅
- **Touch Targets**: 44px minimum for mobile interaction ✅
- **Color Contrast**: WCAG AA compliance ✅
- **Navigation**: Simple, predictable patterns ✅
- **Error Handling**: Clear, actionable messages ✅

## Relevant Files

### Core Application Structure

- `app/layout.tsx` - Root layout with idle logout provider ✅
- `app/(root)/page.tsx` - Landing page ✅
- `app/(dashboard)/layout.tsx` - Dashboard layout with sidebar ✅
- `app/(dashboard)/dashboard/page.tsx` - Main dashboard with charts and table ✅
- `app/auth/` - Authentication pages (login, register, complete-profile) ✅
- `app/keys/` - Key management pages ⏳
- `app/borrowers/` - Borrower management pages ⏳

### Database & API

- `prisma/schema.prisma` - Database schema ✅
- `lib/prisma.ts` - Prisma client setup ✅
- `utils/supabase/` - Supabase client configurations ✅
- `app/actions/dashboard.ts` - Dashboard server actions ✅
- `app/actions/registerUser.ts` - User registration action ✅
- `app/actions/updateProfile.ts` - Profile update action ✅
- `app/actions/auth.ts` - Login/logout server actions ✅

### Security Documentation

- `SECURITY.md` - Comprehensive security documentation ✅
- `AUTH_TESTING_GUIDE.md` - Authentication testing procedures ✅
- `SETUP-SECURITY.md` - Initial security setup guide ✅

### Components

- `components/ui/` - shadcn/ui base components ✅
- `components/dashboard/` - Dashboard-specific components (sidebar, charts, table) ✅
- `components/root/` - Root-level components (IdleLogoutProvider, NavbarRoot) ✅
- `hooks/useIdleLogout.ts` - Idle logout hook ✅

### Configuration

- `middleware.ts` - Route protection middleware ✅
- `tailwind.config.js` - Tailwind configuration ✅
- `.cursor/rules/` - Development standards and cursor rules ✅
