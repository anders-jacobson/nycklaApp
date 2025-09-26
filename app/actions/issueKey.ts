'use server';

import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  validateBorrowerData,
  createBorrowerWithAffiliation,
  findBorrowerByEmail,
  getBorrowerDetails,
} from '@/lib/borrower-utils';

type ActionResult<T> = { success: true; data?: T } | { success: false; error: string };

async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user?.email) throw new Error('Not authenticated');

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true, cooperative: true },
  });
  if (!dbUser) throw new Error('User not found');
  return dbUser;
}

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
    }>
  >
> {
  try {
    const { id: userId } = await getCurrentUser();

    const keyTypes = await prisma.keyType.findMany({
      where: { userId },
      orderBy: { label: 'asc' },
      include: {
        keyCopies: {
          select: { status: true },
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
    const { id: userId } = await getCurrentUser();

    const keyType = await prisma.keyType.findFirst({
      where: { id: keyTypeId, userId },
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
    const { id: userId } = await getCurrentUser();

    // Extract form data
    const keyTypeId = (formData.get('keyTypeId') as string | null) ?? '';
    const borrowerName = (formData.get('borrowerName') as string | null)?.trim() ?? '';
    const borrowerEmail = (formData.get('borrowerEmail') as string | null)?.trim() ?? '';
    const borrowerPhone = (formData.get('borrowerPhone') as string | null)?.trim() || undefined;
    const borrowerCompany = (formData.get('borrowerCompany') as string | null)?.trim() || undefined;
    const borrowerPurpose = (formData.get('borrowerPurpose') as string | null)?.trim() || undefined;
    const dueDate = (formData.get('dueDate') as string | null) || undefined;
    const notes = (formData.get('notes') as string | null)?.trim() || undefined;
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
      const availableCopy = await tx.keyCopy.findFirst({
        where: {
          keyTypeId,
          status: 'AVAILABLE',
        },
        include: {
          keyType: {
            select: { label: true, function: true },
          },
        },
        orderBy: { copyNumber: 'asc' }, // Issue lowest numbered copy first
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
            userId, // Ensure borrower belongs to current user
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
        borrower = await findBorrowerByEmail(validation.sanitized.email, userId);

        if (!borrower) {
          // Create new borrower with affiliation structure
          borrower = await createBorrowerWithAffiliation(
            {
              name: validation.sanitized.name,
              email: validation.sanitized.email,
              phone: validation.sanitized.phone,
              company: validation.sanitized.company,
              borrowerPurpose: validation.sanitized.borrowerPurpose,
            },
            userId,
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
          userId,
          dueDate: dueDate ? new Date(dueDate) : null,
          notes,
          idChecked,
        },
        select: { id: true },
      });

      const borrowerDetails = getBorrowerDetails(borrower);

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
    const { id: userId } = await getCurrentUser();

    const keyCopy = await prisma.keyCopy.findFirst({
      where: {
        keyTypeId,
        status: 'AVAILABLE',
        keyType: { userId },
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
