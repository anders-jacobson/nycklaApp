/**
 * Authentication utilities for server actions
 * Provides helper functions to get current user with multi-organisation context
 */

import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@prisma/client';

export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  entityId: string;
  roleInActiveOrg: UserRole;
  allOrganisations: Array<{
    id: string;
    name: string;
    role: UserRole;
  }>;
}

/**
 * Get the currently authenticated user with multi-organisation context
 * Use this in all server actions to get user identity and organisation membership
 *
 * @returns Current user with active organisation and all memberships
 * @throws Error if not authenticated or user not found
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    throw new Error('Not authenticated');
  }

  // Fetch user with all organisation memberships
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: {
      id: true,
      email: true,
      name: true,
      activeOrganisationId: true,
      organisations: {
        include: {
          organisation: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  if (!dbUser) {
    // User exists in Supabase Auth but not in database
    // This can happen if database was reset or registration incomplete
    throw new Error('USER_NOT_IN_DB');
  }

  // If no active organisation set, set it to first organisation
  let activeOrgId = dbUser.activeOrganisationId;

  if (!activeOrgId && dbUser.organisations.length > 0) {
    const firstOrg = dbUser.organisations[0];
    activeOrgId = firstOrg.organisationId;

    // Update database to persist this choice
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { activeOrganisationId: activeOrgId },
    });
  }

  if (!activeOrgId) {
    throw new Error('USER_HAS_NO_ORGANISATIONS');
  }

  // Find the role in the active organisation
  const activeOrgRelation = dbUser.organisations.find((o) => o.organisationId === activeOrgId);

  if (!activeOrgRelation) {
    throw new Error('ACTIVE_ORG_NOT_IN_MEMBERSHIPS');
  }

  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    entityId: activeOrgId,
    roleInActiveOrg: activeOrgRelation.role,
    allOrganisations: dbUser.organisations.map((o) => ({
      id: o.organisationId,
      name: o.organisation.name,
      role: o.role,
    })),
  };
}

/**
 * Check if the current user has a specific role or higher in their active organisation
 * Role hierarchy: OWNER > ADMIN > MEMBER
 *
 * @param requiredRole - Minimum role required
 * @returns True if user has required role or higher in active organisation
 */
export async function hasRole(requiredRole: UserRole): Promise<boolean> {
  const user = await getCurrentUser();

  const roleHierarchy: Record<UserRole, number> = {
    OWNER: 3,
    ADMIN: 2,
    MEMBER: 1,
  };

  return roleHierarchy[user.roleInActiveOrg] >= roleHierarchy[requiredRole];
}

/**
 * Require a specific role or throw an error
 *
 * @param requiredRole - Minimum role required
 * @throws Error if user doesn't have required role in active organisation
 */
export async function requireRole(requiredRole: UserRole): Promise<void> {
  if (!(await hasRole(requiredRole))) {
    throw new Error(`Requires ${requiredRole} role or higher`);
  }
}
