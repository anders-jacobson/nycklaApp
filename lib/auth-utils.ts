/**
 * Authentication utilities for server actions
 * Provides helper functions to get current user with entity context
 */

import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@prisma/client';

export interface CurrentUser {
  id: string;
  entityId: string;
  role: UserRole;
  email: string;
  name: string | null;
}

/**
 * Get the currently authenticated user with entity context
 * Use this in all server actions to get user identity and entity membership
 * 
 * @returns Current user with entityId and role
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

  // Simple email lookup (email is always present from Supabase)
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { 
      id: true, 
      entityId: true, 
      role: true,
      email: true,
      name: true,
    },
  });
  
  if (!dbUser) {
    // User exists in Supabase Auth but not in database
    // This can happen if database was reset or registration incomplete
    throw new Error('USER_NOT_IN_DB');
  }
  
  return dbUser;
}

/**
 * Check if the current user has a specific role or higher
 * Role hierarchy: OWNER > ADMIN > MEMBER
 * 
 * @param requiredRole - Minimum role required
 * @returns True if user has required role or higher
 */
export async function hasRole(requiredRole: UserRole): Promise<boolean> {
  const user = await getCurrentUser();
  
  const roleHierarchy: Record<UserRole, number> = {
    OWNER: 3,
    ADMIN: 2,
    MEMBER: 1,
  };
  
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}

/**
 * Require a specific role or throw an error
 * 
 * @param requiredRole - Minimum role required
 * @throws Error if user doesn't have required role
 */
export async function requireRole(requiredRole: UserRole): Promise<void> {
  if (!(await hasRole(requiredRole))) {
    throw new Error(`Requires ${requiredRole} role or higher`);
  }
}

