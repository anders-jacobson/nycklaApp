/**
 * Database error handling utilities for unstable connections
 */

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

/**
 * Check if error is a database connection error
 */
export function isConnectionError(error: unknown): boolean {
  if (error instanceof PrismaClientKnownRequestError) {
    return error.code === 'P1001' || error.code === 'P1002' || error.code === 'P1017';
  }
  return false;
}

/**
 * Get user-friendly error message for database errors
 */
export function getDbErrorMessage(error: unknown): string {
  if (isConnectionError(error)) {
    return 'Unable to connect to the database. Please check your internet connection and try again.';
  }

  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return 'This record already exists.';
      case 'P2025':
        return 'Record not found.';
      case 'P2003':
        return 'Related record not found.';
      default:
        return 'A database error occurred. Please try again.';
    }
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Retry a database operation with exponential backoff
 * Useful for unstable connections
 */
export async function retryDbOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Only retry connection errors
      if (!isConnectionError(error)) {
        throw error;
      }

      // Don't delay after the last attempt
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
