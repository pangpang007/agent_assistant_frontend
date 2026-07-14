import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useWorkflowEditorStore } from '@/stores/workflowEditorStore';

export interface RunConfigInputVariable {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
  default?: string;
}

interface RunConfigModalProps {
  open: boolean;
  onClose: () => void;
  inputVariables: RunConfigInputVariable[];
  onStart: (values: Record<string, unknown>) => Promise<void>;
}

type FormValues = Record<string, string>;
type FormErrors = Record<string, string>;

function initialValues(variables: RunConfigInputVariable[]): FormValues {
  const values: FormValues = {};
  variables.forEach((v) => {
    values[v.name] = v.default ?? '';
  });
  return values;
}

function validateField(variable: RunConfigInputVariable, raw: string): string | null {
  const trimmed = raw.trim();
  if (variable.required && !trimmed) {
    return `${variable.name} 不能为空`;
  }
  if (!trimmed) return null;

  if (variable.type === 'number') {
    if (Number.isNaN(Number(trimmed))) return '请输入有效数字';
  }
  if (variable.type === 'json') {
    try {
      JSON.parse(trimmed);
    } catch (e) {
      return `JSON 格式错误：${e instanceof Error ? e.message : '无效 JSON'}`;
    }
  }
  return null;
}

function coerceValue(variable: RunConfigInputVariable, raw: string): unknown {
  const trimmed = raw.trim();
  if (!trimmed) return variable.type === 'boolean' ? false : '';
  switch (variable.type) {
    case 'number':
      return Number(trimmed);
    case 'boolean':
      return trimmed === 'true' || trimmed === '1';
    case 'json':
      return JSON.parse(trimmed) as unknown;
    default:
      return trimmed;
  }
}

export function RunConfigModal({ open, onClose, inputVariables, onStart }: RunConfigModalProps) {
  const workflowName = useWorkflowEditorStore((s) => s.workflowName);
  const currentVersionNumber = useWorkflowEditorStore((s) => s.currentVersionNumber);

  const [values, setValues] = useState<FormValues>(() => initialValues(inputVariables));
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(initialValues(inputVariables));
      setErrors({});
    }
  }, [open, inputVariables]);

  const requiredMissing = useMemo(() => {
    return inputVariables.some((v) => v.required && !values[v.name]?.trim());
  }, [inputVariables, values]);

  const handleSubmit = async () => {
    const nextErrors: FormErrors = {};
    inputVariables.forEach((v) => {
      const err = validateField(v, values[v.name] ?? '');
      if (err) nextErrors[v.name] = err;
    });
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const payload: Record<string, unknown> = {};
    inputVariables.forEach((v) => {
      payload[v.name] = coerceValue(v, values[v.name] ?? '');
    });

    setLoading(true);
    try {
      await onStart(payload);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const renderField = useCallback(
    (variable: RunConfigInputVariable) => {
      const value = values[variable.name] ?? '';
      const error = errors[variable.name];

      if (variable.type === 'boolean') {
        return (
          <label className="run-config-modal__boolean">
            <input
              type="checkbox"
              checked={value === 'true'}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [variable.name]: e.target.checked ? 'true' : 'false' }))
              }
            />
            <span>{variable.description ?? '开启'}</span>
          </label>
        );
      }

      if (variable.type === 'json') {
        return (
          <textarea
            className="run-config-modal__json"
            value={value}
            placeholder='{"key": "value"}'
            onChange={(e) => setValues((prev) => ({ ...prev, [variable.name]: e.target.value }))}
          />
        );
      }

      return (
        <Input
          size="sm"
          type={variable.type === 'number' ? 'number' : 'text'}
          value={value}
          error={error}
          onChange={(e) => setValues((prev) => ({ ...prev, [variable.name]: e.target.value }))}
        />
      );
    },
    [errors, values],
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="运行配置"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            取消
          </Button>
          <Button
            variant="primary"
            loading={loading}
            disabled={requiredMissing}
            onClick={() => void handleSubmit()}
          >
            开始执行
          </Button>
        </>
      }
    >
      <div className="run-config-modal__meta">
        <div>工作流: {workflowName}</div>
        <div>版本: v{currentVersionNumber}</div>
      </div>

      {inputVariables.length === 0 ? (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          开始节点未定义输入变量，将直接运行。
        </p>
      ) : (
        <>
          <div className="execution-panel__section-title">输入参数</div>
          {inputVariables.map((variable) => (
            <div key={variable.name} className="run-config-modal__field">
              <div className="run-config-modal__field-label">
                {variable.name}
                {variable.required ? <span style={{ color: 'var(--accent-danger)' }}>*</span> : null}
              </div>
              {variable.description ? (
                <div className="run-config-modal__field-desc">{variable.description}</div>
              ) : null}
              {renderField(variable)}
              {errors[variable.name] && variable.type !== 'string' && variable.type !== 'number' ? (
                <p className="input-field__error">{errors[variable.name]}</p>
              ) : null}
            </div>
          ))}
        </>
      )}
    </Modal>
  );
}
