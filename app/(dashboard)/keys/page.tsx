import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-utils';
import {
  createKeyType,
  updateKeyType,
  deleteKeyType,
  addKeyCopy,
  markAvailableCopyLost,
  markLostCopyFound,
} from '@/app/actions/keyTypes';
import { getKeyStatusSummary } from '@/app/actions/dashboard';
import KeyChart from '@/components/shared/chart-bar';
import TotalStatusPieChart from '@/components/shared/chart-pie';
import { KeyTypesTable } from '@/components/keys/key-types-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IconKey, IconInfoCircle } from '@tabler/icons-react';
import { getBorrowerDetails } from '@/lib/borrower-utils';
import { shouldShowOnboarding } from '@/lib/onboarding-utils';

async function getKeyTypes() {
  const { entityId } = await getCurrentUser();

  // Check if onboarding is needed
  const needsOnboarding = await shouldShowOnboarding(entityId);
  if (needsOnboarding) {
    redirect('/onboarding/keys');
  }

  const keyTypes = await prisma.keyType.findMany({
    where: { entityId },
    orderBy: [{ label: 'asc' }],
    include: {
      keyCopies: {
        select: {
          id: true,
          copyNumber: true,
          status: true,
          issueRecords: {
            where: { returnedDate: null },
            select: {
              borrower: {
                select: {
                  id: true,
                  affiliation: true,
                  createdAt: true,
                  entityId: true,
                  residentBorrowerId: true,
                  externalBorrowerId: true,
                  residentBorrower: true,
                  externalBorrower: true,
                },
              },
            },
            take: 1,
          },
        },
        orderBy: { copyNumber: 'asc' },
      },
      accessAreas: {
        include: {
          accessArea: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  // Decrypt borrower names
  const keyTypesWithDecryptedNames = await Promise.all(
    keyTypes.map(async (kt) => {
      const copies = await Promise.all(
        kt.keyCopies.map(async (copy) => {
          let borrowerName = null;
          if (copy.issueRecords[0]?.borrower) {
            try {
              const decryptedBorrower = await getBorrowerDetails(
                copy.issueRecords[0].borrower,
                entityId,
              );
              borrowerName = decryptedBorrower.name;
            } catch (err) {
              console.error('Failed to decrypt borrower name:', err);
              borrowerName = 'Unknown';
            }
          }

          return {
            id: copy.id,
            copyNumber: copy.copyNumber,
            status: copy.status,
            borrower: copy.issueRecords[0]?.borrower
              ? {
                  id: copy.issueRecords[0].borrower.id,
                  name: borrowerName || 'Unknown',
                }
              : null,
          };
        }),
      );

      // Join access area names into comma-separated string for UI compatibility
      const accessAreaNames = kt.accessAreas.map((aa) => aa.accessArea.name).join(', ');

      return {
        id: kt.id,
        label: kt.label,
        name: kt.function,
        accessArea: accessAreaNames,
        copies,
      };
    }),
  );

  return keyTypesWithDecryptedNames;
}

// Wrapper server actions to satisfy form action typing (void return)
async function createKeyTypeAction(formData: FormData) {
  'use server';
  await createKeyType(formData);
}

async function updateKeyTypeAction(formData: FormData) {
  'use server';
  await updateKeyType(formData);
}

async function deleteKeyTypeAction(formData: FormData) {
  'use server';
  await deleteKeyType(formData);
}

async function addKeyCopyAction(formData: FormData) {
  'use server';
  await addKeyCopy(formData);
}

async function markLostAction(formData: FormData) {
  'use server';
  const copyId = formData.get('copyId') as string;
  await markAvailableCopyLost(copyId);
}

async function markFoundAction(formData: FormData) {
  'use server';
  const copyId = formData.get('copyId') as string;
  await markLostCopyFound(copyId);
}

export default async function Page() {
  // Fetch both key types and key status data
  const [keyTypes, keyChartResult] = await Promise.all([getKeyTypes(), getKeyStatusSummary()]);
  const keyChartData = keyChartResult.success ? keyChartResult.data : [];

  // Show empty state for new organisations
  if (keyTypes.length === 0) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <Card>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <IconKey className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>No keys found</CardTitle>
              <CardDescription>
                Get started by creating your first key type for this organisation
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-6">
              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2 text-sm text-muted-foreground text-left">
                  <IconInfoCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Quick Start:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Create a key type (e.g., "A" for apartment keys)</li>
                      <li>Add copies with unique numbers</li>
                      <li>Start tracking who borrows each key</li>
                    </ol>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <KeyTypesTable
            data={keyTypes}
            updateAction={updateKeyTypeAction}
            deleteAction={deleteKeyTypeAction}
            createAction={createKeyTypeAction}
            addCopyAction={addKeyCopyAction}
            markLostAction={markLostAction}
            markFoundAction={markFoundAction}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <TotalStatusPieChart data={keyChartData} />
              <KeyChart data={keyChartData} />
            </div>
          </div>
          <div className="px-4 lg:px-6">
            <KeyTypesTable
              data={keyTypes}
              updateAction={updateKeyTypeAction}
              deleteAction={deleteKeyTypeAction}
              createAction={createKeyTypeAction}
              addCopyAction={addKeyCopyAction}
              markLostAction={markLostAction}
              markFoundAction={markFoundAction}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
