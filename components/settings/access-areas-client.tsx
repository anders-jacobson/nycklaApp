'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { IconPlus, IconEdit, IconTrash, IconAlertCircle } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import type { AccessAreaData } from '@/app/actions/accessAreas';
import { useTranslations } from 'next-intl';

type Props = {
  areas: AccessAreaData[];
  createAction: (formData: FormData) => Promise<void>;
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
};

function AddAreaDialog({ createAction }: { createAction: (formData: FormData) => Promise<void> }) {
  const t = useTranslations('settings');
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const handleCreate = (formData: FormData) => {
    startTransition(async () => {
      await createAction(formData);
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1">
          <IconPlus className="h-3.5 w-3.5" />
          {t('accessAdd')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('accessAddTitle')}</DialogTitle>
        </DialogHeader>
        <form action={handleCreate} className="grid gap-3">
          <Input name="name" placeholder={t('accessPlaceholder')} required minLength={1} />
          <DialogFooter>
            <Button type="submit">{t('accessAddButton')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditAreaDialog({
  area,
  updateAction,
}: {
  area: AccessAreaData;
  updateAction: (formData: FormData) => Promise<void>;
}) {
  const t = useTranslations('settings');
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const handleUpdate = (formData: FormData) => {
    startTransition(async () => {
      await updateAction(formData);
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <IconEdit className="h-3.5 w-3.5" />
          <span className="sr-only">Edit</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('accessEditTitle')}</DialogTitle>
        </DialogHeader>
        <form action={handleUpdate} className="grid gap-3">
          <input type="hidden" name="id" value={area.id} />
          <Input name="name" defaultValue={area.name} required minLength={1} />
          <DialogFooter>
            <Button type="submit">{t('accessSave')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteAreaDialog({
  area,
  deleteAction,
}: {
  area: AccessAreaData;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  const t = useTranslations('settings');
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const handleDelete = (formData: FormData) => {
    startTransition(async () => {
      await deleteAction(formData);
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        >
          <IconTrash className="h-3.5 w-3.5" />
          <span className="sr-only">Delete</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('accessDeleteTitle')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p>{t('accessConfirmDelete', { name: area.name })}</p>
          {area._count.keyTypes > 0 && (
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <IconAlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{t('accessAssociatedWarning', { count: area._count.keyTypes })}</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t('accessCancel')}
          </Button>
          <form action={handleDelete}>
            <input type="hidden" name="id" value={area.id} />
            <Button type="submit" variant="destructive">
              {t('accessDelete')}
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AccessAreasClient({ areas, createAction, updateAction, deleteAction }: Props) {
  const t = useTranslations('settings');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t('accessHeading')}</h2>
          <p className="text-sm text-muted-foreground">{t('accessDescription')}</p>
        </div>
        <AddAreaDialog createAction={createAction} />
      </div>

      <Separator />

      {areas.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">{t('accessEmpty')}</p>
      ) : (
        <div className="space-y-1">
          {areas.map((area) => (
            <div
              key={area.id}
              className="flex items-center justify-between py-2 px-3 rounded-md border"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{area.name}</span>
                {area.keyTypes.map(({ keyType }) => (
                  <Badge key={keyType.id} variant="secondary" className="font-mono text-xs">
                    {keyType.label}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-1 ml-2 shrink-0">
                <EditAreaDialog area={area} updateAction={updateAction} />
                <DeleteAreaDialog area={area} deleteAction={deleteAction} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
