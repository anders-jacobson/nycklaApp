'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-utils';
import { revalidatePath } from 'next/cache';

type ActionResult<T> = { success: true; data?: T } | { success: false; error: string };

export async function checkEmailExists(
  email: string,
  excludeBorrowerId?: string,
): Promise<ActionResult<{ exists: boolean }>> {
  try {
    const { activeOrganisationId: entityId } = await getCurrentUser();

    const count = await prisma.borrower.count({
      where: {
        entityId,
        id: excludeBorrowerId ? { not: excludeBorrowerId } : undefined,
        OR: [{ residentBorrower: { email } }, { externalBorrower: { email } }],
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
    const { activeOrganisationId: entityId } = await getCurrentUser();

    await prisma.$transaction(async (tx) => {
      const borrower = await tx.borrower.findFirst({
        where: { id: params.borrowerId, entityId },
        include: { residentBorrower: true, externalBorrower: true },
      });
      if (!borrower) throw new Error('Borrower not found');

      if (params.target === 'EXTERNAL') {
        // Create external entity
        const external = await tx.externalBorrower.create({
          data: {
            name: params.data.name,
            email: params.data.email,
            phone: params.data.phone,
            company: params.data.company,
            address: params.data.address,
            borrowerPurpose: params.data.borrowerPurpose,
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
        // Create resident entity (optional path)
        const resident = await tx.residentBorrower.create({
          data: {
            name: params.data.name,
            email: params.data.email,
            phone: params.data.phone,
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
