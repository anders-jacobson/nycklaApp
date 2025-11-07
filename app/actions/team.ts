'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireRole } from '@/lib/auth-utils';
import { revalidatePath } from 'next/cache';
import { UserRole } from '@prisma/client';
import crypto from 'crypto';

type ActionResult<T = void> = 
  | { success: true; data?: T }
  | { success: false; error: string };

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

/**
 * Send invitation email to user
 * TODO: Implement actual email sending (Resend, SendGrid, etc.)
 */
async function sendInvitationEmail(
  email: string, 
  token: string, 
  organizationName: string,
  inviterName: string,
  role: UserRole
): Promise<void> {
  const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/register?token=${token}`;
  
  // TODO: Replace with actual email service
  console.log('📧 INVITATION EMAIL');
  console.log('To:', email);
  console.log('Subject: You\'ve been invited to join', organizationName);
  console.log('Body:');
  console.log(`
${inviterName} has invited you to join ${organizationName} as a ${role}.

Click the link below to accept your invitation:
${inviteUrl}

This invitation will expire in 7 days.
  `);
  
  // For now, just log. In production, use:
  // await sendEmail({ to: email, subject, html });
}

/**
 * Invite a user to join the organization
 * Only OWNER and ADMIN can invite users
 * ADMIN can only invite MEMBER role
 */
export async function inviteUser(
  email: string,
  role: UserRole
): Promise<ActionResult<{ inviteId: string; token: string }>> {
  try {
    const currentUser = await getCurrentUser();
    
    // Permission check: OWNER can invite anyone, ADMIN can only invite MEMBER
    if (currentUser.role === 'MEMBER') {
      return { success: false, error: 'You do not have permission to invite users.' };
    }
    
    if (currentUser.role === 'ADMIN' && role !== 'MEMBER') {
      return { success: false, error: 'Admins can only invite members. Contact the owner to invite admins.' };
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: 'Invalid email address.' };
    }
    
    // Check if user already exists in this organization
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        entityId: currentUser.entityId,
      },
    });
    
    if (existingUser) {
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
    await sendInvitationEmail(
      email,
      token,
      invitation.entity.name,
      currentUser.name || currentUser.email,
      role
    );
    
    revalidatePath('/settings/team');
    
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
export async function listTeamMembers(): Promise<ActionResult<Array<{
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: Date;
}>>> {
  try {
    const currentUser = await getCurrentUser();
    
    const members = await prisma.user.findMany({
      where: { entityId: currentUser.entityId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: [
        { role: 'asc' }, // OWNER first, then ADMIN, then MEMBER
        { createdAt: 'asc' },
      ],
    });
    
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
export async function listPendingInvitations(): Promise<ActionResult<Array<{
  id: string;
  email: string;
  role: UserRole;
  expiresAt: Date;
  createdAt: Date;
  inviterName: string;
}>>> {
  try {
    const currentUser = await getCurrentUser();
    
    // Permission check
    if (currentUser.role === 'MEMBER') {
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
      data: invitations.map(inv => ({
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
    
    // Check permission: must be owner, admin, or the person who sent it
    if (
      invitation.entityId !== currentUser.entityId ||
      (currentUser.role === 'MEMBER' && invitation.createdBy !== currentUser.id)
    ) {
      return { success: false, error: 'You do not have permission to cancel this invitation.' };
    }
    
    if (invitation.accepted) {
      return { success: false, error: 'This invitation has already been accepted.' };
    }
    
    await prisma.invitation.delete({
      where: { id: invitationId },
    });
    
    revalidatePath('/settings/team');
    
    return { success: true };
  } catch (error) {
    console.error('Error canceling invitation:', error);
    return { success: false, error: 'Failed to cancel invitation.' };
  }
}

/**
 * Change a user's role
 * Only OWNER can change roles
 */
export async function changeUserRole(
  userId: string,
  newRole: UserRole
): Promise<ActionResult> {
  try {
    const currentUser = await getCurrentUser();
    await requireRole('OWNER');
    
    // Can't change your own role
    if (userId === currentUser.id) {
      return { success: false, error: 'You cannot change your own role.' };
    }
    
    // Verify user is in same organization
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { entityId: true, role: true },
    });
    
    if (!targetUser) {
      return { success: false, error: 'User not found.' };
    }
    
    if (targetUser.entityId !== currentUser.entityId) {
      return { success: false, error: 'User not in your organization.' };
    }
    
    // Update role
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });
    
    revalidatePath('/settings/team');
    
    return { success: true };
  } catch (error) {
    console.error('Error changing user role:', error);
    return { success: false, error: 'Failed to change user role.' };
  }
}

/**
 * Remove a user from the organization
 * Only OWNER can remove users
 */
export async function removeUser(userId: string): Promise<ActionResult> {
  try {
    const currentUser = await getCurrentUser();
    await requireRole('OWNER');
    
    // Can't remove yourself
    if (userId === currentUser.id) {
      return { success: false, error: 'You cannot remove yourself from the organization.' };
    }
    
    // Verify user is in same organization
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { entityId: true },
    });
    
    if (!targetUser) {
      return { success: false, error: 'User not found.' };
    }
    
    if (targetUser.entityId !== currentUser.entityId) {
      return { success: false, error: 'User not in your organization.' };
    }
    
    // Delete user (IssueRecord.userId will be set to null due to onDelete: SetNull)
    await prisma.user.delete({
      where: { id: userId },
    });
    
    revalidatePath('/settings/team');
    
    return { success: true };
  } catch (error) {
    console.error('Error removing user:', error);
    return { success: false, error: 'Failed to remove user.' };
  }
}

/**
 * Check if an invitation token is valid
 * Public endpoint (no auth required)
 */
export async function validateInvitationToken(
  token: string
): Promise<ActionResult<{
  email: string;
  organizationName: string;
  role: UserRole;
}>> {
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




