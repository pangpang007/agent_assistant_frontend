import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface SecretMaskProps {
  value: string;
  visibleChars?: number;
}

export function SecretMask({ value, visibleChars = 0 }: SecretMaskProps) {
  const [revealed, setRevealed] = useState(false);
  const masked = '•'.repeat(Math.max(8, value.length));

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
      <span className="phase6-mono">{revealed ? value : masked.slice(0, Math.max(8, visibleChars || 8))}</span>
      <button
        type="button"
        className="modal__close"
        style={{ padding: 2 }}
        onClick={() => setRevealed((v) => !v)}
        aria-label={revealed ? '隐藏' : '显示'}
      >
        {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </span>
  );
}
