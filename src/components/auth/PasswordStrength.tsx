import { getPasswordStrength } from '@/lib/validation';
import './PasswordStrength.css';

interface PasswordStrengthProps {
  password: string;
}

const LABELS = ['', '弱', '中', '强', '非常强'];

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = getPasswordStrength(password);
  if (!password) return null;

  return (
    <div className="password-strength">
      <div className="password-strength__bars">
        {[1, 2, 3, 4].map((level) => (
          <span
            key={level}
            className={`password-strength__bar password-strength__bar--${strength >= level ? strength : 0}`}
          />
        ))}
      </div>
      <span className="password-strength__label">{LABELS[strength]}</span>
    </div>
  );
}
