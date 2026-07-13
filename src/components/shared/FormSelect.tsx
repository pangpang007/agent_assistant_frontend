import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClickOutside } from '@/hooks/useClickOutside';
import './FormSelect.css';

export interface FormSelectOption {
  value: string;
  label: string;
  group?: string;
}

export interface FormSelectProps {
  label?: string;
  value: string;
  options: FormSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  emptyHint?: React.ReactNode;
}

export function FormSelect({
  label,
  value,
  options,
  onChange,
  placeholder = '请选择',
  error,
  disabled = false,
  emptyHint,
}: FormSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  const selected = options.find((o) => o.value === value);
  const groups = [...new Set(options.map((o) => o.group).filter(Boolean))] as string[];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="form-select" ref={ref}>
      {label && <label className="phase2-field-label">{label}</label>}
      <button
        type="button"
        className={cn('form-select__trigger', error && 'form-select__trigger--error', disabled && 'form-select__trigger--disabled')}
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
      >
        <span className={cn(!selected && 'form-select__placeholder')}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown size={16} />
      </button>
      {error && <p className="phase2-field-error">{error}</p>}
      {open && (
        <div className="form-select__panel">
          {options.length === 0 && emptyHint ? (
            <div className="form-select__empty">{emptyHint}</div>
          ) : groups.length > 0 ? (
            groups.map((group) => (
              <div key={group}>
                <div className="form-select__group">{group}</div>
                {options
                  .filter((o) => o.group === group)
                  .map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={cn('form-select__option', value === opt.value && 'form-select__option--selected')}
                      onClick={() => {
                        onChange(opt.value);
                        setOpen(false);
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
              </div>
            ))
          ) : (
            options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={cn('form-select__option', value === opt.value && 'form-select__option--selected')}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
