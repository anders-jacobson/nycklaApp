import { prisma } from '@/lib/prisma';
import { isConnectionError } from './db-error-handler';

/**
 * Check if organization should see onboarding wizard
 * Triggered when keyCount == 0 AND onboarding was not completed/skipped
 */
export async function shouldShowOnboarding(entityId: string): Promise<boolean> {
  try {
    // First check if onboarding was already completed/skipped
    const session = await prisma.onboardingSession.findUnique({
      where: { entityId },
      select: { completedAt: true },
    });

    // If onboarding was completed/skipped, don't show it
    if (session?.completedAt) {
      return false;
    }

    // Otherwise, show onboarding only if there are no keys yet
    const keyCount = await prisma.keyType.count({
      where: { entityId },
    });

    return keyCount === 0;
  } catch (error) {
    // On connection errors, gracefully fail by not forcing onboarding
    // This allows the app to continue working with cached data
    if (isConnectionError(error)) {
      console.warn('Connection error checking onboarding status, skipping check');
      return false;
    }
    throw error;
  }
}

/**
 * Get or create onboarding session for entity
 */
export async function getOrCreateOnboardingSession(entityId: string) {
  return await prisma.onboardingSession.upsert({
    where: { entityId },
    update: {},
    create: {
      entityId,
      step: 1,
      draftJson: {},
    },
  });
}

/**
 * Check if onboarding has been completed
 */
export async function isOnboardingCompleted(entityId: string): Promise<boolean> {
  const session = await prisma.onboardingSession.findUnique({
    where: { entityId },
    select: { completedAt: true },
  });
  return !!session?.completedAt;
}
