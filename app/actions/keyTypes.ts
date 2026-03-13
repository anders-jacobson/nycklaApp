'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-utils';
import { revalidatePath } from 'next/cache';

type ActionResult<T> = { success: true; data?: T } | { success: false; error: string };

export async function createKeyType(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const { entityId } = await getCurrentUser();

    // Inputs (do NOT accept any entity identifiers from client)
    const name = (formData.get('name') as string | null)?.trim() ?? '';
    const labelRaw = (formData.get('label') as string | null)?.trim() ?? '';
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
          entityId,
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
    const user = await getCurrentUser();
    if (!['OWNER', 'ADMIN'].includes(user.roleInActiveOrg)) {
      return { success: false, error: 'Only owners and admins can update key types.' };
    }
    const { entityId } = user;

    const keyTypeId = (formData.get('id') as string | null) ?? '';
    const name = (formData.get('name') as string | null)?.trim() ?? undefined;
    const accessAreaIds = formData.getAll('accessAreaIds') as string[];

    if (!keyTypeId) return { success: false, error: 'Missing key type id.' };

    await prisma.$transaction(async (tx) => {
      // Ensure the key type belongs to the current entity
      const exists = await tx.keyType.findFirst({
        where: { id: keyTypeId, entityId },
        select: { id: true },
      });
      if (!exists) throw new Error('Key type not found.');

      if (typeof name === 'string') {
        if (name.length < 2) throw new Error('Name must be at least 2 characters.');
        await tx.keyType.update({ where: { id: keyTypeId }, data: { function: name } });
      }

      // Sync access areas: validate each ID belongs to the entity, then replace
      const validAreas = await tx.accessArea.findMany({
        where: { id: { in: accessAreaIds }, entityId },
        select: { id: true },
      });
      const validAreaIds = validAreas.map((a) => a.id);

      await tx.keyTypeAccessArea.deleteMany({ where: { keyTypeId } });
      if (validAreaIds.length > 0) {
        await tx.keyTypeAccessArea.createMany({
          data: validAreaIds.map((accessAreaId) => ({ keyTypeId, accessAreaId })),
        });
      }
    });

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
    const user = await getCurrentUser();
    if (!['OWNER', 'ADMIN'].includes(user.roleInActiveOrg)) {
      return { success: false, error: 'Only owners and admins can delete key types.' };
    }
    const { entityId } = user;
    const keyTypeId = (formData.get('id') as string | null) ?? '';
    if (!keyTypeId) return { success: false, error: 'Missing key type id.' };

    // Verify ownership before delete
    const owned = await prisma.keyType.findFirst({
      where: { id: keyTypeId, entityId },
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
    const user = await getCurrentUser();
    if (!['OWNER', 'ADMIN'].includes(user.roleInActiveOrg)) {
      return { success: false, error: 'Only owners and admins can add key copies.' };
    }
    const { entityId } = user;
    const keyTypeId = (formData.get('id') as string | null) ?? '';
    if (!keyTypeId) return { success: false, error: 'Missing key type id.' };

    // Verify ownership and get current max copy number
    const keyType = await prisma.keyType.findFirst({
      where: { id: keyTypeId, entityId },
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

export async function getKeyCopies(keyTypeId: string): Promise<
  ActionResult<
    Array<{
      id: string;
      copyNumber: number;
      status: 'AVAILABLE' | 'OUT' | 'LOST';
    }>
  >
> {
  try {
    const { entityId } = await getCurrentUser();
    const keyType = await prisma.keyType.findFirst({
      where: { id: keyTypeId, entityId },
      select: {
        keyCopies: {
          select: { id: true, copyNumber: true, status: true },
          orderBy: { copyNumber: 'asc' },
        },
      },
    });
    if (!keyType) return { success: false, error: 'Key type not found.' };
    return {
      success: true,
      data: keyType.keyCopies as Array<{
        id: string;
        copyNumber: number;
        status: 'AVAILABLE' | 'OUT' | 'LOST';
      }>,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch key copies.';
    return { success: false, error: message };
  }
}

export async function markAvailableCopyLost(copyId: string): Promise<ActionResult<undefined>> {
  try {
    const user = await getCurrentUser();
    if (!['OWNER', 'ADMIN'].includes(user.roleInActiveOrg)) {
      return { success: false, error: 'Only owners and admins can mark keys as lost.' };
    }
    const { entityId } = user;
    // Verify ownership and status
    const copy = await prisma.keyCopy.findFirst({
      where: { id: copyId, keyType: { entityId } },
      select: { id: true, status: true },
    });
    if (!copy) return { success: false, error: 'Key copy not found.' };
    if (copy.status !== 'AVAILABLE') {
      return { success: false, error: 'Only AVAILABLE copies can be marked as lost here.' };
    }

    await prisma.keyCopy.update({ where: { id: copyId }, data: { status: 'LOST' } });
    revalidatePath('/keys');
    revalidatePath('/active-loans');
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to mark copy as lost.';
    return { success: false, error: message };
  }
}

export async function markLostCopyFound(copyId: string): Promise<ActionResult<undefined>> {
  try {
    const user = await getCurrentUser();
    if (!['OWNER', 'ADMIN'].includes(user.roleInActiveOrg)) {
      return { success: false, error: 'Only owners and admins can mark lost keys as found.' };
    }
    const { entityId } = user;
    // Verify ownership and status
    const copy = await prisma.keyCopy.findFirst({
      where: { id: copyId, keyType: { entityId } },
      select: { id: true, status: true },
    });
    if (!copy) return { success: false, error: 'Key copy not found.' };
    if (copy.status !== 'LOST') {
      return { success: false, error: 'Only LOST copies can be marked as found.' };
    }

    await prisma.keyCopy.update({ where: { id: copyId }, data: { status: 'AVAILABLE' } });
    revalidatePath('/keys');
    revalidatePath('/active-loans');
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to mark copy as found.';
    return { success: false, error: message };
  }
}
