import { PrismaClient } from '@prisma/client';
import { createEncryptionExtension } from './prisma-encryption';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const basePrisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  // Configure connection pooling and timeouts for unstable connections
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Add query timeout (10 seconds)
  // This helps fail fast on unstable connections rather than hanging
  __internal: {
    engine: {
      // @ts-ignore - Internal Prisma configuration
      connectTimeout: 10000, // 10 seconds to establish connection
      queryTimeout: 10000,   // 10 seconds for query execution
    },
  } as any,
});

// Apply encryption extension
export const prisma = basePrisma.$extends(createEncryptionExtension(basePrisma));

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = basePrisma;
