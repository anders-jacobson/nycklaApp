'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { getBorrowerDetails } from '@/lib/borrower-utils';

async function getCurrentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) throw new Error('Not authenticated');

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true },
  });
  if (!dbUser) throw new Error('User not found');
  return dbUser.id;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const userId = await getCurrentUserId();
    const borrowers = await prisma.borrower.findMany({
      where: {
        userId,
        OR: [
          { residentBorrower: { name: { contains: q, mode: 'insensitive' } } },
          { externalBorrower: { name: { contains: q, mode: 'insensitive' } } },
        ],
      },
      include: { residentBorrower: true, externalBorrower: true },
      take: 10,
    });

    const results = borrowers.map((b) => getBorrowerDetails(b as any));
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ results: [], error: 'Search failed' }, { status: 200 });
  }
}




