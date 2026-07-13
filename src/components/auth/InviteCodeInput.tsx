import { Input } from '@/components/ui/Input';
import './InviteCodeInput.css';

interface InviteCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

export function InviteCodeInput({
  value,
  onChange,
  placeholder = '输入团队邀请码',
  error,
  disabled,
}: InviteCodeInputProps) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value.toUpperCase())}
      placeholder={placeholder}
      error={error}
      disabled={disabled}
      size="md"
      fullWidth
      className="invite-code-input"
    />
  );
}
