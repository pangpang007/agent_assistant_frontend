import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import './CopyInput.css';

export interface CopyInputProps {
  value: string;
  multiline?: boolean;
  code?: boolean;
  className?: string;
}

export function CopyInput({ value, multiline, code, className }: CopyInputProps) {
  const { success } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      success('已复制到剪贴板');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard may be unavailable in tests
    }
  };

  return (
    <div className={cn('copy-input', className)}>
      {multiline || code ? (
        <pre className={cn('copy-input__value', code && 'copy-input__value--code')}>{value}</pre>
      ) : (
        <span className="copy-input__value copy-input__value--single">{value}</span>
      )}
      <button type="button" className="copy-input__btn" onClick={() => void handleCopy()} aria-label="复制">
        {copied ? <Check size={14} strokeWidth={1.5} /> : <Copy size={14} strokeWidth={1.5} />}
      </button>
    </div>
  );
}
