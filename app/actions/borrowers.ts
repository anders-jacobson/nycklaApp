'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-utils';
import { revalidatePath } from 'next/cache';
import { getEntityKey, encryptWithEntityKey } from '@/lib/entity-encryption';

type ActionResult<T> = { success: true; data?: T } | { success: false; error: string };

export async function checkEmailExists(
  email: string,
  excludeBorrowerId?: string,
): Promise<ActionResult<{ exists: boolean }>> {
  try {
    const { entityId } = await getCurrentUser();

    // Encrypt the email to match encrypted stored values
    const entityKey = await getEntityKey(entityId);
    const encryptedEmail = encryptWithEntityKey(email, entityKey);

    if (!encryptedEmail) {
      return { success: false, error: 'Failed to encrypt email for search' };
    }

    const count = await prisma.borrower.count({
      where: {
        entityId,
        id: excludeBorrowerId ? { not: excludeBorrowerId } : undefined,
        OR: [
          { residentBorrower: { email: encryptedEmail } },
          { externalBorrower: { email: encryptedEmail } },
        ],
      },
    });

    return { success: true, data: { exists: count > 0 } };
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
      const borrower = await tx.borrower.findFirst({
        where: { id: params.borrowerId, entityId },
        include: { residentBorrower: true, externalBorrower: true },
      });
      if (!borrower) throw new Error('Borrower not found');

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
          where: { id: borrower.id },
          data: {
            affiliation: 'EXTERNAL',
            externalBorrowerId: external.id,
            residentBorrowerId: null,
          },
        });
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
          where: { id: borrower.id },
          data: {
            affiliation: 'RESIDENT',
            residentBorrowerId: resident.id,
            externalBorrowerId: null,
          },
        });
      }
    });

    revalidatePath('/active-loans');
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update borrower affiliation';
    return { success: false, error: message };
  }
}
