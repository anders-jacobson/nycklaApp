'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-utils';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { UserRole } from '@prisma/client';
import { generateEntityKey, encryptEntityKey } from '@/lib/entity-encryption';

type ActionResult<T = void> = { success: true; data?: T } | { success: false; error: string };

/**
 * Switch the user's active organisation
 * User must be a member of the organisation they're switching to
 */
export async function switchOrganisation(organisationId: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();

    // Verify user belongs to this organisation
    const membership = await prisma.userOrganisation.findUnique({
      where: {
        userId_organisationId: {
          userId: user.id,
          organisationId,
        },
      },
    });

    if (!membership) {
      return { success: false, error: 'You are not a member of this organisation.' };
    }

    // Update active organisation
    await prisma.user.update({
      where: { id: user.id },
      data: { activeOrganisationId: organisationId },
    });

    // Revalidate all pages to reflect the organisation switch
    revalidatePath('/', 'layout');
    revalidatePath('/settings/organization');
    revalidatePath('/active-loans');
    revalidatePath('/keys');

    return { success: true };
  } catch (error) {
    console.error('Error switching organisation:', error);
    return { success: false, error: 'Failed to switch organisation.' };
  }
}

/**
 * List all organisations the current user belongs to
 */
export async function listUserOrganisations(): Promise<
  ActionResult<
    Array<{
      id: string;
      name: string;
      role: UserRole;
      memberCount: number;
      isActive: boolean;
      createdAt: Date;
    }>
  >
> {
  try {
    const user = await getCurrentUser();

    const memberships = await prisma.userOrganisation.findMany({
      where: { userId: user.id },
      include: {
        organisation: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            _count: {
              select: { members: true },
            },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    const organisations = memberships.map((m) => ({
      id: m.organisation.id,
      name: m.organisation.name,
      role: m.role,
      memberCount: m.organisation._count.members,
      isActive: m.organisation.id === user.entityId,
      createdAt: m.organisation.createdAt,
    }));

    return { success: true, data: organisations };
  } catch (error) {
    console.error('Error listing organisations:', error);
    return { success: false, error: 'Failed to load organisations.' };
  }
}

/**
 * Get details about the current active organisation
 */
export async function getActiveOrganisation(): Promise<
  ActionResult<{
    id: string;
    name: string;
    role: UserRole;
    memberCount: number;
    createdAt: Date;
  }>
> {
  try {
    const user = await getCurrentUser();

    const organisation = await prisma.entity.findUnique({
      where: { id: user.entityId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: {
          select: { members: true },
        },
      },
    });

    if (!organisation) {
      return { success: false, error: 'Active organisation not found.' };
    }

    return {
      success: true,
      data: {
        id: organisation.id,
        name: organisation.name,
        role: user.roleInActiveOrg,
        memberCount: organisation._count.members,
        createdAt: organisation.createdAt,
      },
    };
  } catch (error) {
    console.error('Error getting active organisation:', error);
    return { success: false, error: 'Failed to load organisation details.' };
  }
}

/**
 * Update organisation name
 * Only OWNER can update the name
 */
export async function updateOrganisationName(name: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();

    // Only OWNER can update organisation name
    if (user.roleInActiveOrg !== 'OWNER') {
      return { success: false, error: 'Only organisation owners can update the name.' };
    }

    // Validate name
    if (!name || name.trim().length < 2) {
      return { success: false, error: 'Organisation name must be at least 2 characters.' };
    }

    if (name.trim().length > 200) {
      return { success: false, error: 'Organisation name must be less than 200 characters.' };
    }

    // Check if organisation name already exists (excluding current organisation)
    const existing = await prisma.entity.findFirst({
      where: {
        name: name.trim(),
        id: { not: user.entityId },
      },
    });

    if (existing) {
      return { success: false, error: 'An organisation with this name already exists.' };
    }

    // Update organisation name
    await prisma.entity.update({
      where: { id: user.entityId },
      data: { name: name.trim() },
    });

    revalidatePath('/', 'layout');
    revalidatePath('/settings/organization');

    return { success: true };
  } catch (error) {
    console.error('Error updating organisation name:', error);
    return { success: false, error: 'Failed to update organisation name.' };
  }
}

/**
 * Create a new organisation
 * User becomes OWNER of the new organisation
 */
export async function createOrganisation(
  name: string,
): Promise<ActionResult<{ organisationId: string }>> {
  try {
    // Don't use getCurrentUser() here - it throws for users with no orgs
    // Use Supabase auth directly instead
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return { success: false, error: 'Not authenticated.' };
    }

    // Validate name
    if (!name || name.trim().length < 2) {
      return { success: false, error: 'Organisation name must be at least 2 characters.' };
    }

    if (name.trim().length > 200) {
      return { success: false, error: 'Organisation name must be less than 200 characters.' };
    }

    // Check if organisation name already exists (case-insensitive)
    const existing = await prisma.entity.findFirst({
      where: { 
        name: {
          equals: name.trim(),
          mode: 'insensitive', // Case-insensitive check
        }
      },
    });

    if (existing) {
      return { success: false, error: 'An organisation with this name already exists.' };
    }

    // Create organisation in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Generate and encrypt entity key
      const entityKey = generateEntityKey();
      const encryptedKey = encryptEntityKey(entityKey);

      // Create organisation
      const organisation = await tx.entity.create({
        data: {
          name: name.trim(),
          encryptionKey: encryptedKey,
        },
      });

      // Ensure user record exists and set as active organisation
      await tx.user.upsert({
        where: { id: authUser.id },
        create: {
          id: authUser.id,
          email: authUser.email!,
          name: authUser.user_metadata?.full_name || null,
          activeOrganisationId: organisation.id,
        },
        update: {
          activeOrganisationId: organisation.id,
        },
      });

      // Create membership as OWNER
      await tx.userOrganisation.create({
        data: {
          userId: authUser.id,
          organisationId: organisation.id,
          role: 'OWNER',
        },
      });

      return organisation;
    });

    revalidatePath('/', 'layout');
    revalidatePath('/settings/organization');
    revalidatePath('/active-loans');
    revalidatePath('/keys');

    // Redirect to welcome screen for new org
    redirect('/welcome?from=create');
  } catch (error) {
    // Re-throw redirect errors (they're not real errors - just Next.js redirect mechanism)
    if ((error as any)?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    
    console.error('Error creating organisation:', error);
    
    // Handle Prisma unique constraint violation
    if ((error as any)?.code === 'P2002') {
      return { success: false, error: 'An organisation with this name already exists.' };
    }
    
    return { success: false, error: 'Failed to create organisation.' };
  }
}

/**
 * Get statistics about an organisation for deletion confirmation
 * Shows impact of deletion
 */
export async function getOrganisationDeletionStats(): Promise<
  ActionResult<{
    memberCount: number;
    keyTypeCount: number;
    keyCount: number;
    borrowerCount: number;
    activeLoanCount: number;
  }>
> {
  try {
    const user = await getCurrentUser();

    const [memberCount, keyTypeCount, keyCount, borrowerCount, activeLoanCount] = await Promise.all(
      [
        prisma.userOrganisation.count({
          where: { organisationId: user.entityId },
        }),
        prisma.keyType.count({
          where: { entityId: user.entityId },
        }),
        prisma.keyCopy.count({
          where: {
            keyType: {
              entityId: user.entityId,
            },
          },
        }),
        prisma.borrower.count({
          where: { entityId: user.entityId },
        }),
        prisma.issueRecord.count({
          where: {
            entityId: user.entityId,
            returnedDate: null,
          },
        }),
      ],
    );

    return {
      success: true,
      data: {
        memberCount,
        keyTypeCount,
        keyCount,
        borrowerCount,
        activeLoanCount,
      },
    };
  } catch (error) {
    console.error('Error fetching organisation stats:', error);
    return { success: false, error: 'Failed to fetch organisation statistics.' };
  }
}

/**
 * Delete the current organisation permanently
 * Only OWNER can delete
 * Requires all other members to have left first
 */
export async function deleteOrganisation(): Promise<
  ActionResult<{
    needsOrganization: boolean;
    switchedToOrgName?: string;
  }>
> {
  try {
    const user = await getCurrentUser();

    // Only OWNER can delete organisation
    if (user.roleInActiveOrg !== 'OWNER') {
      return { success: false, error: 'Only organisation owners can delete the organisation.' };
    }

    // Count members - if more than 1, block deletion
    const memberCount = await prisma.userOrganisation.count({
      where: { organisationId: user.entityId },
    });

    if (memberCount > 1) {
      return {
        success: false,
        error: 'All other members must leave the organisation before you can delete it.',
      };
    }

    // Get organisation name for logging
    const organisation = await prisma.entity.findUnique({
      where: { id: user.entityId },
      select: { name: true },
    });

    // Perform deletion in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Remove user's membership first
      await tx.userOrganisation.deleteMany({
        where: {
          userId: user.id,
          organisationId: user.entityId,
        },
      });

      // Delete the organisation (cascade will handle all related data)
      await tx.entity.delete({
        where: { id: user.entityId },
      });

      // Check if user has other organisations
      const otherMembership = await tx.userOrganisation.findFirst({
        where: { userId: user.id },
        include: {
          organisation: {
            select: { id: true, name: true },
          },
        },
      });

      if (otherMembership) {
        // Switch to another organisation
        await tx.user.update({
          where: { id: user.id },
          data: { activeOrganisationId: otherMembership.organisationId },
        });

        return {
          switchedToId: otherMembership.organisation.id,
          switchedToName: otherMembership.organisation.name,
        };
      } else {
        // No other organisations, set active to null
        await tx.user.update({
          where: { id: user.id },
          data: { activeOrganisationId: null },
        });

        return { switchedToId: null, switchedToName: null };
      }
    });

    revalidatePath('/', 'layout');
    revalidatePath('/settings/organization');
    revalidatePath('/active-loans');
    revalidatePath('/keys');

    console.log(`Organisation "${organisation?.name}" deleted by user ${user.email}`);

    return {
      success: true,
      data: {
        needsOrganization: !result.switchedToId,
        switchedToOrgName: result.switchedToName || undefined,
      },
    };
  } catch (error) {
    console.error('Error deleting organisation:', error);
    return { success: false, error: 'Failed to delete organisation.' };
  }
}
