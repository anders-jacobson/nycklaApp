/**
 * Authentication utilities for server actions
 * Provides helper functions to get current user with multi-organisation context
 */

import { cache } from 'react';
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

export interface AuthUserSafe {
  id: string;
  email: string;
  name: string | null;
  activeOrganisationId: string | null;
  organisations: Array<{
    organisationId: string;
    role: UserRole;
  }>;
}

/**
 * Get authenticated user WITHOUT requiring organisation membership
 * Returns null instead of throwing - safe for pages where user might not have orgs yet
 * 
 * ⚠️ USE THIS INSTEAD OF getCurrentUser() for:
 * - /no-organization page
 * - /onboarding/keys page
 * - /create-organization action
 * - Any page where user might not have organisations yet
 * 
 * @returns User data or null if not authenticated or not found
 * @throws Never throws - returns null on any error
 */
export const getCurrentUserOrNull = cache(async (): Promise<AuthUserSafe | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      activeOrganisationId: true,
      organisations: {
        select: {
          organisationId: true,
          role: true,
        },
        orderBy: { joinedAt: 'asc' }, // Deterministic ordering
      },
    },
  });

  if (!dbUser) {
    return null;
  }

  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    activeOrganisationId: dbUser.activeOrganisationId,
    organisations: dbUser.organisations,
  };
});

/**
 * Get the currently authenticated user with multi-organisation context
 * Use this in all server actions to get user identity and organisation membership
 *
 * Uses React.cache() to deduplicate calls within the same request
 * Multiple getCurrentUser() calls = single DB query per request
 *
 * ⚠️ THROWS if user has no organisations - use getCurrentUserOrNull() for edge cases
 *
 * @returns Current user with active organisation and all memberships
 * @throws Error if not authenticated, user not found, or no organisations
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Not authenticated');
  }

  // CHANGE: Lookup by Supabase user.id instead of email
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id }, // UUID lookup (was: email string comparison)
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
        orderBy: { joinedAt: 'asc' }, // CRITICAL: Deterministic ordering
      },
    },
  });

  if (!dbUser) {
    // User exists in Supabase but not in Prisma
    // With new flow this should rarely happen (callback upserts everyone)
    throw new Error('USER_NOT_IN_DB');
  }

  // CHANGE: Validate membership exists (authorization check)
  if (dbUser.organisations.length === 0) {
    throw new Error('USER_HAS_NO_ORGANISATIONS');
  }

  // CHANGE: Validate activeOrganisationId (but don't fix it here - callback handles that)
  let activeOrgId = dbUser.activeOrganisationId;

  // If null or not in current memberships, use first org (deterministic due to orderBy)
  if (
    !activeOrgId ||
    !dbUser.organisations.some((o) => o.organisationId === activeOrgId)
  ) {
    const firstOrg = dbUser.organisations[0];
    activeOrgId = firstOrg.organisationId;

    // NOTE: We don't update the DB here because getCurrentUser() is cached.
    // Callback route handles fixing stale activeOrganisationId on login.
    // This ensures the user can proceed even if activeOrganisationId is stale.
  }

  // Find the role in the active organisation
  const activeOrgRelation = dbUser.organisations.find(
    (o) => o.organisationId === activeOrgId,
  );

  if (!activeOrgRelation) {
    // Should never happen after the checks above, but safety
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
});

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

/**
 * Check if user has any organisation memberships
 */
export async function hasMembership(userId: string): Promise<boolean> {
  const count = await prisma.userOrganisation.count({
    where: { userId },
  });
  return count > 0;
}

/**
 * Get user's first organisation (for default selection)
 */
export async function getFirstOrganisation(userId: string): Promise<string | null> {
  const membership = await prisma.userOrganisation.findFirst({
    where: { userId },
    select: { organisationId: true },
    orderBy: { joinedAt: 'asc' },
  });
  return membership?.organisationId || null;
}

/**
 * Validate user has access to specific organisation
 */
export async function hasAccessToOrg(userId: string, orgId: string): Promise<boolean> {
  const membership = await prisma.userOrganisation.findUnique({
    where: {
      userId_organisationId: { userId, organisationId: orgId },
    },
  });
  return !!membership;
}
