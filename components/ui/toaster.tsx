'use client';

import { useEffect, useState } from 'react';
import { subscribe, ToastItem, removeToast } from './toast-store';
import { Card } from './card';
import { Button } from './button';

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsub = subscribe(setItems);
    return () => {
      unsub();
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {items.map((t) => (
        <Card key={t.id} className={`p-3 min-w-64 max-w-md ${variantClass(t.variant)}`}>
          <div className="flex items-start gap-3">
            <div className="flex-1">
              {t.title && <div className="font-medium">{t.title}</div>}
              {t.description && (
                <div className="text-sm text-muted-foreground mt-1">{t.description}</div>
              )}
              {t.action && (
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      t.action?.onClick();
                      removeToast(t.id);
                    }}
                  >
                    {t.action.label}
                  </Button>
                </div>
              )}
            </div>
            <Button size="sm" variant="ghost" onClick={() => removeToast(t.id)}>
              ✕
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function variantClass(variant?: string) {
  switch (variant) {
    case 'success':
      return 'border-green-200 bg-green-50';
    case 'error':
      return 'border-red-200 bg-red-50';
    default:
      return '';
  }
}
