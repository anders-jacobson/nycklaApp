'use server';

import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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

export async function createKeyType(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const { id: userId } = await getCurrentUser();

    // Inputs (do NOT accept any cooperative/user identifiers from client)
    const name = (formData.get('name') as string | null)?.trim() ?? '';
    const labelRaw = (formData.get('label') as string | null)?.trim() ?? '';
    const accessArea = (formData.get('accessArea') as string | null)?.trim() || null;
    const totalCopiesRaw = (formData.get('totalCopies') as string | number | null) ?? '0';

    // Validation
    if (!name || name.length < 2) {
      return { success: false, error: 'Name must be at least 2 characters.' };
    }
    const label = labelRaw.toUpperCase();
    if (!label || label.length > 2) {
      return { success: false, error: 'Label is required and must be max 2 characters.' };
    }

    const totalCopies =
      typeof totalCopiesRaw === 'number' ? totalCopiesRaw : parseInt(String(totalCopiesRaw), 10);
    if (Number.isNaN(totalCopies) || totalCopies < 0) {
      return { success: false, error: 'Total copies must be a number greater than or equal to 0.' };
    }

    const result = await prisma.$transaction(async (tx) => {
      const keyType = await tx.keyType.create({
        data: {
          label,
          function: name,
          accessArea: accessArea || undefined,
          userId,
        },
        select: { id: true },
      });

      if (totalCopies > 0) {
        // Generate sequential copy numbers starting at 1
        const copies = Array.from({ length: totalCopies }, (_, idx) => ({
          keyTypeId: keyType.id,
          copyNumber: idx + 1,
        }));
        await tx.keyCopy.createMany({ data: copies });
      }

      return keyType;
    });

    revalidatePath('/active-loans');
    revalidatePath('/keys');
    return { success: true, data: { id: result.id } };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create key type.';
    return { success: false, error: message };
  }
}

export async function updateKeyType(formData: FormData): Promise<ActionResult<undefined>> {
  try {
    const { id: userId } = await getCurrentUser();

    const keyTypeId = (formData.get('id') as string | null) ?? '';
    const name = (formData.get('name') as string | null)?.trim() ?? undefined;
    const accessArea = (formData.get('accessArea') as string | null)?.trim() ?? undefined;

    if (!keyTypeId) return { success: false, error: 'Missing key type id.' };

    // Ensure the key type belongs to the current user (RLS-compatible scoping)
    const exists = await prisma.keyType.findFirst({
      where: { id: keyTypeId, userId },
      select: { id: true },
    });
    if (!exists) return { success: false, error: 'Key type not found.' };

    const data: { function?: string; accessArea?: string | null } = {};
    if (typeof name === 'string') {
      if (name.length < 2) return { success: false, error: 'Name must be at least 2 characters.' };
      data.function = name;
    }
    if (typeof accessArea === 'string') {
      data.accessArea = accessArea.length > 0 ? accessArea : null;
    }

    await prisma.keyType.update({ where: { id: keyTypeId }, data });

    revalidatePath('/active-loans');
    revalidatePath('/keys');
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update key type.';
    return { success: false, error: message };
  }
}

export async function deleteKeyType(formData: FormData): Promise<ActionResult<undefined>> {
  try {
    const { id: userId } = await getCurrentUser();
    const keyTypeId = (formData.get('id') as string | null) ?? '';
    if (!keyTypeId) return { success: false, error: 'Missing key type id.' };

    // Verify ownership before delete
    const owned = await prisma.keyType.findFirst({
      where: { id: keyTypeId, userId },
      select: { id: true },
    });
    if (!owned) return { success: false, error: 'Key type not found.' };

    await prisma.keyType.delete({ where: { id: keyTypeId } });

    revalidatePath('/active-loans');
    revalidatePath('/keys');
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete key type.';
    return { success: false, error: message };
  }
}

export async function addKeyCopy(formData: FormData): Promise<ActionResult<undefined>> {
  try {
    const { id: userId } = await getCurrentUser();
    const keyTypeId = (formData.get('id') as string | null) ?? '';
    if (!keyTypeId) return { success: false, error: 'Missing key type id.' };

    // Verify ownership and get current max copy number
    const keyType = await prisma.keyType.findFirst({
      where: { id: keyTypeId, userId },
      include: {
        keyCopies: {
          orderBy: { copyNumber: 'desc' },
          take: 1,
          select: { copyNumber: true },
        },
      },
    });

    if (!keyType) return { success: false, error: 'Key type not found.' };

    // Get next copy number (highest + 1, or 1 if no copies exist)
    const nextCopyNumber = keyType.keyCopies.length > 0 ? keyType.keyCopies[0].copyNumber + 1 : 1;

    // Create new key copy
    await prisma.keyCopy.create({
      data: {
        keyTypeId,
        copyNumber: nextCopyNumber,
        status: 'AVAILABLE',
      },
    });

    revalidatePath('/active-loans');
    revalidatePath('/keys');
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to add key copy.';
    return { success: false, error: message };
  }
}
