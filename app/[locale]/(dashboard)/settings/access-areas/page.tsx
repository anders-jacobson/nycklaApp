import { setRequestLocale } from 'next-intl/server';
import {
  getAccessAreas,
  createAccessArea,
  updateAccessArea,
  deleteAccessArea,
} from '@/app/actions/accessAreas';
import { AccessAreasClient } from '@/components/settings/access-areas-client';

async function createAction(formData: FormData) {
  'use server';
  await createAccessArea(formData);
}

async function updateAction(formData: FormData) {
  'use server';
  await updateAccessArea(formData);
}

async function deleteAction(formData: FormData) {
  'use server';
  await deleteAccessArea(formData);
}

export default async function AccessAreasPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'sv' | 'en');
  const result = await getAccessAreas();
  const areas = result.success ? (result.data ?? []) : [];

  return (
    <div className="max-w-2xl">
      <AccessAreasClient
        areas={areas}
        createAction={createAction}
        updateAction={updateAction}
        deleteAction={deleteAction}
      />
    </div>
  );
}
