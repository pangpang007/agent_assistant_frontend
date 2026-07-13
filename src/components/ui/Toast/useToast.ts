import { create } from 'zustand';
import { generateId } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  exiting?: boolean;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (options: Omit<ToastItem, 'id' | 'exiting'>) => string;
  dismiss: (id: string) => void;
  markExiting: (id: string) => void;
  remove: (id: string) => void;
}

const MAX_TOASTS = 5;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  addToast: (options) => {
    const id = generateId();
    set((state) => {
      let toasts = [{ ...options, id, exiting: false }, ...state.toasts];
      if (toasts.length > MAX_TOASTS) {
        toasts = toasts.slice(0, MAX_TOASTS);
      }
      return { toasts };
    });
    const duration = options.duration ?? 3000;
    if (duration > 0) {
      window.setTimeout(() => get().dismiss(id), duration);
    }
    return id;
  },
  dismiss: (id) => {
    get().markExiting(id);
    window.setTimeout(() => get().remove(id), 200);
  },
  markExiting: (id) => {
    set((state) => ({
      toasts: state.toasts.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
    }));
  },
  remove: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));

export function toast(options: Omit<ToastItem, 'id' | 'exiting'>) {
  return useToastStore.getState().addToast(options);
}

toast.success = (title: string, description?: string) =>
  toast({ type: 'success', title, description });
toast.error = (title: string, description?: string) =>
  toast({ type: 'error', title, description });
toast.warning = (title: string, description?: string) =>
  toast({ type: 'warning', title, description });
toast.info = (title: string, description?: string) =>
  toast({ type: 'info', title, description });
toast.dismiss = (id: string) => useToastStore.getState().dismiss(id);
