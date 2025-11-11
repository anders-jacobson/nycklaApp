'use server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { generateEntityKey, encryptEntityKey } from '@/lib/entity-encryption';
import bcrypt from 'bcrypt';

export async function registerUser(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const entityName = formData.get('entityName') as string;
  const inviteToken = formData.get('inviteToken') as string;

  // Validate required fields
  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' };
  }

  try {
    // Hash the password
    await bcrypt.hash(password, 10); // Not used, but kept for future extensibility

    // Create server client for authentication
    const supabase = await createClient();

    // Register user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      // If Supabase returns a user exists error, show a friendly message
      if (error.message && error.message.toLowerCase().includes('user already registered')) {
        return { error: 'A user with this email already exists.' };
      }
      return { error: error.message };
    }

    // Get the auth user ID for our database record
    const authUserId = data.user?.id;
    if (!authUserId) {
      return { error: 'Failed to get user ID from Supabase.' };
    }

    // Check if user is joining via invitation
    if (inviteToken) {
      const invitation = await prisma.invitation.findUnique({
        where: { token: inviteToken },
        include: { entity: true },
      });

      if (!invitation) {
        return { error: 'Invalid invitation link.' };
      }

      if (invitation.accepted) {
        return { error: 'This invitation has already been used.' };
      }

      if (invitation.expiresAt < new Date()) {
        return { error: 'This invitation has expired. Please request a new invitation.' };
      }

      if (invitation.email.toLowerCase() !== email.toLowerCase()) {
        return { error: 'This invitation was sent to a different email address.' };
      }

      // Join existing organization
      await prisma.$transaction(async (tx) => {
        // Create user with active organisation set
        const user = await tx.user.create({
          data: {
            email,
            activeOrganisationId: invitation.entityId,
          },
        });

        // Create membership with invited role
        await tx.userOrganisation.create({
          data: {
            userId: user.id,
            organisationId: invitation.entityId,
            role: invitation.role,
          },
        });

        // Mark invitation as accepted
        await tx.invitation.update({
          where: { id: invitation.id },
          data: { accepted: true },
        });
      });

      return { success: true, joined: true, organizationName: invitation.entity.name };
    }

    // No invite token - creating new organization
    if (!entityName) {
      return { error: 'Organization name is required.' };
    }

    // Check if entity already exists
    const existingEntity = await prisma.entity.findUnique({
      where: { name: entityName },
    });

    if (existingEntity) {
      return {
        error:
          'This organization name is already taken. If you were invited to join, please use your invitation link. Otherwise, choose a different name.',
      };
    }

    // Create entity with encryption key and user in a transaction
    await prisma.$transaction(async (tx) => {
      // Generate and encrypt entity key
      const entityKey = generateEntityKey();
      const encryptedKey = encryptEntityKey(entityKey);

      // Create entity
      const entity = await tx.entity.create({
        data: {
          name: entityName,
          encryptionKey: encryptedKey,
        },
      });

      // Create user with active organisation set
      const user = await tx.user.create({
        data: {
          email,
          activeOrganisationId: entity.id,
        },
      });

      // Create membership as OWNER
      await tx.userOrganisation.create({
        data: {
          userId: user.id,
          organisationId: entity.id,
          role: 'OWNER',
        },
      });
    });

    return { success: true };
  } catch (err) {
    // Prisma unique constraint error
    if (
      err instanceof Error &&
      err.message &&
      err.message.toLowerCase().includes('unique constraint failed') &&
      err.message.toLowerCase().includes('email')
    ) {
      return { error: 'A user with this email already exists.' };
    }
    if (err instanceof Error) {
      return { error: err.message };
    }
    return { error: 'Registration failed.' };
  }
}
