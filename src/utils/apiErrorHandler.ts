import { toast } from '@/components/ui/Toast';
import { getApiErrorMessage } from '@/lib/validation';

/** Unified list-page API error toast. */
export function handleApiError(error: unknown, context: string): void {
  toast.error(`${context}失败：${getApiErrorMessage(error, '未知错误')}`);
}
