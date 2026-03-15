'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-utils';
import { revalidatePath } from 'next/cache';

type ActionResult<T> = { success: true; data?: T } | { success: false; error: string };

export type AccessAreaData = {
  id: string;
  name: string;
  _count: { keyTypes: number };
  keyTypes: { keyType: { id: string; label: string } }[];
};

export async function getAccessAreas(): Promise<ActionResult<AccessAreaData[]>> {
  try {
    const { entityId } = await getCurrentUser();
    const areas = await prisma.accessArea.findMany({
      where: { entityId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        _count: { select: { keyTypes: true } },
        keyTypes: {
          select: {
            keyType: { select: { id: true, label: true } },
          },
          orderBy: { keyType: { label: 'asc' } },
        },
      },
    });
    return { success: true, data: areas };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch access areas.';
    return { success: false, error: message };
  }
}

export async function createAccessArea(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!['OWNER', 'ADMIN'].includes(user.roleInActiveOrg)) {
      return { success: false, error: 'Only owners and admins can create access areas.' };
    }
    const { entityId } = user;
    const name = (formData.get('name') as string | null)?.trim() ?? '';
    if (!name) return { success: false, error: 'Name is required.' };

    const area = await prisma.accessArea.create({
      data: { name, entityId },
      select: { id: true },
    });

    revalidatePath('/[locale]/keys');
    revalidatePath('/[locale]/settings/access-areas');
    return { success: true, data: { id: area.id } };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create access area.';
    return { success: false, error: message };
  }
}

export async function updateAccessArea(formData: FormData): Promise<ActionResult<undefined>> {
  try {
    const user = await getCurrentUser();
    if (!['OWNER', 'ADMIN'].includes(user.roleInActiveOrg)) {
      return { success: false, error: 'Only owners and admins can update access areas.' };
    }
    const { entityId } = user;
    const id = (formData.get('id') as string | null) ?? '';
    const name = (formData.get('name') as string | null)?.trim() ?? '';

    if (!id) return { success: false, error: 'Missing access area id.' };
    if (!name) return { success: false, error: 'Name is required.' };

    const owned = await prisma.accessArea.findFirst({
      where: { id, entityId },
      select: { id: true },
    });
    if (!owned) return { success: false, error: 'Access area not found.' };

    await prisma.accessArea.update({ where: { id }, data: { name } });

    revalidatePath('/[locale]/keys');
    revalidatePath('/[locale]/settings/access-areas');
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update access area.';
    return { success: false, error: message };
  }
}

export async function deleteAccessArea(formData: FormData): Promise<ActionResult<undefined>> {
  try {
    const user = await getCurrentUser();
    if (!['OWNER', 'ADMIN'].includes(user.roleInActiveOrg)) {
      return { success: false, error: 'Only owners and admins can delete access areas.' };
    }
    const { entityId } = user;
    const id = (formData.get('id') as string | null) ?? '';
    if (!id) return { success: false, error: 'Missing access area id.' };

    const owned = await prisma.accessArea.findFirst({
      where: { id, entityId },
      select: { id: true },
    });
    if (!owned) return { success: false, error: 'Access area not found.' };

    await prisma.accessArea.delete({ where: { id } });

    revalidatePath('/[locale]/keys');
    revalidatePath('/[locale]/settings/access-areas');
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete access area.';
    return { success: false, error: message };
  }
}
