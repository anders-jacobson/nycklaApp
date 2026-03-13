'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { getBorrowerDetails } from '@/lib/borrower-utils';

async function getCurrentUserInfo() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) throw new Error('Not authenticated');

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true, activeOrganisationId: true },
  });
  if (!dbUser || !dbUser.activeOrganisationId) throw new Error('User not found');
  return { id: dbUser.id, entityId: dbUser.activeOrganisationId };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const { entityId } = await getCurrentUserInfo();

    // Fetch all borrowers (can't search encrypted data in DB)
    const borrowers = await prisma.borrower.findMany({
      where: { entityId },
      include: { residentBorrower: true, externalBorrower: true },
    });

    // Decrypt and filter in memory
    const decryptedBorrowers = await Promise.all(
      borrowers.map(async (b) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const details = await getBorrowerDetails(b as any, entityId);
        return { ...details, matches: details.name.toLowerCase().includes(q) };
      }),
    );

    // Filter and limit results
    const results = decryptedBorrowers
      .filter((b) => b.matches)
      .slice(0, 10)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(({ matches: _m, ...rest }) => rest);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ results: [], error: 'Search failed' }, { status: 200 });
  }
}
