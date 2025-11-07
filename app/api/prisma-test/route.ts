import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 1. Create a test user (if not exists)
    const email = 'testuser@example.com';
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        // cooperative field removed - now using Entity model
        name: 'Initial Name',
      },
    });

    // 2. Read the user
    const readUser = await prisma.user.findUnique({ where: { email } });

    // 3. Update the user's name
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { name: 'Updated Name' },
    });

    // 4. Delete the user
    const deletedUser = await prisma.user.delete({ where: { email } });

    return NextResponse.json({
      success: true,
      created: user,
      read: readUser,
      updated: updatedUser,
      deleted: deletedUser,
    });
  } catch (error: unknown) {
    let message = 'Unknown error';
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
