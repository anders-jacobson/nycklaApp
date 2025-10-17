'use server';

import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

type ActionResult<T> = { success: true; data?: T } | { success: false; error: string };

async function getCurrentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) throw new Error('Not authenticated');
  const userRecord = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true },
  });
  if (!userRecord) throw new Error('User not found');
  return userRecord.id;
}

export async function checkEmailExists(
  email: string,
  excludeBorrowerId?: string,
): Promise<ActionResult<{ exists: boolean }>> {
  try {
    const userId = await getCurrentUserId();

    const count = await prisma.borrower.count({
      where: {
        userId,
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
    const userId = await getCurrentUserId();

    await prisma.$transaction(async (tx) => {
      const borrower = await tx.borrower.findFirst({
        where: { id: params.borrowerId, userId },
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
