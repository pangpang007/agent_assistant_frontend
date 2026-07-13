import { useEffect, useState, type FormEvent } from 'react';
import { useBlocker, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { SwaggerImporter } from '@/components/tools/SwaggerImporter';
import { FormSelect } from '@/components/shared/FormSelect';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import {
  getApiErrorMessage,
  validateApiUrl,
  validateToolDescription,
  validateToolName,
} from '@/lib/validation';
import { toolService } from '@/services/toolService';
import type { AuthType, SwaggerParseResult, ToolParameter, ToolParameterType } from '@/types';
import '@/styles/phase2.css';
import './ToolFormPage.css';

const AUTH_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'api_key', label: 'API Key' },
  { value: 'bearer', label: 'Bearer Token' },
];

const PARAM_TYPES: ToolParameterType[] = ['string', 'integer', 'number', 'boolean', 'array', 'object'];

export default function ToolFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const isEdit = Boolean(id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [authType, setAuthType] = useState<AuthType>('none');
  const [keyName, setKeyName] = useState('');
  const [bearerToken, setBearerToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [parameters, setParameters] = useState<ToolParameter[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isDirty, setIsDirty] = useState(false);

  const blocker = useBlocker(isDirty && !isSubmitting);

  useEffect(() => {
    if (!isEdit || !id) return;
    void (async () => {
      setIsLoading(true);
      try {
        const tool = await toolService.getById(id);
        setName(tool.name);
        setDescription(tool.description);
        setApiUrl(tool.api_url ?? '');
        setAuthType(tool.auth_type);
        setParameters(tool.parameters);
      } catch {
        toastError('工具不存在');
        navigate('/tools', { replace: true });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id, isEdit, navigate, toastError]);

  const markDirty = () => setIsDirty(true);

  const handleParsed = (data: SwaggerParseResult) => {
    setName(data.name);
    setDescription(data.description);
    setApiUrl(data.api_url);
    setParameters(data.parameters);
    markDirty();
  };

  const updateParam = (index: number, patch: Partial<ToolParameter>) => {
    setParameters((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
    markDirty();
  };

  const addParam = () => {
    setParameters((prev) => [
      ...prev,
      { name: '', type: 'string', required: false, description: '' },
    ]);
    markDirty();
  };

  const removeParam = (index: number) => {
    setParameters((prev) => prev.filter((_, i) => i !== index));
    markDirty();
  };

  const validate = () => {
    const next: Record<string, string> = {};
    const nameErr = validateToolName(name);
    if (nameErr) next.name = nameErr;
    const descErr = validateToolDescription(description);
    if (descErr) next.description = descErr;
    const urlErr = validateApiUrl(apiUrl);
    if (urlErr) next.apiUrl = urlErr;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const fullUrl = apiUrl.startsWith('http') ? apiUrl : `https://${apiUrl}`;

    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        api_url: fullUrl,
        auth_type: authType,
        auth_config:
          authType === 'api_key'
            ? { key_name: keyName }
            : authType === 'bearer'
              ? { token: bearerToken }
              : undefined,
        parameters,
      };

      if (isEdit && id) {
        await toolService.update(id, payload);
        success('工具更新成功');
      } else {
        await toolService.create(payload);
        success('工具创建成功');
      }
      setIsDirty(false);
      navigate('/tools');
    } catch (err) {
      toastError(getApiErrorMessage(err, '保存失败'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="phase2-page phase2-page--form">
        <Skeleton variant="rectangular" height={400} />
      </div>
    );
  }

  return (
    <div className="phase2-page phase2-page--form">
      <button type="button" className="phase2-back" onClick={() => navigate('/tools')}>
        <ArrowLeft size={16} /> 返回工具列表
      </button>

      <h1 className="phase2-header__title">{isEdit ? '编辑工具' : '创建自定义工具'}</h1>
      <p className="phase2-header__desc">通过 OpenAPI 规范导入或直接配置</p>

      <form onSubmit={(e) => void handleSubmit(e)}>
        {!isEdit && (
          <Card padding="md" className="phase2-form-section">
            <h2 className="phase2-form-section__title">导入方式</h2>
            <SwaggerImporter onParsed={handleParsed} />
          </Card>
        )}

        <Card padding="md" className="phase2-form-section">
          <h2 className="phase2-form-section__title">工具信息</h2>
          <Input
            label="工具名称 *"
            size="md"
            fullWidth
            value={name}
            error={errors.name}
            onChange={(e) => {
              setName(e.target.value);
              markDirty();
            }}
          />
          <Input
            label="描述 *"
            size="md"
            fullWidth
            wrapperClassName="tool-form__gap"
            value={description}
            error={errors.description}
            onChange={(e) => {
              setDescription(e.target.value);
              markDirty();
            }}
          />
          <Input
            label="API 地址 *"
            size="md"
            fullWidth
            prefix="https://"
            wrapperClassName="tool-form__gap"
            placeholder="api.example.com/v1"
            value={apiUrl.replace(/^https?:\/\//, '')}
            error={errors.apiUrl}
            onChange={(e) => {
              setApiUrl(e.target.value);
              markDirty();
            }}
          />
          <div className="tool-form__gap">
            <FormSelect
              label="认证方式"
              value={authType}
              options={AUTH_OPTIONS}
              onChange={(v) => {
                setAuthType(v as AuthType);
                markDirty();
              }}
            />
          </div>
          {authType === 'api_key' && (
            <Input
              label="Key 名称"
              size="md"
              fullWidth
              wrapperClassName="tool-form__gap"
              placeholder="如 X-API-Key"
              helperText="HTTP Header 中传递 API Key 的字段名"
              value={keyName}
              onChange={(e) => {
                setKeyName(e.target.value);
                markDirty();
              }}
            />
          )}
          {authType === 'bearer' && (
            <Input
              label="Token"
              size="md"
              fullWidth
              type={showToken ? 'text' : 'password'}
              wrapperClassName="tool-form__gap"
              placeholder="输入 Bearer Token"
              value={bearerToken}
              rightIcon={
                <button type="button" className="tool-form__eye" onClick={() => setShowToken((v) => !v)}>
                  {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              onChange={(e) => {
                setBearerToken(e.target.value);
                markDirty();
              }}
            />
          )}
        </Card>

        <Card padding="md" className="phase2-form-section">
          <h2 className="phase2-form-section__title">接口参数</h2>
          <div className="tool-form__params">
            <div className="tool-form__params-header">
              <span>参数名</span>
              <span>类型</span>
              <span>必填</span>
              <span>描述</span>
              <span />
            </div>
            {parameters.map((param, index) => (
              <div key={index} className="tool-form__params-row">
                <Input
                  size="sm"
                  value={param.name}
                  onChange={(e) => updateParam(index, { name: e.target.value })}
                />
                <select
                  className="phase2-select"
                  value={param.type}
                  onChange={(e) => updateParam(index, { type: e.target.value as ToolParameterType })}
                >
                  {PARAM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <input
                  type="checkbox"
                  checked={param.required}
                  onChange={(e) => updateParam(index, { required: e.target.checked })}
                />
                <Input
                  size="sm"
                  value={param.description}
                  onChange={(e) => updateParam(index, { description: e.target.value })}
                />
                <Button variant="ghost" size="sm" type="button" onClick={() => removeParam(index)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="secondary" size="sm" type="button" leftIcon={<Plus size={14} />} onClick={addParam}>
            添加参数
          </Button>
        </Card>

        <div className="phase2-form-actions">
          <Button variant="ghost" type="button" onClick={() => navigate('/tools')}>
            取消
          </Button>
          <Button variant="primary" type="submit" loading={isSubmitting}>
            保存工具
          </Button>
        </div>
      </form>

      <Modal
        open={blocker.state === 'blocked'}
        onClose={() => {
          if (blocker.state === 'blocked') blocker.reset();
        }}
        title="未保存的更改"
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                if (blocker.state === 'blocked') blocker.reset();
              }}
            >
              留在此页
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setIsDirty(false);
                if (blocker.state === 'blocked') blocker.proceed();
              }}
            >
              离开
            </Button>
          </>
        }
      >
        <p>你还有未保存的更改，确定要离开吗？</p>
      </Modal>
    </div>
  );
}
