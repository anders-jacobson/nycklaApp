'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-utils';
import { revalidatePath } from 'next/cache';
import {
  validateBorrowerData,
  createBorrowerWithAffiliation,
  findBorrowerByEmail,
  getBorrowerDetails,
} from '@/lib/borrower-utils';

type ActionResult<T> = { success: true; data?: T } | { success: false; error: string };

/**
 * Get available key types with their available copy counts
 */
export async function getAvailableKeyTypes(): Promise<
  ActionResult<
    Array<{
      id: string;
      label: string;
      function: string;
      accessArea: string | null;
      totalCopies: number;
      availableCopies: number;
      availableCopyDetails: Array<{ id: string; copyNumber: number }>;
    }>
  >
> {
  try {
    const { entityId } = await getCurrentUser();

    const keyTypes = await prisma.keyType.findMany({
      where: { entityId },
      orderBy: { label: 'asc' },
      include: {
        keyCopies: {
          select: { status: true, id: true, copyNumber: true },
        },
      },
    });

    const result = keyTypes.map((kt) => ({
      id: kt.id,
      label: kt.label,
      function: kt.function,
      accessArea: kt.accessArea,
      totalCopies: kt.keyCopies.length,
      availableCopies: kt.keyCopies.filter((copy) => copy.status === 'AVAILABLE').length,
      availableCopyDetails: kt.keyCopies
        .filter((copy) => copy.status === 'AVAILABLE')
        .map((copy) => ({ id: copy.id, copyNumber: copy.copyNumber })),
    }));

    return { success: true, data: result };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch key types.';
    return { success: false, error: message };
  }
}

/**
 * Check if a key type has available copies for issuing
 */
export async function checkKeyAvailability(keyTypeId: string): Promise<
  ActionResult<{
    hasAvailable: boolean;
    availableCount: number;
    keyType: {
      label: string;
      function: string;
    };
  }>
> {
  try {
    const { entityId } = await getCurrentUser();

    const keyType = await prisma.keyType.findFirst({
      where: { id: keyTypeId, entityId },
      select: {
        label: true,
        function: true,
        keyCopies: {
          where: { status: 'AVAILABLE' },
          select: { id: true },
        },
      },
    });

    if (!keyType) {
      return { success: false, error: 'Key type not found.' };
    }

    return {
      success: true,
      data: {
        hasAvailable: keyType.keyCopies.length > 0,
        availableCount: keyType.keyCopies.length,
        keyType: {
          label: keyType.label,
          function: keyType.function,
        },
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to check availability.';
    return { success: false, error: message };
  }
}

/**
 * Issue a key to a borrower (main workflow function)
 */
export async function issueKey(formData: FormData): Promise<
  ActionResult<{
    issueId: string;
    keyInfo: string;
    borrowerName: string;
  }>
> {
  try {
    const { id: userId, entityId } = await getCurrentUser();

    // Extract form data
    const keyTypeId = (formData.get('keyTypeId') as string | null) ?? '';
    const keyCopyId = (formData.get('keyCopyId') as string | null) || undefined;
    const borrowerName = (formData.get('borrowerName') as string | null)?.trim() ?? '';
    const borrowerEmail = (formData.get('borrowerEmail') as string | null)?.trim() ?? '';
    const borrowerPhone = (formData.get('borrowerPhone') as string | null)?.trim() || undefined;
    const borrowerCompany = (formData.get('borrowerCompany') as string | null)?.trim() || undefined;
    const borrowerAddress = (formData.get('borrowerAddress') as string | null)?.trim() || undefined;
    const borrowerPurpose = (formData.get('borrowerPurpose') as string | null)?.trim() || undefined;
    const dueDate = (formData.get('dueDate') as string | null) || undefined;
    const idChecked = formData.get('idChecked') === 'true';
    const borrowerId = (formData.get('borrowerId') as string | null) || undefined;

    // Validation
    if (!keyTypeId) {
      return { success: false, error: 'Key type is required.' };
    }

    // Validate borrower data
    const validation = validateBorrowerData({
      name: borrowerName,
      email: borrowerEmail,
      phone: borrowerPhone,
      company: borrowerCompany,
      borrowerPurpose: borrowerPurpose,
    });

    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      return { success: false, error: firstError };
    }

    // Check if key type has available copies
    const availabilityCheck = await checkKeyAvailability(keyTypeId);
    if (!availabilityCheck.success) {
      return { success: false, error: availabilityCheck.error };
    }

    if (!availabilityCheck.data?.hasAvailable) {
      return {
        success: false,
        error: `No available copies of ${availabilityCheck.data?.keyType.label} - ${availabilityCheck.data?.keyType.function}. Would you like to create a new copy first?`,
      };
    }

    // Execute the key issuing transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Find an available key copy
      const availableCopy = keyCopyId
        ? await tx.keyCopy.findFirst({
            where: {
              id: keyCopyId,
              keyTypeId,
              status: 'AVAILABLE',
            },
            include: { keyType: { select: { label: true, function: true } } },
          })
        : await tx.keyCopy.findFirst({
            where: { keyTypeId, status: 'AVAILABLE' },
            include: { keyType: { select: { label: true, function: true } } },
            orderBy: { copyNumber: 'asc' },
          });

      if (!availableCopy) {
        throw new Error('No available copies found.');
      }

      // 2. Find or create borrower
      let borrower;
      if (borrowerId) {
        // Use existing borrower
        borrower = await tx.borrower.findFirst({
          where: {
            id: borrowerId,
            entityId, // Ensure borrower belongs to current entity
          },
          include: {
            residentBorrower: true,
            externalBorrower: true,
          },
        });
        if (!borrower) {
          throw new Error('Borrower not found or access denied.');
        }
      } else {
        // Find existing borrower by email or create new one
        borrower = await findBorrowerByEmail(validation.sanitized.email, entityId);

        if (!borrower) {
          // Create new borrower with affiliation structure
          borrower = await createBorrowerWithAffiliation(
            {
              name: validation.sanitized.name,
              email: validation.sanitized.email,
              phone: validation.sanitized.phone,
              company: validation.sanitized.company,
              address: borrowerAddress,
              borrowerPurpose: validation.sanitized.borrowerPurpose,
            },
            entityId,
            tx, // Pass transaction
          );
        }
      }

      // 3. Mark key as OUT
      await tx.keyCopy.update({
        where: { id: availableCopy.id },
        data: { status: 'OUT' },
      });

      // 4. Create issue record
      const issueRecord = await tx.issueRecord.create({
        data: {
          keyCopyId: availableCopy.id,
          borrowerId: borrower.id,
          entityId,
          userId, // Keep for audit trail
          dueDate: dueDate ? new Date(dueDate) : null,
          idChecked,
        },
        select: { id: true },
      });

      const borrowerDetails = await getBorrowerDetails(borrower, entityId);

      return {
        issueId: issueRecord.id,
        keyInfo: `${availableCopy.keyType.label}-${availableCopy.copyNumber} (${availableCopy.keyType.function})`,
        borrowerName: borrowerDetails.name,
      };
    });

    // Revalidate pages to show updated data
    revalidatePath('/active-loans');
    revalidatePath('/keys');

    return { success: true, data: result };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to issue key.';
    return { success: false, error: message };
  }
}

/**
 * Get a specific available key copy for preview (used in confirmation step)
 */
export async function getAvailableKeyCopy(keyTypeId: string): Promise<
  ActionResult<{
    copyNumber: number;
    keyLabel: string;
    keyFunction: string;
  }>
> {
  try {
    const { entityId } = await getCurrentUser();

    const keyCopy = await prisma.keyCopy.findFirst({
      where: {
        keyTypeId,
        status: 'AVAILABLE',
        keyType: { entityId },
      },
      include: {
        keyType: {
          select: { label: true, function: true },
        },
      },
      orderBy: { copyNumber: 'asc' },
    });

    if (!keyCopy) {
      return { success: false, error: 'No available copies found.' };
    }

    return {
      success: true,
      data: {
        copyNumber: keyCopy.copyNumber,
        keyLabel: keyCopy.keyType.label,
        keyFunction: keyCopy.keyType.function,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get key copy.';
    return { success: false, error: message };
  }
}

/**
 * Return a key: mark issue as returned and set the key copy back to AVAILABLE.
 * If the borrower has no other active loans, delete the borrower (GDPR cleanup).
 */
export async function returnKey(issueRecordId: string): Promise<ActionResult<undefined>> {
  try {
    const { entityId } = await getCurrentUser();

    await prisma.$transaction(async (tx) => {
      // 1. Fetch and validate the issue record for the current entity
      const issueRecord = await tx.issueRecord.findFirst({
        where: { id: issueRecordId, entityId },
        include: { keyCopy: true },
      });

      if (!issueRecord) {
        throw new Error('Issue record not found.');
      }

      if (issueRecord.returnedDate) {
        throw new Error('Key already returned.');
      }

      // 2. Mark the issue as returned
      await tx.issueRecord.update({
        where: { id: issueRecordId },
        data: { returnedDate: new Date() },
      });

      // 3. Set the key copy back to AVAILABLE
      await tx.keyCopy.update({
        where: { id: issueRecord.keyCopyId },
        data: { status: 'AVAILABLE' },
      });

      // 4. If borrower has no other active loans, delete borrower
      const otherActiveLoans = await tx.issueRecord.count({
        where: {
          borrowerId: issueRecord.borrowerId,
          returnedDate: null,
          id: { not: issueRecordId },
        },
      });

      if (otherActiveLoans === 0) {
        await tx.borrower.delete({ where: { id: issueRecord.borrowerId } });
      }
    });

    // Revalidate affected pages
    revalidatePath('/active-loans');
    revalidatePath('/keys');
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to return key.';
    return { success: false, error: message };
  }
}

/**
 * Mark a key as LOST. Optionally create a replacement copy and optionally issue it to the same borrower.
 */
export async function markKeyLost(params: {
  issueRecordId: string;
  createReplacement?: boolean;
  issueReplacement?: boolean;
  idChecked?: boolean;
  dueDate?: string;
}): Promise<
  ActionResult<{
    replacementCopyId?: string;
  }>
> {
  try {
    const user = await getCurrentUser();
    if (!['OWNER', 'ADMIN'].includes(user.roleInActiveOrg)) {
      return { success: false, error: 'Only owners and admins can mark keys as lost.' };
    }
    const { entityId, id: userId } = user;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Load current issue record with key info and borrower
      const issueRecord = await tx.issueRecord.findFirst({
        where: { id: params.issueRecordId, entityId },
        include: {
          keyCopy: {
            include: { keyType: { select: { id: true } } },
          },
        },
      });

      if (!issueRecord) {
        throw new Error('Issue record not found.');
      }
      if (issueRecord.returnedDate) {
        throw new Error('Key already returned.');
      }

      // 2. Mark current copy as LOST
      await tx.keyCopy.update({
        where: { id: issueRecord.keyCopyId },
        data: { status: 'LOST' },
      });

      // 3. Close the current issue record
      await tx.issueRecord.update({
        where: { id: issueRecord.id },
        data: { returnedDate: new Date() },
      });

      let replacementCopyId: string | undefined;

      // 4. Optionally create a replacement copy
      if (params.createReplacement) {
        // Get next copy number for this key type
        const maxCopy = await tx.keyCopy.findFirst({
          where: { keyTypeId: issueRecord.keyCopy.keyTypeId },
          orderBy: { copyNumber: 'desc' },
          select: { copyNumber: true },
        });
        const nextCopyNumber = (maxCopy?.copyNumber ?? 0) + 1;

        const replacement = await tx.keyCopy.create({
          data: {
            keyTypeId: issueRecord.keyCopy.keyTypeId,
            copyNumber: nextCopyNumber,
            status: params.issueReplacement ? 'OUT' : 'AVAILABLE',
          },
          select: { id: true },
        });

        replacementCopyId = replacement.id;

        // 5. If issuing the replacement, create a new issue record to same borrower
        if (params.issueReplacement) {
          await tx.issueRecord.create({
            data: {
              keyCopyId: replacement.id,
              borrowerId: issueRecord.borrowerId,
              entityId,
              userId, // Keep for audit trail
              dueDate: params.dueDate ? new Date(params.dueDate) : null,
              idChecked: !!params.idChecked,
            },
          });
        }
      }

      // 6. If we did NOT issue a replacement, check borrower cleanup
      if (!params.issueReplacement) {
        const otherActiveLoans = await tx.issueRecord.count({
          where: {
            borrowerId: issueRecord.borrowerId,
            returnedDate: null,
          },
        });

        if (otherActiveLoans === 0) {
          await tx.borrower.delete({ where: { id: issueRecord.borrowerId } });
        }
      }

      return { replacementCopyId };
    });

    revalidatePath('/active-loans');
    revalidatePath('/keys');
    return { success: true, data: result };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to mark key as lost.';
    return { success: false, error: message };
  }
}
