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

async function getKeyTypes() {
  const { entityId } = await getCurrentUser();
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
                  residentBorrower: {
                    select: {
                      name: true,
                    },
                  },
                  externalBorrower: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
            take: 1,
          },
        },
        orderBy: { copyNumber: 'asc' },
      },
    },
  });
  return keyTypes.map((kt) => ({
    id: kt.id,
    label: kt.label,
    name: kt.function,
    accessArea: kt.accessArea ?? '',
    copies: kt.keyCopies.map((copy) => ({
      id: copy.id,
      copyNumber: copy.copyNumber,
      status: copy.status,
      borrower: copy.issueRecords[0]?.borrower
        ? {
            id: copy.issueRecords[0].borrower.id,
            name:
              copy.issueRecords[0].borrower.residentBorrower?.name ||
              copy.issueRecords[0].borrower.externalBorrower?.name ||
              'Unknown',
          }
        : null,
    })),
  }));
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
  const [keyTypes, keyChartData] = await Promise.all([getKeyTypes(), getKeyStatusSummary()]);

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
