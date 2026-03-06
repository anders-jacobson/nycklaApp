'use client';

type ToastVariant = 'success' | 'error' | 'info';

export type ToastAction = {
  label: string;
  onClick: () => void;
};

export type ToastItem = {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
  action?: ToastAction;
};

type Subscriber = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
const subscribers = new Set<Subscriber>();

function emit() {
  for (const sub of subscribers) sub(toasts);
}

export function subscribe(sub: Subscriber) {
  subscribers.add(sub);
  // Initial push
  sub(toasts);
  return () => subscribers.delete(sub);
}

export function showToast(input: Omit<ToastItem, 'id'>) {
  const id = Math.random().toString(36).slice(2);
  const item: ToastItem = {
    id,
    variant: 'info',
    durationMs: 3500,
    ...input,
  };
  toasts = [...toasts, item];
  emit();
  const timeout = item.durationMs ?? 3500;
  window.setTimeout(() => {
    removeToast(id);
  }, timeout);
}

export function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function toastSuccess(message: string, description?: string, action?: ToastAction) {
  showToast({ title: message, description, variant: 'success', action });
}

export function toastError(message: string, description?: string) {
  showToast({ title: message, description, variant: 'error', durationMs: 4500 });
}

export function toastInfo(message: string, description?: string) {
  showToast({ title: message, description, variant: 'info' });
}
