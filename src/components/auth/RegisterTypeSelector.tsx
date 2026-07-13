import { User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RegisterType } from '@/types';
import './RegisterTypeSelector.css';

interface RegisterTypeSelectorProps {
  value: RegisterType;
  onChange: (value: RegisterType) => void;
}

export function RegisterTypeSelector({ value, onChange }: RegisterTypeSelectorProps) {
  const options: Array<{
    type: RegisterType;
    icon: typeof User;
    title: string;
    description: string;
  }> = [
    {
      type: 'personal',
      icon: User,
      title: '个人',
      description: '创建个人账户，使用全部功能',
    },
    {
      type: 'team',
      icon: Users,
      title: '团队',
      description: '创建团队，邀请成员协作',
    },
  ];

  return (
    <div className="register-type-selector">
      {options.map(({ type, icon: Icon, title, description }) => (
        <button
          key={type}
          type="button"
          className={cn('register-type-selector__option', value === type && 'is-selected')}
          onClick={() => onChange(type)}
        >
          <Icon size={20} strokeWidth={1.5} />
          <span>
            <span className="register-type-selector__title">{title}</span>
            <span className="register-type-selector__desc">{description}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
