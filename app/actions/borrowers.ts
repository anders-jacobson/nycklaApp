'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-utils';
import { revalidatePath } from 'next/cache';
import { getEntityKey, encryptWithEntityKey, decryptWithEntityKey } from '@/lib/entity-encryption';

type ActionResult<T> = { success: true; data?: T } | { success: false; error: string };

export async function checkEmailExists(
  email: string,
  excludeBorrowerId?: string,
): Promise<ActionResult<{ exists: boolean }>> {
  try {
    const { entityId } = await getCurrentUser();
    const entityKey = await getEntityKey(entityId);
    const normalizedEmail = email.trim().toLowerCase();

    // Encrypted fields cannot be compared in SQL — fetch all and decrypt in memory
    const borrowers = await prisma.borrower.findMany({
      where: {
        entityId,
        id: excludeBorrowerId ? { not: excludeBorrowerId } : undefined,
      },
      include: {
        residentBorrower: { select: { email: true } },
        externalBorrower: { select: { email: true } },
      },
    });

    const exists = borrowers.some((b) => {
      const encryptedEmail = b.residentBorrower?.email ?? b.externalBorrower?.email;
      if (!encryptedEmail) return false;
      const decrypted = decryptWithEntityKey(encryptedEmail, entityKey);
      return decrypted?.toLowerCase() === normalizedEmail;
    });

    return { success: true, data: { exists } };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to check email';
    return { success: false, error: message };
  }
}

export async function updateBorrowerAffiliation(params: {
  borrowerId: string;
  target: 'EXTERNAL' | 'RESIDENT';
  data: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    address?: string;
    borrowerPurpose?: string;
  };
}): Promise<ActionResult<undefined>> {
  try {
    const { entityId } = await getCurrentUser();

    // Get entity encryption key
    const entityKey = await getEntityKey(entityId);

    await prisma.$transaction(async (tx) => {
      const existing = await tx.borrower.findFirst({
        where: { id: params.borrowerId, entityId },
        select: { id: true, residentBorrowerId: true, externalBorrowerId: true },
      });
      if (!existing) throw new Error('Borrower not found');

      if (params.target === 'EXTERNAL') {
        // Create external entity with encrypted data
        const external = await tx.externalBorrower.create({
          data: {
            name: encryptWithEntityKey(params.data.name, entityKey)!,
            email: encryptWithEntityKey(params.data.email, entityKey)!,
            phone: encryptWithEntityKey(params.data.phone, entityKey),
            company: encryptWithEntityKey(params.data.company, entityKey),
            address: encryptWithEntityKey(params.data.address, entityKey),
            borrowerPurpose: encryptWithEntityKey(params.data.borrowerPurpose, entityKey),
          },
        });
        await tx.borrower.update({
          where: { id: existing.id },
          data: {
            affiliation: 'EXTERNAL',
            externalBorrowerId: external.id,
            residentBorrowerId: null,
          },
        });
        // Delete orphaned old sub-record to prevent PII leakage
        if (existing.residentBorrowerId) {
          await tx.residentBorrower.delete({ where: { id: existing.residentBorrowerId } });
        }
      } else {
        // Create resident entity with encrypted data
        const resident = await tx.residentBorrower.create({
          data: {
            name: encryptWithEntityKey(params.data.name, entityKey)!,
            email: encryptWithEntityKey(params.data.email, entityKey)!,
            phone: encryptWithEntityKey(params.data.phone, entityKey),
          },
        });
        await tx.borrower.update({
          where: { id: existing.id },
          data: {
            affiliation: 'RESIDENT',
            residentBorrowerId: resident.id,
            externalBorrowerId: null,
          },
        });
        // Delete orphaned old sub-record to prevent PII leakage
        if (existing.externalBorrowerId) {
          await tx.externalBorrower.delete({ where: { id: existing.externalBorrowerId } });
        }
      }
    });

    revalidatePath('/active-loans');
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update borrower affiliation';
    return { success: false, error: message };
  }
}
