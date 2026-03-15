'use server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-utils';
import { getBorrowerDetails } from '@/lib/borrower-utils';
import { getEntityKey, encryptWithEntityKey } from '@/lib/entity-encryption';

type ActionResult<T = void> = T extends void
  ? { success: true } | { success: false; error: string }
  : { success: true; data: T } | { success: false; error: string };

export async function getKeyStatusSummary(): Promise<
  ActionResult<
    Array<{
      keyType: string;
      keyFunction: string;
      Available: number;
      InUse: number;
      Lost: number;
    }>
  >
> {
  try {
    const { entityId } = await getCurrentUser();
    // If you get a type error here, run `npx prisma generate` to update your client types.
    const keyTypes = await prisma.keyType.findMany({
      where: { entityId },
      select: {
        id: true,
        label: true,
        name: true,
        keyCopies: {
          select: { status: true },
        },
      },
    });

    const data = keyTypes.map((kt) => {
      const counts = { Available: 0, InUse: 0, Lost: 0 };
      kt.keyCopies.forEach((copy) => {
        if (copy.status === 'AVAILABLE') counts.Available++;
        else if (copy.status === 'OUT') counts.InUse++;
        else if (copy.status === 'LOST') counts.Lost++;
      });
      return { keyType: kt.label, keyFunction: kt.name, ...counts };
    });

    return { success: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch key status summary.';
    return { success: false, error: message };
  }
}

export async function getBorrowedKeysTableData(): Promise<
  ActionResult<
    Array<{
      borrowerName: string;
      company: string;
      email: string;
      phone: string;
      keyId: string;
      keyLabel: string;
      copyNumber: number;
      borrowedAt: string;
      returnedAt: string;
    }>
  >
> {
  try {
    const { entityId } = await getCurrentUser();
    const issueRecords = await prisma.issueRecord.findMany({
      where: { entityId },
      include: {
        borrower: {
          include: {
            residentBorrower: true,
            externalBorrower: true,
          },
        },
        keyCopy: {
          include: {
            keyType: true,
          },
        },
      },
    });

    const data = await Promise.all(
      issueRecords.map(async (record) => {
        const borrowerDetails = await getBorrowerDetails(record.borrower, entityId);
        return {
          borrowerName: borrowerDetails.name,
          company: borrowerDetails.company ?? '',
          email: borrowerDetails.email ?? '',
          phone: borrowerDetails.phone ?? '',
          keyId: record.keyCopyId,
          keyLabel: record.keyCopy.keyType.label,
          copyNumber: record.keyCopy.copyNumber,
          borrowedAt: record.issuedDate?.toISOString() ?? '',
          returnedAt: record.returnedDate?.toISOString() ?? '',
        };
      }),
    );

    return { success: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch borrowed keys.';
    return { success: false, error: message };
  }
}

export async function getBorrowersWithKeysGrouped(): Promise<ActionResult<unknown[]>> {
  try {
    const { entityId } = await getCurrentUser();

    const issueRecords = await prisma.issueRecord.findMany({
      where: {
        entityId,
        returnedDate: null, // Only active loans
      },
      include: {
        borrower: {
          include: {
            residentBorrower: true,
            externalBorrower: true,
          },
        },
        keyCopy: {
          include: {
            keyType: true,
          },
        },
      },
    });

    const borrowerMap = new Map();

    for (const record of issueRecords) {
      const borrowerId = record.borrower.id;

      if (!borrowerMap.has(borrowerId)) {
        const borrowerDetails = await getBorrowerDetails(record.borrower, entityId);
        borrowerMap.set(borrowerId, {
          borrowerId: record.borrower.id,
          borrowerName: borrowerDetails.name,
          email: borrowerDetails.email ?? '',
          phone: borrowerDetails.phone ?? '',
          isResident: borrowerDetails.affiliation === 'RESIDENT',
          companyName: borrowerDetails.company ?? undefined,
          purposeNotes: borrowerDetails.borrowerPurpose ?? undefined,
          borrowedKeys: [],
          activeLoanCount: 0,
          hasOverdue: false,
        });
      }

      const borrower = borrowerMap.get(borrowerId);
      borrower.borrowedKeys.push({
        keyLabel: record.keyCopy.keyType.label,
        copyNumber: record.keyCopy.copyNumber,
        keyFunction: record.keyCopy.keyType.name,
        borrowedAt: record.issuedDate?.toISOString() ?? '',
        dueDate: record.dueDate?.toISOString() ?? '',
        issueId: record.id,
      });
      borrower.activeLoanCount++;

      if (record.dueDate && record.dueDate < new Date()) {
        borrower.hasOverdue = true;
      }
    }

    return { success: true, data: Array.from(borrowerMap.values()) };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch borrowers with keys.';
    return { success: false, error: message };
  }
}

/**
 * Search for borrowers by name or email (for borrower search component)
 * Note: Can't search encrypted data directly, so we fetch all and filter in memory
 */
export async function searchBorrowers(searchTerm: string): Promise<
  ActionResult<
    Array<{
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
      company: string | null;
    }>
  >
> {
  try {
    const { entityId } = await getCurrentUser();

    if (!searchTerm || searchTerm.length < 2) {
      return { success: true, data: [] };
    }

    const searchLower = searchTerm.toLowerCase();

    // Fetch all borrowers (can't search encrypted data in DB)
    const borrowers = await prisma.borrower.findMany({
      where: { entityId },
      include: {
        residentBorrower: true,
        externalBorrower: true,
      },
    });

    const decryptedBorrowers = await Promise.all(
      borrowers.map(async (borrower) => {
        const details = await getBorrowerDetails(borrower, entityId);
        const nameMatch = details.name.toLowerCase().includes(searchLower);
        const emailMatch = details.email?.toLowerCase().includes(searchLower) ?? false;
        return { details, matches: nameMatch || emailMatch };
      }),
    );

    const data = decryptedBorrowers
      .filter((b) => b.matches)
      .slice(0, 10)
      .map(({ details }) => ({
        id: details.id,
        name: details.name,
        email: details.email,
        phone: details.phone,
        company: details.company,
      }));

    return { success: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to search borrowers.';
    return { success: false, error: message };
  }
}

/**
 * Update borrower purpose for external borrowers
 */
export async function updateBorrowerPurpose(
  borrowerId: string,
  purpose: string,
): Promise<ActionResult> {
  try {
    const { entityId } = await getCurrentUser();
    const entityKey = await getEntityKey(entityId);

    // Find the borrower and ensure it belongs to the current entity
    const borrower = await prisma.borrower.findFirst({
      where: {
        id: borrowerId,
        entityId,
        affiliation: 'EXTERNAL', // Only allow updating external borrowers
      },
      include: {
        externalBorrower: true,
      },
    });

    if (!borrower || !borrower.externalBorrower) {
      return { success: false, error: 'External borrower not found' };
    }

    // Update the purpose in the ExternalBorrower table
    await prisma.externalBorrower.update({
      where: {
        id: borrower.externalBorrower.id,
      },
      data: {
        borrowerPurpose: purpose.trim()
          ? (encryptWithEntityKey(purpose.trim(), entityKey) ?? null)
          : null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to update borrower purpose:', error);
    return { success: false, error: 'Failed to update borrower purpose' };
  }
}

/**
 * Get overdue loan summary statistics for horizontal bar chart
 */
export async function getOverdueSummary(): Promise<
  ActionResult<{
    category: string;
    Critical: number;
    Urgent: number;
    DueSoon: number;
    ThisWeek: number;
    Later: number;
    total: number;
  }>
> {
  try {
    const { entityId } = await getCurrentUser();
    const now = new Date();

    const activeLoans = await prisma.issueRecord.findMany({
      where: {
        entityId,
        returnedDate: null, // Only active loans
      },
      select: {
        dueDate: true,
      },
    });

    const categorized = {
      critical: 0, // 7+ days overdue
      urgent: 0, // 1-6 days overdue
      dueSoon: 0, // 0-2 days
      thisWeek: 0, // 3-7 days
      later: 0, // 8+ days or no due date
    };

    activeLoans.forEach((loan) => {
      if (!loan.dueDate) {
        categorized.later++;
        return;
      }

      const diffMs = loan.dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays < -6) {
        categorized.critical++;
      } else if (diffDays < 0) {
        categorized.urgent++;
      } else if (diffDays <= 2) {
        categorized.dueSoon++;
      } else if (diffDays <= 7) {
        categorized.thisWeek++;
      } else {
        categorized.later++;
      }
    });

    return {
      success: true,
      data: {
        category: 'Active Loans',
        Critical: categorized.critical,
        Urgent: categorized.urgent,
        DueSoon: categorized.dueSoon,
        ThisWeek: categorized.thisWeek,
        Later: categorized.later,
        total: activeLoans.length,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch overdue summary.';
    return { success: false, error: message };
  }
}
