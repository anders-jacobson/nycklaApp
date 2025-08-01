'use server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

// Server-side: Get the current user's User.id from Supabase Auth session (for Server Actions)
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

export async function getKeyStatusSummary() {
  const userId = await getCurrentUserId();
  // Get all key types for this user (cooperative)
  // If you get a type error here, run `npx prisma generate` to update your client types.
  const keyTypes = (await prisma.keyType.findMany({
    where: { userId },
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
  const userId = await getCurrentUserId();
  // Get all issue records for this user (cooperative)
  const issueRecords = await prisma.issueRecord.findMany({
    where: { userId },
    include: {
      borrower: true,
      keyCopy: {
        include: {
          keyType: true,
        },
      },
    },
  });

  return issueRecords.map((record) => {
    return {
      borrowerName: record.borrower.name,
      company: record.borrower.company ?? '',
      email: record.borrower.email ?? '',
      phone: record.borrower.phone ?? '',
      keyId: record.keyCopyId,
      keyLabel: record.keyCopy.keyType.label,
      copyNumber: record.keyCopy.copyNumber,
      borrowedAt: record.issuedDate?.toISOString() ?? '',
      returnedAt: record.returnedDate?.toISOString() ?? '',
    };
  });
}

export async function getBorrowersWithKeysGrouped() {
  const userId = await getCurrentUserId();

  // Get all active issue records (not returned) grouped by borrower
  const issueRecords = await prisma.issueRecord.findMany({
    where: {
      userId,
      returnedDate: null, // Only active loans
    },
    include: {
      borrower: true,
      keyCopy: {
        include: {
          keyType: true,
        },
      },
    },
  });

  // Group by borrower
  const borrowerMap = new Map();

  issueRecords.forEach((record) => {
    const borrowerId = record.borrower.id;

    if (!borrowerMap.has(borrowerId)) {
      // Temporary mapping: existing company field to new affiliation structure
      const hasCompany = record.borrower.company && record.borrower.company.length > 0;
      borrowerMap.set(borrowerId, {
        borrowerId: record.borrower.id,
        borrowerName: record.borrower.name,
        email: record.borrower.email ?? '',
        phone: record.borrower.phone ?? '',
        isResident: !hasCompany, // If no company, assume resident
        companyName: record.borrower.company ?? undefined,
        purposeNotes: undefined, // Will be added when DB is updated
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
  });

  return Array.from(borrowerMap.values());
}
