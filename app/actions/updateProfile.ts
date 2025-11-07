'use server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function updateUser({ email, name }: { email: string; name?: string }) {
  if (!email) {
    return { error: 'Email is required.' };
  }

  try {
    // Get the current authenticated user from Supabase
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Not authenticated.' };
    }

    // Update user profile - entity cannot be changed after registration
    await prisma.user.update({
      where: { email },
      data: {
        name: name || undefined,
      },
    });

    return { success: true };
  } catch (error: unknown) {
    let message = 'Något gick fel vid uppdatering.';
    if (error instanceof Error) message = error.message;
    return { error: message };
  }
}
