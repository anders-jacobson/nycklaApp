# Tests Directory

Backend integration tests for the key management application.

## Test Files

### Workflow Tests

- **`test-issue-return-workflows.ts`** - Comprehensive issue & return workflow tests (run with `npm run test:workflows`)

### Feature Tests

- **`test-key-issuing.ts`** - Key issuing functionality
- **`test-key-issuing-simple.ts`** - Simplified key issuing tests
- **`test-borrower-creation.ts`** - Borrower creation and management

### Data Tests

- **`test-dashboard-queries.ts`** - Dashboard data fetching
- **`test-search-action.ts`** - Borrower search functionality
- **`test-schema.ts`** - Database schema validation

## Running Tests

```bash
# Run workflow tests (recommended)
npm run test:workflows

# Run individual test
tsx tests/test-borrower-creation.ts
```

## Requirements

- `.env` file with `DATABASE_URL` (use port 5432, not pooler)
- Prisma client generated: `npx prisma generate`
- Test user in database (cooperative: "Testgården Bostadsrättsförening")

## Notes

- Tests clean up their own data
- Use direct database connection (not pooler) for best results
- See `docs/development/WORKFLOW-TESTING-GUIDE.md` for detailed testing guide
