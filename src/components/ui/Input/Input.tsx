import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import './Input.css';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize;
  label?: string;
  error?: string | boolean;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  prefix?: string;
  suffix?: string;
  className?: string;
  wrapperClassName?: string;
}

export function Input({
  size = 'md',
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  prefix,
  suffix,
  className,
  wrapperClassName,
  disabled,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? (label ? `input-${label}` : undefined);
  const hasError = Boolean(error);

  return (
    <div className={cn('input-field', fullWidth && 'input-field--full', wrapperClassName)}>
      {label && (
        <label htmlFor={inputId} className="input-field__label">
          {label}
        </label>
      )}
      <div
        className={cn(
          'input-field__control',
          `input-field__control--${size}`,
          hasError && 'input-field__control--error',
          disabled && 'input-field__control--disabled',
        )}
      >
        {prefix && <span className="input-field__affix input-field__affix--prefix">{prefix}</span>}
        {leftIcon && <span className="input-field__icon input-field__icon--left">{leftIcon}</span>}
        <input
          id={inputId}
          className={cn('input-field__input', className)}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          {...props}
        />
        {rightIcon && (
          <span className="input-field__icon input-field__icon--right">{rightIcon}</span>
        )}
        {suffix && <span className="input-field__affix input-field__affix--suffix">{suffix}</span>}
      </div>
      {hasError && typeof error === 'string' && (
        <p className="input-field__error">{error}</p>
      )}
      {helperText && !hasError && <p className="input-field__helper">{helperText}</p>}
    </div>
  );
}
