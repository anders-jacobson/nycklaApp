'use server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

type ActionResult = { success: true } | { success: false; error: string };

export async function updateUser({
  email,
  name,
}: {
  email: string;
  name?: string;
}): Promise<ActionResult> {
  if (!email) {
    return { success: false, error: 'Email is required.' };
  }

  try {
    // Get the current authenticated user from Supabase
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Not authenticated.' };
    }

    // Update user profile - entity cannot be changed after registration
    await prisma.user.update({
      where: { id: user.id }, // UUID lookup instead of email
      data: {
        name: name || undefined,
      },
    });

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Något gick fel vid uppdatering.';
    return { success: false, error: message };
  }
}
