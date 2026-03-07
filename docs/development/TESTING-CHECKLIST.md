# Browser Testing Checklist

Manual testing guide for Nyckla. Run after major feature work before merging to main.

## Prerequisites

- [ ] Dev server running: `npm run dev`
- [ ] A test account exists in Supabase Auth (create via the login page)
- [ ] At least one organisation created under the test account

---

## Auth

### Login (passwordless OTP)
1. Go to `/auth/login`
2. Enter a real email address, complete the Turnstile CAPTCHA, click "Log In"
3. Check email for magic link / OTP code
4. Complete login

**Expected:** Redirected to `/active-loans` or onboarding if first login.

### Login (Google OAuth)
1. Go to `/auth/login`, click "Sign in with Google"

**Expected:** Google OAuth flow completes, redirected to `/active-loans`.

### Auth gate
1. Log out, then try to access `/active-loans` directly

**Expected:** Redirected to `/auth/login`.

---

## Organisation Switcher

1. Click the org name at the top of the sidebar
2. If you have multiple orgs, switch between them

**Expected:**
- [ ] Dropdown shows all orgs with roles
- [ ] Checkmark on the active org
- [ ] "+ Create Organisation" option is present
- [ ] Switching org redirects to `/active-loans` and updates sidebar title

---

## Keys Page

### Create key type
1. Go to `/keys`, click "+ Add Key Type"
2. Fill: Label = `A`, Name = `Apartment key`, Copies = `3`
3. Submit

**Expected:**
- [ ] Row appears in table: Label A, Name "Apartment key", 3 copies
- [ ] Charts update (donut + bar)
- [ ] No errors

### Expand row
1. Click the `>` chevron on the key type row

**Expected:**
- [ ] Copy #1, #2, #3 expand below, all "Available"
- [ ] Each copy has a "Mark Lost" button

### Edit key type
1. Click `⋮` → Edit on a key type
2. Change the name, click Save
3. Dialog should close automatically

**Expected:**
- [ ] Dialog closes after save ✅ (fixed in audit)
- [ ] Table reflects updated name
- [ ] Fields have placeholder text ✅ (fixed in audit)

### Add copy
1. Click `⋮` → Add Copy

**Expected:** New copy appears in expanded row with next number.

### Mark lost / found
1. Click "Mark Lost" on an available copy
2. Click "Mark Found" on a lost copy

**Expected:** Badge toggles between "Available" / "Lost", charts update.

### Delete key type
1. Click `⋮` → Delete (only works when no active loans)

**Expected:** Row removed, charts update.

---

## Issue Key Workflow

1. Click "+ Issue key" in the sidebar (or `+ Issue Key` button on active loans page)

**Expected:** Full-screen 4-step wizard loads (no crash ✅ fixed in audit).

### Step 1 — Select Keys
- [ ] Available keys shown in multi-select dropdown with copy count badges
- [ ] Selecting a key type shows copy selector below
- [ ] "Next" disabled until at least one key selected

### Step 2 — Borrower Details
- [ ] Search field auto-suggests existing borrowers
- [ ] New borrower form validates name (required), email (required), phone (optional)
- [ ] Placeholder email generated if no email provided

### Step 3 — Lending Details
- [ ] Date picker for due date (optional)
- [ ] ID verification checkbox required to proceed

### Step 4 — Confirm
- [ ] Summary shows selected keys, borrower name, due date, ID status
- [ ] "Issue Keys" button submits

**Expected after submit:**
- [ ] Redirected to `/active-loans`
- [ ] Borrower appears in table with borrowed keys
- [ ] Key copy status changes to "In Use" on keys page

---

## Active Loans

1. Go to `/active-loans` after issuing a key

**Expected:**
- [ ] Borrower row shows name and borrowed key count
- [ ] Overdue chart visible (if any overdue loans exist)
- [ ] "Filter Affiliation" dropdown works
- [ ] "Customize Columns" works
- [ ] Search by name filters the table

### Return key
1. Click the borrower row → actions menu → Return Keys
2. Select which keys to return, confirm

**Expected:**
- [ ] Borrower disappears from active loans (GDPR cleanup if no remaining loans)
- [ ] Key copy status returns to "Available"

### Mark lost / replace
1. Click borrower → "Mark as Lost" or "Replace Key"

**Expected:** Dialogs open and complete without errors.

---

## Settings Page

1. Go to `/settings/organization`

**Expected:**
- [ ] Top header reads "Settings" (not "Active Loans") ✅ (fixed in audit)
- [ ] Org name editable and saves correctly
- [ ] Members table shows you with "(You)" badge and OWNER role
- [ ] Invite form visible for OWNER/ADMIN
- [ ] Sidebar footer shows your email (not "Loading...") ✅ (fixed in audit)

### Send invitation
1. Enter an email address, select role, click "Send Invitation"

**Expected:**
- [ ] No `NEXT_PUBLIC_SITE_URL is not configured` error ✅ (fixed in audit)
- [ ] Pending Invitations table updates
- [ ] Resend sends an email (or check dev logs if Resend not configured)

### Cancel invitation
1. Click `×` on a pending invitation

**Expected:** Invitation removed from table.

---

## Multi-Tenant Isolation

1. Switch to a second org via the org switcher
2. Go to `/keys` — should show no data from the first org
3. Go to `/active-loans` — should show no borrowers from the first org

**Expected:**
- [ ] Zero data leakage between orgs ✅ (confirmed working)
- [ ] Each org has independent key types and borrowers

---

## Known Limitations (not bugs, need schema work)

- The **Access Area** field in the Create/Edit Key Type forms is **not saved**. The schema uses a many-to-many `AccessArea` relation, but no CRUD path exists yet. The field is cosmetic until a plain string column is added to `KeyType` or proper AccessArea management is built.

---

## Known Good (verified in audit — 2026-03-06)

- ✅ Dashboard loads, navigation works
- ✅ Org switcher shows roles and checkmarks
- ✅ Create key type (name + copies saved, charts update)
- ✅ Row expand shows copy status
- ✅ Key type context menu (Add Copy / Edit / Delete)
- ✅ Edit dialog closes after save
- ✅ Multi-tenant data isolation
- ✅ Issue key page loads (Prisma bundle bug fixed)
- ✅ Settings header shows "Settings"
- ✅ Sidebar user name shows email fallback
- ✅ Pending invitations shown after sending
- ✅ Issue key full workflow (4 steps → active loans)
- ✅ Return key (GDPR cleanup, borrower removed, toast shown)
- ✅ Borrower actions menu (Contact Actions / Borrower Management / Loan Actions)
- ✅ Onboarding flow (steps 2–6, access areas, labels, copies, names, area mapping, review)
