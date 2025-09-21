# Key Management App - Product Requirements Document

## 1. Problem Statement & Solution Overview

### Problem Statement

Key managers (nyckelansvariga) in Swedish housing cooperatives (bostadsrättsföreningar) lack a systematic way to track physical keys, leading to security risks and administrative inefficiency. Current methods are inconsistent, incomplete, and don't transfer well between key managers, creating gaps in accountability and potential security vulnerabilities.

### Current Pain Points

- Inconsistent tracking methods with no standardized handover process
- Incomplete records making it difficult to get overview of key status
- No centralized location for key diagrams and access information
- Missing contact details for key holders
- Difficulty determining if keys are lent out or returned
- Security threats due to unknown key locations
- Administrative inefficiency (1-2 incidents per month in small cooperatives)

### Solution Overview

A web-based, mobile-first application that provides a centralized system for tracking physical keys, their locations, assigned areas, and current holders with contact information, while enabling smooth handovers between key managers.

## 2. Target User Personas & Use Cases

### Primary Persona: The Key Manager (Nyckelansvarig)

- **Demographics**: Often pensioners/retirees with varying tech comfort levels
- **Role**: Elected/appointed volunteer in housing cooperative
- **Tenure**: Typically serves for multiple years
- **Technical Context**: Prefers mobile phone for day-to-day tasks, computer for initial setup
- **Responsibility**: Manages ~10 key types with varying copy quantities

### Key Management Context

- **Key Types**: Laundry, trash, basement, attic, electrical, elevator, master keys
- **Copy Quantities**:
  - High-volume keys (laundry/trash): 30+ copies (one per member)
  - Low-volume keys (technical/master): 2-3 copies
  - Modern systems: Generally fewer copies (2-3 per type)
- **Access Patterns**: Reactive checking when requests come in, potential for proactive monitoring

## 3. Core Features & User Stories

### Key Lending Workflow

**As a key manager, I want to:**

- Select specific key type and copy number
- Record borrower information: Name, Email, Phone, Affiliation (optional), Notes (optional)
- Confirm ID has been checked (checkbox)
- Set optional end date with reminder capability
- Automatically timestamp the lending transaction
- Mark key as "out" in the system

### Key Return Workflow

**As a key manager, I want to:**

- Mark keys as returned
- Automatically clear lending record
- Make key available in inventory again
- Maintain borrower record in case they borrow other keys

### Key Inventory Dashboard

**As a key manager, I want to:**

- View stacked bar chart showing available/out/lost keys per key type
- Access sortable table of all key copies with current status
- Sort by key type or name of current holder
- Get quick overview of total inventory status

### Key Management

**As a key manager, I want to:**

- Add new key copies when ordered
- Mark keys as lost (permanent record)
- Manage key types and their corresponding access areas
- Track which areas each key type accesses

### Borrower Management

**As a key manager, I want to:**

- Maintain separate borrower records
- Track borrowers who have multiple keys
- Access borrower contact information quickly

## 4. Technical Requirements & Constraints

### Architecture

- **Platform**: Web-based, mobile-first responsive design
- **Data Storage**: Supabase (EU servers for GDPR compliance)
- **Authentication**: Email/password + Google OAuth
- **Connectivity**: Online-only (no offline capability in MVP)
- **User Management**: Single admin user, expandable to max 2 users per account

### Data Structure

- **Persistent Data**: Key types, key copies, access areas, borrower records, lost key records
- **Temporary Data**: Active lending records (deleted on return)
- **No Historical Data**: No need to maintain lending history after return

### Security & Compliance

- EU data storage for GDPR compliance
- Secure authentication (2FA planned for future)
- Sensitive security information handling

### Notifications

- In-app reminders for overdue keys when logging in
- Dashboard alerts for pending actions
- Future: Scheduled email/SMS reminders

## 5. Success Metrics & Acceptance Criteria

### Primary Success Metric

Complete and accurate overview of key status at all times

### Key Performance Indicators

1. **Response Time**: Answer "Who has key X?" in seconds, not minutes
2. **Data Completeness**: 100% of keys have complete tracking information
3. **Process Efficiency**: Faster key request processing vs. current manual methods
4. **Inventory Accuracy**: Always know if copies are available or need ordering
5. **User Confidence**: Zero unaccounted keys in the system

### Acceptance Criteria for MVP

- ✅ Track all key types and individual copies
- ✅ Complete lend/return workflow with contact capture
- ✅ Real-time dashboard with visual overview (stacked bar charts)
- ✅ Sortable table view of all key copies and status
- ✅ Mobile-responsive interface working smoothly on phones
- ✅ Secure login with email and Google authentication
- ✅ In-app overdue key reminders

## 6. Feature Prioritization

### MVP Must-Have Features

- **Core Functionality**
  - Key inventory management (types, copies, access areas)
  - Borrower management with separate table structure
  - Complete lend/return workflow
  - Contact information capture and management
- **User Interface**
  - Mobile-first responsive design
  - Dashboard with stacked bar charts (using shadcn components)
  - Sortable table view of key copies
  - In-app overdue reminders
- **Technical Foundation**
  - Email/Google authentication
  - Supabase backend integration
  - GDPR-compliant data handling

### Future Enhancement Features

- **User Management**: Multiple users per account (max 2)
- **Advanced Notifications**: Scheduled email/SMS reminders
- **Security**: Two-factor authentication (2FA)
- **Reporting**: Advanced analytics and reporting features
- **Offline**: Offline capability for mobile use
- **Integration**: Potential integration with property management systems

## 7. User Onboarding & Setup

### Initial Account Creation

- **Registration Process**: Email/Google OAuth signup with cooperative name collection
- **Cooperative Setup**: Single cooperative per user account (required field)
- **Profile Completion**: Name, contact information, and cooperative details
- **Data Ownership**: Each cooperative's data is completely isolated using Row Level Security

### Key System Setup Workflow

1. **Key Type Creation**: Add key types with access area descriptions
2. **Bulk Copy Generation**: Create multiple copies efficiently (especially for high-volume keys like laundry - 30+ copies)
3. **Copy Number Management**: Sequential numbering with ability to add/remove copies
4. **Initial Borrower Database**: Import or manually add frequent borrowers

### Data Migration Support

- **Existing Records**: Support for importing existing key inventory from spreadsheets
- **Borrower Import**: CSV import capability for existing borrower databases
- **Setup Wizard**: Step-by-step guidance for first-time users

## 8. Accessibility & Mobile UX Requirements

### Accessibility Standards

- **Font Sizes**: Minimum 16px base font, scalable up to 20px for older users
- **Contrast Ratios**: WCAG AA compliance (4.5:1 minimum)
- **Touch Targets**: Minimum 44px touch areas for all interactive elements
- **Color Independence**: Information not conveyed by color alone

### Senior-Friendly Design Patterns

- **Simple Navigation**: Linear, predictable navigation flows
- **Clear Labels**: Descriptive button text, no icons without labels
- **Error Handling**: Clear, actionable error messages with recovery steps
- **Confirmation Patterns**: Clear confirmation for important actions
- **Reduced Cognitive Load**: One primary action per screen when possible

### Mobile-First Specifics

- **Touch-Friendly Forms**: Large input fields, dropdown selectors
- **Swipe Gestures**: Optional, not required for core functionality
- **Offline Indicators**: Clear indication when internet connection required
- **Loading States**: Clear feedback during data operations

## 9. Notification System Implementation

### Overdue Key Logic

- **Calculation Method**: Based on optional end date field in lending records
- **Grace Period**: 7-day grace period before marking as "overdue"
- **No End Date Handling**: Keys without end dates are never marked overdue
- **Dashboard Integration**: Overdue count prominently displayed on main dashboard

### In-App Notification Patterns

- **Login Alerts**: Summary of overdue keys shown immediately after login
- **Dashboard Badges**: Red notification badges on relevant sections
- **Key Status Indicators**: Visual indicators in key tables and lists
- **Action Prompts**: Suggested actions for overdue situations

### Future Notification Enhancements

- **Email Reminders**: Weekly digest of overdue keys
- **SMS Integration**: Text message alerts for critical overdue situations
- **Borrower Notifications**: Optional email reminders to borrowers (with consent)

## 10. Implementation Considerations

### Development Phases

1. **Phase 1**: Core key tracking and basic dashboard
2. **Phase 2**: Enhanced UI with charts and advanced sorting
3. **Phase 3**: Notification system and user management
4. **Phase 4**: Advanced features and integrations

### Risk Mitigation

- **Data Security**: Implement proper encryption and access controls
- **User Adoption**: Focus on intuitive mobile interface for older users
- **Data Migration**: Plan for importing existing key inventory data
- **Backup Strategy**: Regular backups of key inventory and borrower data

### Success Validation

- **User Testing**: Test with actual key managers in housing cooperatives
- **Performance Monitoring**: Track response times and user satisfaction
- **Security Auditing**: Regular security reviews of sensitive data handling
- **Feature Usage**: Monitor which features provide most value to users
