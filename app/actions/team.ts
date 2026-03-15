'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireRole } from '@/lib/auth-utils';
import { revalidatePath } from 'next/cache';
import { UserRole } from '@prisma/client';
import crypto from 'crypto';
import { sendInvitationEmail as sendInviteEmail } from '@/lib/email';

type ActionResult<T = void> = { success: true; data?: T } | { success: false; error: string };

/**
 * Generate a secure random token for invitations
 */
function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Calculate expiration date (7 days from now)
 */
function getExpirationDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date;
}

// Import removed - using lib/email.ts instead

/**
 * Invite a user to join the organization
 * Only OWNER and ADMIN can invite users
 * ADMIN can only invite MEMBER role
 */
export async function inviteUser(
  email: string,
  role: UserRole,
): Promise<ActionResult<{ inviteId: string; token: string }>> {
  try {
    const currentUser = await getCurrentUser();

    // Permission check: OWNER can invite anyone, ADMIN can only invite MEMBER
    if (currentUser.roleInActiveOrg === 'MEMBER') {
      return { success: false, error: 'You do not have permission to invite users.' };
    }

    if (currentUser.roleInActiveOrg === 'ADMIN' && role !== 'MEMBER') {
      return {
        success: false,
        error: 'Admins can only invite members. Contact the owner to invite admins.',
      };
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: 'Invalid email address.' };
    }

    // Check if user already exists in this organization
    const existingMembership = await prisma.userOrganisation.findFirst({
      where: {
        organisationId: currentUser.entityId,
        user: {
          email,
        },
      },
    });

    if (existingMembership) {
      return { success: false, error: 'A user with this email is already in your organization.' };
    }

    // Check if there's already a pending invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        entityId: currentUser.entityId,
        accepted: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      return { success: false, error: 'An invitation has already been sent to this email.' };
    }

    // Generate invitation token
    const token = generateInviteToken();
    const expiresAt = getExpirationDate();

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        entityId: currentUser.entityId,
        email,
        role,
        token,
        expiresAt,
        createdBy: currentUser.id,
      },
      include: {
        entity: {
          select: { name: true },
        },
      },
    });

    // Send invitation email
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) {
      return { success: false, error: 'NEXT_PUBLIC_SITE_URL is not configured.' };
    }
    const inviteUrl = `${siteUrl}/auth/login?token=${token}`;
    await sendInviteEmail({
      to: email,
      organisationName: invitation.entity.name,
      inviterName: currentUser.name || currentUser.email,
      role,
      inviteUrl,
    });

    revalidatePath('/[locale]/settings/organization');

    return {
      success: true,
      data: {
        inviteId: invitation.id,
        token: invitation.token,
      },
    };
  } catch (error) {
    console.error('Error inviting user:', error);
    return { success: false, error: 'Failed to send invitation.' };
  }
}

/**
 * List all team members in the organization
 */
export async function listTeamMembers(): Promise<
  ActionResult<
    Array<{
      id: string;
      email: string;
      name: string | null;
      role: UserRole;
      joinedAt: Date;
    }>
  >
> {
  try {
    const currentUser = await getCurrentUser();

    const memberships = await prisma.userOrganisation.findMany({
      where: { organisationId: currentUser.entityId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' }, // OWNER first, then ADMIN, then MEMBER
        { joinedAt: 'asc' },
      ],
    });

    const members = memberships.map((m) => ({
      id: m.user.id,
      email: m.user.email,
      name: m.user.name,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    return { success: true, data: members };
  } catch (error) {
    console.error('Error listing team members:', error);
    return { success: false, error: 'Failed to load team members.' };
  }
}

/**
 * List pending invitations
 * Only OWNER and ADMIN can see invitations
 */
export async function listPendingInvitations(): Promise<
  ActionResult<
    Array<{
      id: string;
      email: string;
      role: UserRole;
      expiresAt: Date;
      createdAt: Date;
      inviterName: string;
    }>
  >
> {
  try {
    const currentUser = await getCurrentUser();

    // Permission check
    if (currentUser.roleInActiveOrg === 'MEMBER') {
      return { success: false, error: 'You do not have permission to view invitations.' };
    }

    const invitations = await prisma.invitation.findMany({
      where: {
        entityId: currentUser.entityId,
        accepted: false,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        email: true,
        role: true,
        expiresAt: true,
        createdAt: true,
        inviter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: invitations.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
        inviterName: inv.inviter.name || inv.inviter.email,
      })),
    };
  } catch (error) {
    console.error('Error listing invitations:', error);
    return { success: false, error: 'Failed to load invitations.' };
  }
}

/**
 * Cancel a pending invitation
 * Only the inviter, ADMIN, or OWNER can cancel
 */
export async function cancelInvitation(invitationId: string): Promise<ActionResult> {
  try {
    const currentUser = await getCurrentUser();

    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      select: { entityId: true, createdBy: true, accepted: true },
    });

    if (!invitation) {
      return { success: false, error: 'Invitation not found.' };
    }

    // Check permission: must be in same org and either owner/admin or the person who sent it
    if (
      invitation.entityId !== currentUser.entityId ||
      (currentUser.roleInActiveOrg === 'MEMBER' && invitation.createdBy !== currentUser.id)
    ) {
      return { success: false, error: 'You do not have permission to cancel this invitation.' };
    }

    if (invitation.accepted) {
      return { success: false, error: 'This invitation has already been accepted.' };
    }

    await prisma.invitation.delete({
      where: { id: invitationId },
    });

    revalidatePath('/[locale]/settings/organization');

    return { success: true };
  } catch (error) {
    console.error('Error canceling invitation:', error);
    return { success: false, error: 'Failed to cancel invitation.' };
  }
}

/**
 * Change a user's role in the organization
 * Only OWNER can change roles
 */
export async function changeUserRole(userId: string, newRole: UserRole): Promise<ActionResult> {
  try {
    const currentUser = await getCurrentUser();
    await requireRole('OWNER');

    // Can't change your own role
    if (userId === currentUser.id) {
      return { success: false, error: 'You cannot change your own role.' };
    }

    // Find the membership
    const membership = await prisma.userOrganisation.findUnique({
      where: {
        userId_organisationId: {
          userId,
          organisationId: currentUser.entityId,
        },
      },
    });

    if (!membership) {
      return { success: false, error: 'User not found in your organization.' };
    }

    // Update role
    await prisma.userOrganisation.update({
      where: {
        id: membership.id,
      },
      data: { role: newRole },
    });

    revalidatePath('/[locale]/settings/organization');

    return { success: true };
  } catch (error) {
    console.error('Error changing user role:', error);
    return { success: false, error: 'Failed to change user role.' };
  }
}

/**
 * Remove a user from the organization
 * Only OWNER can remove users
 * Cannot remove if they're the last owner
 */
export async function removeUser(userId: string): Promise<ActionResult> {
  try {
    const currentUser = await getCurrentUser();
    await requireRole('OWNER');

    // Can't remove yourself
    if (userId === currentUser.id) {
      return {
        success: false,
        error:
          'You cannot remove yourself from the organization. Use "Leave Organization" instead.',
      };
    }

    // Get the membership to check role
    const membership = await prisma.userOrganisation.findUnique({
      where: {
        userId_organisationId: {
          userId,
          organisationId: currentUser.entityId,
        },
      },
    });

    if (!membership) {
      return { success: false, error: 'User not found in your organization.' };
    }

    // If removing an owner, check if they're the last one
    if (membership.role === 'OWNER') {
      const ownerCount = await prisma.userOrganisation.count({
        where: {
          organisationId: currentUser.entityId,
          role: 'OWNER',
        },
      });

      if (ownerCount === 1) {
        return {
          success: false,
          error: 'Cannot remove the last owner. Promote another member to owner first.',
        };
      }
    }

    // Delete membership (not the user, just the membership)
    await prisma.userOrganisation.delete({
      where: { id: membership.id },
    });

    revalidatePath('/[locale]/settings/organization');

    return { success: true };
  } catch (error) {
    console.error('Error removing user:', error);
    return { success: false, error: 'Failed to remove user.' };
  }
}

/**
 * Leave the current organization
 * User must not be the last owner
 */
export async function leaveOrganisation(): Promise<ActionResult<{ needsOrganization?: boolean }>> {
  try {
    const currentUser = await getCurrentUser();

    // Get current membership
    const membership = await prisma.userOrganisation.findUnique({
      where: {
        userId_organisationId: {
          userId: currentUser.id,
          organisationId: currentUser.entityId,
        },
      },
    });

    if (!membership) {
      return { success: false, error: 'You are not a member of this organization.' };
    }

    // If user is an owner, check if they're the last one
    if (membership.role === 'OWNER') {
      const ownerCount = await prisma.userOrganisation.count({
        where: {
          organisationId: currentUser.entityId,
          role: 'OWNER',
        },
      });

      if (ownerCount === 1) {
        return {
          success: false,
          error: 'You are the last owner. Promote another member to owner before leaving.',
        };
      }
    }

    // Remove membership
    await prisma.userOrganisation.delete({
      where: { id: membership.id },
    });

    // Switch to another organization if user has any
    const otherMembership = await prisma.userOrganisation.findFirst({
      where: { userId: currentUser.id },
      select: { organisationId: true },
    });

    if (otherMembership) {
      // Switch to another organization
      await prisma.user.update({
        where: { id: currentUser.id },
        data: { activeOrganisationId: otherMembership.organisationId },
      });

      revalidatePath('/', 'layout');

      return { success: true };
    } else {
      // No other organizations, set active to null
      await prisma.user.update({
        where: { id: currentUser.id },
        data: { activeOrganisationId: null },
      });

      revalidatePath('/', 'layout');

      return { success: true, data: { needsOrganization: true } };
    }
  } catch (error) {
    console.error('Error leaving organization:', error);
    return { success: false, error: 'Failed to leave organization.' };
  }
}

/**
 * Check if an invitation token is valid
 * Public endpoint (no auth required)
 */
export async function validateInvitationToken(token: string): Promise<
  ActionResult<{
    email: string;
    organizationName: string;
    role: UserRole;
  }>
> {
  try {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        entity: {
          select: { name: true },
        },
      },
    });

    if (!invitation) {
      return { success: false, error: 'Invalid invitation link.' };
    }

    if (invitation.accepted) {
      return { success: false, error: 'This invitation has already been used.' };
    }

    if (invitation.expiresAt < new Date()) {
      return { success: false, error: 'This invitation has expired.' };
    }

    return {
      success: true,
      data: {
        email: invitation.email,
        organizationName: invitation.entity.name,
        role: invitation.role,
      },
    };
  } catch (error) {
    console.error('Error validating invitation:', error);
    return { success: false, error: 'Failed to validate invitation.' };
  }
}

/**
 * Accept an invitation and join an organization
 * Must be called by authenticated user whose email matches invitation
 */
export async function acceptInvitation(token: string): Promise<ActionResult<void>> {
  try {
    const currentUser = await getCurrentUser();

    return await prisma.$transaction(async (tx) => {
      // Fetch and lock invitation
      const invitation = await tx.invitation.findUnique({
        where: { token },
        include: {
          entity: {
            select: { id: true, name: true },
          },
        },
      });

      if (!invitation) {
        return { success: false, error: 'Invalid invitation link.' };
      }

      if (invitation.accepted) {
        return { success: false, error: 'This invitation has already been used.' };
      }

      if (invitation.expiresAt < new Date()) {
        return { success: false, error: 'This invitation has expired.' };
      }

      // Verify email matches
      if (invitation.email.toLowerCase() !== currentUser.email.toLowerCase()) {
        return {
          success: false,
          error: 'This invitation was sent to a different email address.',
        };
      }

      // Atomically mark invitation as accepted (race-safe)
      const updateResult = await tx.invitation.updateMany({
        where: {
          id: invitation.id,
          accepted: false, // Only update if still not accepted
        },
        data: {
          accepted: true,
        },
      });

      if (updateResult.count === 0) {
        // Another request already accepted this invitation
        return { success: false, error: 'This invitation has already been used.' };
      }

      // Create membership (idempotent via unique constraint)
      await tx.userOrganisation.upsert({
        where: {
          userId_organisationId: {
            userId: currentUser.id,
            organisationId: invitation.entityId,
          },
        },
        create: {
          userId: currentUser.id,
          organisationId: invitation.entityId,
          role: invitation.role,
          joinedAt: new Date(),
        },
        update: {
          role: invitation.role, // Update role if membership already exists
        },
      });

      // If user has no active org, set this as active
      if (!currentUser.entityId) {
        await tx.user.update({
          where: { id: currentUser.id },
          data: { activeOrganisationId: invitation.entityId }, // set active org on first join
        });
      }

      revalidatePath('/');

      // Note: No redirect here - callback route will handle redirect to /welcome?from=invitation
      return { success: true };
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return { success: false, error: 'Failed to accept invitation.' };
  }
}
