---
description: User experience flows and accessibility patterns for key management workflows
globs: ['**/auth/**/*', '**/dashboard/**/*', '**/workflow/**/*', '**/forms/**/*']
alwaysApply: false
---

# User Flow Patterns

## Initial Setup Flow (First-Time Users)

### Account Registration

1. **Landing Page**: Welcome with clear value proposition
2. **Registration**: Email/Google OAuth signup
3. **Cooperative Setup**: Required cooperative name collection
4. **Profile Completion**: Name and contact information
5. **Welcome Dashboard**: Overview of next steps

### Key System Setup Wizard

1. **Key Types Creation**:

   - Add common key types (laundry, trash, basement, etc.)
   - Set access areas for each type
   - Estimate copy quantities needed

2. **Bulk Copy Generation**:

   - High-volume keys: Batch create 30+ copies with sequential numbering
   - Low-volume keys: Create 2-3 copies manually
   - Preview and confirm copy structure

3. **Lending Process Setup**:

   - Configure validation rules for lending
   - Set up borrower data capture requirements (GDPR-compliant)
   - Configure placeholder email system (@placeholder.com for paper transitions)
   - No pre-population of borrower database (added inline during lending)

4. **Dashboard Tour**: Guided walkthrough of main features

## Key Lending Flow (Mobile-Optimized)

### Quick Lending Process

1. **Key Selection**:

   - Search or browse by key type
   - Visual availability indicator
   - Select specific copy number

2. **Borrower Information**:

   - Search existing active borrowers (autocomplete with placeholder email indicators)
   - Add new borrower information inline
   - Required: Name, Email (can be placeholder @placeholder.com)
   - Optional: Phone, Company
   - Generate Placeholder: Click wand button to auto-create placeholder email
   - GDPR Note: Borrower data only stored when they have active keys

3. **Lending Details**:

   - Optional end date picker
   - Optional notes field
   - Required: ID checked confirmation checkbox

4. **Confirmation**:
   - Summary of lending details
   - One-tap confirm action
   - Auto-return to dashboard

### Alternative: Existing Borrower Flow

1. **Borrower-First Selection**: Start with borrower, then select available keys
2. **Multiple Key Lending**: Select multiple keys for same borrower
3. **Bulk Operations**: Handle multiple keys efficiently

## Key Return Flow (Fast Return)

### Simple Return Process

1. **Active Loans View**:

   - List of all currently lent keys
   - Sort by overdue, borrower name, or key type
   - Search functionality

2. **Return Selection**:

   - Tap key to return
   - Confirmation dialog with borrower details
   - One-tap return confirmation

3. **Automatic Processing**:
   - Key status updated to available
   - Lending record deleted
   - Borrower record deleted if no other active keys (GDPR compliance)
   - Dashboard refreshed

### Bulk Return Flow

1. **Multi-select Interface**: Select multiple keys from same borrower
2. **Batch Return**: Single confirmation for multiple keys
3. **Return Notes**: Optional notes for unusual circumstances

## Dashboard Navigation Flow

### Mobile Dashboard Layout

1. **Header**:

   - Cooperative name
   - User profile access
   - Quick actions (+ button)

2. **Overview Cards**:

   - Total keys available/out/lost
   - Overdue key alerts
   - Recent activity summary

3. **Main Sections**:

   - Stacked bar charts by key type
   - Quick actions (Lend Key, Return Key)
   - Active loans table (mobile-optimized)

4. **Bottom Navigation**:
   - Dashboard (home)
   - Lend Key
   - Return Key
   - Settings

### Desktop Dashboard Enhancements

1. **Sidebar Navigation**: Persistent navigation menu
2. **Multiple Columns**: Charts and tables side-by-side
3. **Advanced Filtering**: More sophisticated search options
4. **Bulk Operations**: Multi-select capabilities

## Error Recovery Flows

### Common Error Scenarios

1. **Network Connection Lost**:

   - Clear offline indicator
   - Queue actions for retry
   - Graceful degradation

2. **Key Already Lent**:

   - Clear error message
   - Show current borrower
   - Option to contact borrower

3. **Invalid Borrower Data**:
   - Highlight specific field errors
   - Suggest corrections
   - Save partial progress

## Accessibility Patterns

### Senior-Friendly Navigation

1. **Large Touch Targets**: Minimum 44px for all buttons
2. **Clear Visual Hierarchy**: High contrast, readable fonts
3. **Simple Language**: Avoid technical jargon
4. **Confirmation Dialogs**: Clear consequences for actions

### Error Prevention

1. **Input Validation**: Real-time feedback
2. **Confirmation Steps**: Double-check important actions
3. **Undo Capabilities**: Easy reversal of recent actions
4. **Help Context**: Contextual guidance where needed

## Performance Optimization Patterns

### Loading States

1. **Skeleton Screens**: Show structure while loading
2. **Progressive Loading**: Load critical content first
3. **Optimistic Updates**: Immediate UI feedback
4. **Error Boundaries**: Graceful failure handling

### Caching Strategy

1. **Key Data**: Cache frequently accessed key types
2. **Borrower Data**: Cache borrower information
3. **Dashboard Data**: Smart refresh strategy
4. **Offline Indicators**: Clear connection status
