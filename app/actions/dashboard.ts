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
  // Get all lending records for this user (cooperative)
  const lendingRecords = await prisma.lendingRecord.findMany({
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

  return lendingRecords.map((record) => {
    return {
      borrowerName: record.borrower.name,
      company: record.borrower.company ?? '',
      email: record.borrower.email ?? '',
      phone: record.borrower.phone ?? '',
      keyId: record.keyCopyId,
      keyLabel: record.keyCopy.keyType.label,
      copyNumber: record.keyCopy.copyNumber,
      borrowedAt: record.lentDate?.toISOString() ?? '',
      returnedAt: record.returnedDate?.toISOString() ?? '',
    };
  });
}

export async function getBorrowersWithKeysGrouped() {
  const userId = await getCurrentUserId();

  // Get all active lending records (not returned) grouped by borrower
  const lendingRecords = await prisma.lendingRecord.findMany({
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

  lendingRecords.forEach((record) => {
    const borrowerId = record.borrower.id;

    if (!borrowerMap.has(borrowerId)) {
      borrowerMap.set(borrowerId, {
        borrowerId: record.borrower.id,
        borrowerName: record.borrower.name,
        email: record.borrower.email ?? '',
        phone: record.borrower.phone ?? '',
        company: record.borrower.company ?? '',
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
      borrowedAt: record.lentDate?.toISOString() ?? '',
      endDate: record.endDate?.toISOString() ?? '',
      lendingId: record.id,
    });
    borrower.activeLoanCount++;

    // Check if overdue (simple check - if endDate is past)
    if (record.endDate && record.endDate < new Date()) {
      borrower.hasOverdue = true;
    }
  });

  return Array.from(borrowerMap.values());
}
