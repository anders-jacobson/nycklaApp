import { PrismaClient } from '@prisma/client';
import { initializeEncryptionMiddleware } from './prisma-encryption';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// Initialize encryption middleware for automatic PII encryption/decryption
initializeEncryptionMiddleware();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
