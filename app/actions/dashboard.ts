'use server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-utils';
import { getBorrowerDetails } from '@/lib/borrower-utils';

// Helper to get entityId for dashboard queries
async function getEntityId() {
  const user = await getCurrentUser();
  return user.entityId;
}

export async function getKeyStatusSummary() {
  const entityId = await getEntityId();
  // Get all key types for this entity
  // If you get a type error here, run `npx prisma generate` to update your client types.
  const keyTypes = (await prisma.keyType.findMany({
    where: { entityId },
    select: {
      id: true,
      label: true,
      function: true,
      keyCopies: {
        select: { status: true },
      },
    },
  })) as unknown as Array<{
    id: string;
    label: string;
    function: string;
    keyCopies: { status: string }[];
  }>;

  // Aggregate counts for each status
  return keyTypes.map((kt) => {
    const counts = { Available: 0, InUse: 0, Lost: 0 };
    kt.keyCopies.forEach((copy) => {
      if (copy.status === 'AVAILABLE') counts.Available++;
      else if (copy.status === 'OUT') counts.InUse++;
      else if (copy.status === 'LOST') counts.Lost++;
    });
    return {
      keyType: kt.label,
      keyFunction: kt.function,
      ...counts,
    };
  });
}

export async function getBorrowedKeysTableData() {
  const entityId = await getEntityId();
  // Get all issue records for this entity
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

  // Map with async decryption
  return await Promise.all(
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
}

export async function getBorrowersWithKeysGrouped() {
  const entityId = await getEntityId();

  // Get all active issue records (not returned) grouped by borrower
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

  // Group by borrower
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
      keyFunction: record.keyCopy.keyType.function,
      borrowedAt: record.issuedDate?.toISOString() ?? '',
      dueDate: record.dueDate?.toISOString() ?? '',
      issueId: record.id,
    });
    borrower.activeLoanCount++;

    // Check if overdue (simple check - if dueDate is past)
    if (record.dueDate && record.dueDate < new Date()) {
      borrower.hasOverdue = true;
    }
  }

  return Array.from(borrowerMap.values());
}

/**
 * Search for borrowers by name or email (for borrower search component)
 * Note: Can't search encrypted data directly, so we fetch all and filter in memory
 */
export async function searchBorrowers(searchTerm: string) {
  const entityId = await getEntityId();

  if (!searchTerm || searchTerm.length < 2) {
    return [];
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

  // Decrypt and filter in memory
  const decryptedBorrowers = await Promise.all(
    borrowers.map(async (borrower) => {
      const details = await getBorrowerDetails(borrower, entityId);
      const nameMatch = details.name.toLowerCase().includes(searchLower);
      const emailMatch = details.email.toLowerCase().includes(searchLower);
      return { details, matches: nameMatch || emailMatch };
    }),
  );

  // Filter and limit results
  return decryptedBorrowers
    .filter((b) => b.matches)
    .slice(0, 10)
    .map(({ details }) => ({
      id: details.id,
      name: details.name,
      email: details.email,
      phone: details.phone,
      company: details.company,
    }));
}

/**
 * Update borrower purpose for external borrowers
 */
export async function updateBorrowerPurpose(
  borrowerId: string,
  purpose: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const entityId = await getEntityId();

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
        borrowerPurpose: purpose.trim() || null,
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
export async function getOverdueSummary() {
  const entityId = await getEntityId();
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

  // Calculate days difference for each loan
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
      // 7+ days overdue (negative means overdue)
      categorized.critical++;
    } else if (diffDays < 0) {
      // 1-6 days overdue
      categorized.urgent++;
    } else if (diffDays <= 2) {
      // Due today, tomorrow, or day after
      categorized.dueSoon++;
    } else if (diffDays <= 7) {
      // Due in 3-7 days
      categorized.thisWeek++;
    } else {
      // Due in 8+ days
      categorized.later++;
    }
  });

  return {
    category: 'Active Loans',
    Critical: categorized.critical,
    Urgent: categorized.urgent,
    DueSoon: categorized.dueSoon,
    ThisWeek: categorized.thisWeek,
    Later: categorized.later,
    total: activeLoans.length,
  };
}
