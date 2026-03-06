# Handling Unstable Network Connections

## Overview

This application is designed to work reliably even with unstable network connections (e.g., mobile data, train wifi). This document outlines the strategies implemented.

## Database Connection Configuration

### 1. Connection Pool Settings

**File**: `.env`

```env
DATABASE_URL="postgresql://...?connect_timeout=10&pool_timeout=10&connection_limit=10"
```

- `connect_timeout=10`: Fail fast after 10 seconds if unable to connect
- `pool_timeout=10`: Don't wait more than 10 seconds for a connection from the pool
- `connection_limit=10`: Limit concurrent connections to prevent overwhelming the connection pool

### 2. Prisma Client Configuration

**File**: `lib/prisma.ts`

The Prisma client is configured with:
- Connection timeout: 10 seconds
- Query timeout: 10 seconds
- These settings ensure the app fails fast rather than hanging on slow/unstable connections

## Error Handling

### Connection Error Detection

**File**: `lib/db-error-handler.ts`

Provides utilities for handling database errors:

```typescript
import { isConnectionError, getDbErrorMessage, retryDbOperation } from '@/lib/db-error-handler';

// Check if an error is a connection issue
if (isConnectionError(error)) {
  // Handle gracefully
}

// Get user-friendly error message
const message = getDbErrorMessage(error);

// Retry operation with exponential backoff
const result = await retryDbOperation(async () => {
  return await prisma.user.findUnique({ where: { id } });
}, 3, 1000); // 3 retries, starting with 1 second delay
```

### Graceful Degradation

The app handles connection errors by:

1. **Non-blocking failures**: If onboarding status check fails due to connectivity, the app continues without forcing onboarding redirect
2. **Retry logic**: Critical operations can use `retryDbOperation` with exponential backoff
3. **User-friendly messages**: Connection errors show helpful messages instead of technical details

## Best Practices for Developers

### 1. Always Handle Connection Errors in Server Actions

```typescript
'use server';

import { isConnectionError, getDbErrorMessage } from '@/lib/db-error-handler';

export async function myAction(): Promise<ActionResult<Data>> {
  try {
    const result = await prisma.myTable.findMany();
    return { success: true, data: result };
  } catch (error) {
    if (isConnectionError(error)) {
      return {
        success: false,
        error: 'Unable to connect. Please check your internet connection and try again.',
      };
    }
    return { success: false, error: 'An unexpected error occurred.' };
  }
}
```

### 2. Use Retry Logic for Critical Operations

```typescript
import { retryDbOperation } from '@/lib/db-error-handler';

const result = await retryDbOperation(async () => {
  return await prisma.$transaction([
    // Critical operations
  ]);
}, 3, 1000);
```

### 3. Show Loading States

Always show loading indicators for database operations so users know the app is working:

```typescript
const [isLoading, setIsLoading] = useState(false);

async function handleSubmit() {
  setIsLoading(true);
  try {
    const result = await myAction();
    // Handle result
  } finally {
    setIsLoading(false);
  }
}
```

### 4. Provide Offline-Friendly UX

Consider:
- Showing cached data when available
- Allowing users to queue actions for when connection returns
- Clear indicators when the app is working offline vs experiencing errors

## Testing Unstable Connections

### Chrome DevTools

1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Select "Slow 3G" or "Offline" from the throttling dropdown
4. Test various app operations

### Locally

You can simulate connection issues by temporarily modifying the DATABASE_URL in `.env` (remember to revert!):

```env
# Add invalid parameter to cause timeout
DATABASE_URL="postgresql://...?connect_timeout=1"
```

## Error Codes

Common Prisma error codes related to connections:

- `P1001`: Can't reach database server
- `P1002`: Database server timeout
- `P1017`: Connection closed

All handled by `isConnectionError()` utility.

## Monitoring

When connection errors occur, they're logged differently:

```typescript
console.warn('Database connection issue (likely unstable network):', error);
```

This helps distinguish between:
- Network issues (expected on trains, etc.)
- Actual bugs or configuration problems

## Future Improvements

Consider implementing:

1. **Service Worker**: Cache critical data for offline access
2. **IndexedDB**: Store user actions locally when offline, sync when online
3. **WebSocket**: Real-time connection status indicator
4. **Background Sync API**: Queue actions when offline
5. **Progressive Web App (PWA)**: Better offline experience
