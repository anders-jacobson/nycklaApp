import { PrismaClient } from '@prisma/client';
import { createEncryptionExtension } from './prisma-encryption';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const basePrisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Apply encryption extension
export const prisma = basePrisma.$extends(createEncryptionExtension(basePrisma));

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = basePrisma;
