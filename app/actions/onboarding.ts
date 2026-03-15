'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-utils';
import { revalidatePath } from 'next/cache';
import { generateSeries } from '@/lib/label-generators';

type ActionResult<T> = { success: true; data?: T } | { success: false; error: string };

interface OnboardingDraft {
  orgName?: string;
  accessAreas?: string[];
  letterLabels?: string[];
  seriesPreset?: { prefix: string; from: number; to: number };
  customLabels?: string[];
  copiesMap?: Record<string, number>;
  displayNamesMap?: Record<string, string | null>;
  areaMappings?: Record<string, string[]>;
}

/**
 * Get current entity name
 */
export async function getCurrentEntityName(): Promise<ActionResult<{ name: string }>> {
  try {
    const { entityId } = await getCurrentUser();

    const entity = await prisma.entity.findUnique({
      where: { id: entityId },
      select: { name: true },
    });

    return { success: true, data: { name: entity?.name || '' } };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get entity';
    return { success: false, error: message };
  }
}

/**
 * Get current onboarding session
 */
export async function getOnboardingSession(): Promise<
  ActionResult<{ step: number; draft: OnboardingDraft; currentOrgName: string }>
> {
  try {
    const { entityId } = await getCurrentUser();

    const [session, entity] = await Promise.all([
      prisma.onboardingSession.findUnique({ where: { entityId } }),
      prisma.entity.findUnique({ where: { id: entityId }, select: { name: true } }),
    ]);

    if (!session) {
      // Create new session
      await prisma.onboardingSession.create({
        data: {
          entityId,
          step: 1,
          draftJson: {},
        },
      });
      return { success: true, data: { step: 1, draft: {}, currentOrgName: entity?.name || '' } };
    }

    return {
      success: true,
      data: {
        step: session.step,
        draft: (session.draftJson as OnboardingDraft) || {},
        currentOrgName: entity?.name || '',
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get session';
    return { success: false, error: message };
  }
}

/**
 * Update onboarding draft
 */
export async function updateOnboardingDraft(
  step: number,
  draft: OnboardingDraft,
): Promise<ActionResult<void>> {
  try {
    const { entityId } = await getCurrentUser();

    await prisma.onboardingSession.upsert({
      where: { entityId },
      update: {
        step,
        draftJson: draft,
        updatedAt: new Date(),
      },
      create: {
        entityId,
        step,
        draftJson: draft,
      },
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update draft';
    return { success: false, error: message };
  }
}

/**
 * Final creation transaction - create all keys, areas, and mappings
 */
export async function createOnboardingKeys(): Promise<ActionResult<void>> {
  try {
    const { entityId } = await getCurrentUser();

    const session = await prisma.onboardingSession.findUnique({
      where: { entityId },
    });

    if (!session || !session.draftJson) {
      return { success: false, error: 'No draft found' };
    }

    const draft = session.draftJson as OnboardingDraft;

    // Idempotency check
    const existingKeys = await prisma.keyType.count({ where: { entityId } });
    if (existingKeys > 0) {
      await prisma.onboardingSession.update({
        where: { entityId },
        data: { completedAt: new Date() },
      });
      return { success: false, error: 'Keys already exist' };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update org name (if provided)
      if (draft.orgName) {
        await tx.entity.update({
          where: { id: entityId },
          data: { name: draft.orgName },
        });
      }

      // 2. Create AccessArea records
      const areaMap: Record<string, string> = {}; // name -> id
      for (const areaName of draft.accessAreas || []) {
        const area = await tx.accessArea.create({
          data: { entityId, name: areaName },
        });
        areaMap[areaName] = area.id;
      }

      // 3. Collect all labels
      const allLabels: string[] = [
        ...(draft.letterLabels || []),
        ...(draft.seriesPreset
          ? generateSeries(
              draft.seriesPreset.prefix,
              draft.seriesPreset.from,
              draft.seriesPreset.to,
            )
          : []),
        ...(draft.customLabels || []),
      ];

      // 4. Create KeyType + KeyCopy + KeyTypeAccessArea
      for (const label of allLabels) {
        const displayName = draft.displayNamesMap?.[label] || null;
        const copies = draft.copiesMap?.[label] || 1;
        const areaMappings = draft.areaMappings?.[label] || [];

        const keyType = await tx.keyType.create({
          data: {
            entityId,
            label,
            name: displayName || label,
          },
        });

        // Create copies
        for (let i = 1; i <= copies; i++) {
          await tx.keyCopy.create({
            data: {
              keyTypeId: keyType.id,
              copyNumber: i,
              status: 'AVAILABLE',
            },
          });
        }

        // Create area joins
        for (const areaName of areaMappings) {
          const areaId = areaMap[areaName];
          if (areaId) {
            await tx.keyTypeAccessArea.create({
              data: {
                keyTypeId: keyType.id,
                accessAreaId: areaId,
              },
            });
          }
        }
      }

      // 5. Mark completed
      await tx.onboardingSession.update({
        where: { entityId },
        data: { completedAt: new Date() },
      });
    });

    revalidatePath('/keys');
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create keys';
    return { success: false, error: message };
  }
}

/**
 * Skip onboarding (mark completed without creating keys)
 */
export async function skipOnboarding(): Promise<ActionResult<void>> {
  try {
    const { entityId } = await getCurrentUser();

    await prisma.onboardingSession.upsert({
      where: { entityId },
      update: { completedAt: new Date() },
      create: { entityId, completedAt: new Date() },
    });

    // Revalidate both the keys page and the layout to prevent redirect loop
    revalidatePath('/keys');
    revalidatePath('/', 'layout');

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to skip onboarding';
    return { success: false, error: message };
  }
}
