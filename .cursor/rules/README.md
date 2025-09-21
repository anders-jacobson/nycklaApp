# Cursor Rules Inventory - Swedish Key Management App

## 📋 Rules Structure Overview

The rules have been streamlined into a minimal, focused structure with a master reference file that points to specific patterns and Context7 for up-to-date documentation.

## 🎯 Core Rules (Always Applied)

### 1. `cursor-rules.mdc` - **MASTER REFERENCE**

- **Purpose**: Single entry point for all development standards
- **Status**: `alwaysApply: true`
- **Content**: Quick reference with pointers to detailed documentation
- **Key Sections**:
  - Context7 MCP usage (mandatory)
  - Architecture overview
  - Critical UI rules
  - Standard database patterns
  - References to detailed files

### 2. `context7-mcp-usage.mdc` - **CRITICAL EXTERNAL DOCUMENTATION**

- **Purpose**: Mandatory Context7 MCP server usage for up-to-date library docs
- **Status**: `alwaysApply: true`
- **Content**: Complete Context7 integration patterns
- **Usage**: ALWAYS consult before implementing external libraries

## 📚 Detailed Reference Files

### 3. `development-standards.mdc` - **COMPREHENSIVE INTERNAL PATTERNS**

- **Purpose**: Complete development standards and patterns
- **Status**: `alwaysApply: true`
- **Content**:
  - UI component usage (shadcn/ui + Tabler Icons)
  - Server action patterns
  - Component architecture
  - Import conventions
  - File structure guidelines

### 4. `schema-reference.mdc` - **DATABASE PATTERNS**

- **Purpose**: Internal database schema and query patterns
- **Status**: `alwaysApply: false` (reference only)
- **Content**:
  - Current Prisma schema models
  - Standard query patterns
  - Authentication patterns
  - Transaction examples
  - Anti-patterns to avoid

## 🏗️ Context Files (Project-Specific)

### 5. `project-context.mdc` - **APP CONTEXT**

- **Purpose**: Swedish housing cooperative app context
- **Status**: `alwaysApply: false`
- **Content**:
  - Business requirements
  - Swedish terminology
  - Technical constraints
  - Supabase configuration

### 6. `key-features.mdc` - **FEATURE SPECIFICATIONS**

- **Purpose**: Core feature requirements and workflows
- **Status**: `alwaysApply: false`
- **Content**:
  - Dashboard requirements
  - Lending/return workflows
  - Key management features
  - Mobile-first UI requirements

### 7. `user-flows.mdc` - **UX PATTERNS**

- **Purpose**: User experience flows and patterns
- **Status**: `alwaysApply: false`
- **Content**:
  - User registration flows
  - Key lending processes
  - Error recovery patterns
  - Accessibility guidelines

### 8. `task-list.mdc` - **WORKFLOW MANAGEMENT**

- **Purpose**: Task management guidelines
- **Status**: `alwaysApply: false`
- **Content**:
  - Task list creation
  - Progress tracking
  - AI workflow instructions

## 🔄 Development Workflow

### Automatic Rule Application

Cursor now automatically applies relevant rules based on the files you're working with:

1. **All TypeScript/React files**: `cursor-rules.mdc` + `development-standards.mdc`
2. **Database files** (`actions/`, `prisma/`): `schema-reference.mdc`
3. **Auth/Dashboard files**: `project-context.mdc`
4. **Feature files** (`keys/`, `borrower*`): `key-features.mdc`
5. **Workflow files**: `user-flows.mdc`

### Manual Workflow (When Needed)

1. **Always use Context7 MCP first** - Get latest external library docs
2. **Check validation checklist** in `cursor-rules.mdc`
3. **Reference specific patterns** as needed

### File Priority Order

1. **CRITICAL**: `cursor-rules.mdc` + `context7-mcp-usage.mdc`
2. **ESSENTIAL**: `development-standards.mdc`
3. **REFERENCE**: `schema-reference.mdc`
4. **CONTEXTUAL**: Project context files
5. **WORKFLOW**: Task management files

## 📊 File Count Summary

```
Total Rules Files: 8
├── Core Rules (Always Applied): 2
├── Detailed References: 2
├── Context Files: 3
└── Workflow Files: 1

Removed/Consolidated: 5 files
├── coding-standards.mdc → development-standards.mdc
├── database-schema.mdc → schema-reference.mdc
├── tech-stack.mdc → development-standards.mdc
├── ui-component-standards.mdc → development-standards.mdc
└── environment-config.template.mdc → deleted
```

## 🎯 Key Improvements

### Before Restructure

- 13 files with overlapping content
- Complex navigation between files
- Redundant information scattered across multiple files
- No clear entry point

### After Restructure

- 8 focused files with clear purposes
- Single master reference file
- Context7 integration for external docs
- Clear workflow and priorities
- Consolidated internal patterns

## 📝 Usage Guidelines

### For New Developers

1. Start with `cursor-rules.mdc` - understand the basics
2. Read `context7-mcp-usage.mdc` - learn Context7 workflow
3. Reference `development-standards.mdc` when coding
4. Use `schema-reference.mdc` for database work

### For Experienced Team Members

- `cursor-rules.mdc` for quick reference
- `schema-reference.mdc` for database patterns
- Context files for business context

### For AI Assistants

1. Always check Context7 first for external libraries
2. Use internal patterns from reference files
3. Follow established database and UI patterns
4. Reference actual codebase examples

This streamlined structure provides comprehensive coverage while maintaining simplicity and avoiding redundancy.
