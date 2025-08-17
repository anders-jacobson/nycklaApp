import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { createKeyType, updateKeyType, deleteKeyType } from '@/app/actions/keyTypes';

import { KeyTypesTable } from '@/components/keys/key-types-table';

async function getCurrentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) throw new Error('Not authenticated');
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true },
  });
  if (!dbUser) throw new Error('User not found');
  return dbUser.id;
}

async function getKeyTypes() {
  const userId = await getCurrentUserId();
  const keyTypes = await prisma.keyType.findMany({
    where: { userId },
    orderBy: [{ label: 'asc' }],
    include: {
      keyCopies: { select: { id: true } },
    },
  });
  return keyTypes.map((kt) => ({
    id: kt.id,
    label: kt.label,
    name: kt.function,
    accessArea: kt.accessArea ?? '',
    copies: kt.keyCopies.length,
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

export default async function Page() {
  const keyTypes = await getKeyTypes();

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <KeyTypesTable
              data={keyTypes}
              updateAction={updateKeyTypeAction}
              deleteAction={deleteKeyTypeAction}
              createAction={createKeyTypeAction}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
