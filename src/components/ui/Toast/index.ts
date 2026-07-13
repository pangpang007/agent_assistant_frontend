export { ToastProvider } from './ToastProvider';
export { ToastContainer } from './Toast';
export { useToastStore, toast } from './useToast';
export type { ToastItem, ToastType } from './useToast';

import { useToastStore, toast as toastFn } from './useToast';

export function useToast() {
  const addToast = useToastStore((s) => s.addToast);
  const dismiss = useToastStore((s) => s.dismiss);

  return {
    toast: (options: Parameters<typeof addToast>[0]) => addToast(options),
    success: toastFn.success,
    error: toastFn.error,
    warning: toastFn.warning,
    info: toastFn.info,
    dismiss,
  };
}
