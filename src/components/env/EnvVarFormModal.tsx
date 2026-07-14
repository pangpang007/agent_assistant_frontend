import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import type { EnvVarFormValues, EnvVarType, EnvVariable } from '@/types/phase6';

export interface EnvVarFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: EnvVarFormValues) => Promise<void>;
  editing?: EnvVariable | null;
}

export function EnvVarFormModal({ open, onClose, onSubmit, editing }: EnvVarFormModalProps) {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [type, setType] = useState<EnvVarType>('string');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setKey(editing?.key ?? '');
      setValue('');
      setType(editing?.type ?? 'string');
      setErrors({});
    }
  }, [open, editing]);

  const handleSubmit = async () => {
    const nextErrors: Record<string, string> = {};
    if (!key.trim()) nextErrors.key = '请输入变量名';
    if (!editing && !value.trim()) nextErrors.value = '请输入变量值';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        key: key.trim(),
        value: value.trim() || editing?.value || '',
        type,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? '编辑环境变量' : '新建环境变量'}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            取消
          </Button>
          <Button variant="primary" loading={submitting} onClick={() => void handleSubmit()}>
            保存
          </Button>
        </>
      }
    >
      <div className="phase6-form-stack">
        <div>
          <label className="phase6-form-label">变量名 *</label>
          <Input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="如 OPENAI_API_KEY"
            disabled={Boolean(editing)}
            error={errors.key}
          />
        </div>
        <div>
          <label className="phase6-form-label">类型</label>
          <select
            className="phase2-select"
            value={type}
            onChange={(e) => setType(e.target.value as EnvVarType)}
          >
            <option value="string">字符串</option>
            <option value="secret">Secret（加密存储）</option>
          </select>
        </div>
        <div>
          <label className="phase6-form-label">
            变量值 {editing ? '（留空则不修改）' : '*'}
          </label>
          <Input
            type={type === 'secret' ? 'password' : 'text'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={editing ? '留空保持原值' : '输入变量值'}
            error={errors.value}
          />
        </div>
      </div>
    </Modal>
  );
}
