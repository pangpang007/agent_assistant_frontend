import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToastStore, type ToastItem, type ToastType } from './useToast';
import './Toast.css';

const icons: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

function ToastCard({ item }: { item: ToastItem }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const Icon = icons[item.type];

  return (
    <div
      className={cn('toast', `toast--${item.type}`, item.exiting && 'toast--exiting')}
      role="alert"
    >
      <span className={cn('toast__bar', `toast__bar--${item.type}`)} />
      <Icon className="toast__icon" size={20} strokeWidth={1.5} />
      <div className="toast__content">
        <p className="toast__title">{item.title}</p>
        {item.description && <p className="toast__description">{item.description}</p>}
      </div>
      <button
        type="button"
        className="toast__close"
        onClick={() => dismiss(item.id)}
        aria-label="关闭"
      >
        <X size={14} strokeWidth={1.5} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((item) => (
        <ToastCard key={item.id} item={item} />
      ))}
    </div>
  );
}
