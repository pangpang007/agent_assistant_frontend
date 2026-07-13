import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useBlocker, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Database } from 'lucide-react';
import { TemperatureSlider } from '@/components/agents/TemperatureSlider';
import { ToolMultiSelect } from '@/components/agents/ToolMultiSelect';
import { FormSelect } from '@/components/shared/FormSelect';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { OUTPUT_FORMAT_LABELS } from '@/lib/phase2Constants';
import {
  getApiErrorMessage,
  getApiErrorStatus,
  validateAgentDescription,
  validateAgentName,
  validateSystemPrompt,
} from '@/lib/validation';
import { agentService } from '@/services/agentService';
import { modelService } from '@/services/modelService';
import { toolService } from '@/services/toolService';
import type { EnabledModel, MemoryStrategy, OutputFormat, Tool } from '@/types';
import { cn } from '@/lib/utils';
import '@/styles/phase2.css';
import './AgentFormPage.css';

const MEMORY_OPTIONS: { value: MemoryStrategy; label: string; desc: string }[] = [
  { value: 'none', label: '无记忆', desc: '每次对话独立' },
  { value: 'window', label: '窗口记忆', desc: '保留最近 N 轮' },
  { value: 'summary', label: '摘要记忆', desc: '自动总结历史' },
];

export default function AgentFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const isEdit = Boolean(id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [modelId, setModelId] = useState('');
  const [toolIds, setToolIds] = useState<string[]>([]);
  const [memoryStrategy, setMemoryStrategy] = useState<MemoryStrategy>('window');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('markdown');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isDirty, setIsDirty] = useState(false);

  const [models, setModels] = useState<EnabledModel[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);

  const blocker = useBlocker(isDirty && !isSubmitting);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    void (async () => {
      try {
        const [modelsRes, toolsRes] = await Promise.all([
          modelService.getEnabledModels(),
          toolService.getList(),
        ]);
        setModels(modelsRes.models);
        setTools(toolsRes.tools);
      } catch {
        toastError('加载模型或工具列表失败');
      }
    })();
  }, [toastError]);

  useEffect(() => {
    if (!isEdit || !id) return;
    void (async () => {
      setIsLoading(true);
      try {
        const agent = await agentService.getById(id);
        setName(agent.name);
        setDescription(agent.description);
        setSystemPrompt(agent.system_prompt);
        setModelId(agent.model_id);
        setToolIds(agent.tool_ids);
        setMemoryStrategy(agent.memory_strategy);
        setOutputFormat(agent.output_format);
        setTemperature(agent.temperature);
        setMaxTokens(agent.max_tokens);
      } catch {
        toastError('Agent 不存在');
        navigate('/agents', { replace: true });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id, isEdit, navigate, toastError]);

  const markDirty = () => setIsDirty(true);

  const modelOptions = useMemo(
    () =>
      models.map((m) => ({
        value: m.id,
        label: m.name,
        group: m.supplier_name,
      })),
    [models],
  );

  const validate = () => {
    const next: Record<string, string> = {};
    const nameErr = validateAgentName(name);
    if (nameErr) next.name = nameErr;
    const descErr = validateAgentDescription(description);
    if (descErr) next.description = descErr;
    const promptErr = validateSystemPrompt(systemPrompt);
    if (promptErr) next.systemPrompt = promptErr;
    if (!modelId) next.modelId = '请选择模型';
    if (maxTokens < 1 || maxTokens > 128000) next.maxTokens = 'Max Tokens 需在 1-128000 之间';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      document.getElementById('agent-name')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSubmitting(true);
    const payload = {
      name: name.trim(),
      description: description.trim(),
      system_prompt: systemPrompt.trim(),
      model_id: modelId,
      tool_ids: toolIds,
      knowledge_base_ids: [],
      memory_strategy: memoryStrategy,
      output_format: outputFormat,
      temperature,
      max_tokens: maxTokens,
    };

    try {
      if (isEdit && id) {
        await agentService.update(id, payload);
        success('Agent 更新成功');
      } else {
        await agentService.create(payload);
        success('Agent 创建成功');
      }
      setIsDirty(false);
      navigate('/agents');
    } catch (err) {
      if (getApiErrorStatus(err) === 409) {
        setErrors({ name: '该名称已被使用' });
        toastError('已存在同名 Agent，请使用其他名称');
      } else {
        toastError(getApiErrorMessage(err, '保存失败'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    !validateAgentName(name) &&
    !validateAgentDescription(description) &&
    !validateSystemPrompt(systemPrompt) &&
    Boolean(modelId);

  if (isLoading) {
    return (
      <div className="phase2-page phase2-page--form">
        <Skeleton variant="rectangular" height={32} />
        <Skeleton variant="rectangular" height={200} className="agent-form__skeleton" />
      </div>
    );
  }

  return (
    <div className="phase2-page phase2-page--form">
      <button type="button" className="phase2-back" onClick={() => navigate('/agents')}>
        <ArrowLeft size={16} /> 返回 Agent 列表
      </button>

      <h1 className="phase2-header__title">{isEdit ? '编辑 Agent' : '创建 Agent'}</h1>
      <p className="phase2-header__desc">
        {isEdit ? '修改 Agent 的配置，保存后生效' : '配置 Agent 的角色、模型、工具和参数'}
      </p>

      <form onSubmit={(e) => void handleSubmit(e)}>
        <Card padding="md" className="phase2-form-section">
          <h2 className="phase2-form-section__title">基本信息</h2>
          <Input
            id="agent-name"
            label="名称 *"
            size="md"
            fullWidth
            placeholder="输入 Agent 名称"
            value={name}
            error={errors.name}
            onChange={(e) => {
              setName(e.target.value);
              markDirty();
            }}
            onBlur={() => {
              const err = validateAgentName(name);
              setErrors((prev) => ({ ...prev, name: err ?? '' }));
            }}
          />
          <Input
            label="描述 *"
            size="md"
            fullWidth
            placeholder="简要描述这个 Agent 的功能"
            value={description}
            error={errors.description}
            wrapperClassName="agent-form__field-gap"
            onChange={(e) => {
              setDescription(e.target.value);
              markDirty();
            }}
          />
          <div className="agent-form__field-gap">
            <label className="phase2-field-label" htmlFor="system-prompt">
              角色描述 / System Prompt *
            </label>
            <textarea
              id="system-prompt"
              className={cn('phase2-textarea', errors.systemPrompt && 'phase2-textarea--error')}
              placeholder={'你是一个专注于前端开发的工程师...\n\n你的职责包括：\n1. 分析用户需求\n2. 生成高质量代码'}
              value={systemPrompt}
              onChange={(e) => {
                setSystemPrompt(e.target.value);
                markDirty();
              }}
            />
            {errors.systemPrompt && <p className="phase2-field-error">{errors.systemPrompt}</p>}
            <p className="phase2-field-helper">定义 Agent 的角色、行为和输出要求。越详细的描述，Agent 的表现越好。</p>
            <p className="phase2-char-count">{systemPrompt.length}/10000</p>
          </div>
        </Card>

        <Card padding="md" className="phase2-form-section">
          <h2 className="phase2-form-section__title">模型与工具</h2>
          <FormSelect
            label="模型选择 *"
            value={modelId}
            options={modelOptions}
            error={errors.modelId}
            onChange={(v) => {
              setModelId(v);
              markDirty();
            }}
            emptyHint={
              <span>
                暂无可用模型，请先在设置中{' '}
                <Link to="/settings/models">配置模型供应商</Link>
              </span>
            }
          />
          <div className="agent-form__field-gap">
            <label className="phase2-field-label">挂载工具</label>
            <ToolMultiSelect availableTools={tools} selectedToolIds={toolIds} onChange={(ids) => { setToolIds(ids); markDirty(); }} />
          </div>
          <div className="agent-form__kb-placeholder">
            <Database size={16} />
            <span>暂不可用 — 知识库功能即将上线</span>
          </div>
        </Card>

        <Card padding="md" className="phase2-form-section">
          <h2 className="phase2-form-section__title">高级设置</h2>
          <label className="phase2-field-label">记忆策略</label>
          <div className="agent-form__radio-group">
            {MEMORY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={cn('agent-form__radio', memoryStrategy === opt.value && 'agent-form__radio--selected')}
                onClick={() => {
                  setMemoryStrategy(opt.value);
                  markDirty();
                }}
              >
                <span className="agent-form__radio-dot" />
                <span>
                  <strong>{opt.label}</strong>
                  <span className="agent-form__radio-desc">{opt.desc}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="agent-form__field-gap">
            <FormSelect
              label="输出格式"
              value={outputFormat}
              options={Object.entries(OUTPUT_FORMAT_LABELS).map(([value, label]) => ({ value, label }))}
              onChange={(v) => {
                setOutputFormat(v as OutputFormat);
                markDirty();
              }}
            />
          </div>

          <div className="agent-form__field-gap">
            <TemperatureSlider value={temperature} onChange={(v) => { setTemperature(v); markDirty(); }} />
          </div>

          <Input
            label="Max Tokens"
            type="number"
            size="md"
            fullWidth
            min={1}
            max={128000}
            placeholder="4096"
            value={maxTokens}
            error={errors.maxTokens}
            helperText="模型单次输出的最大 Token 数量"
            wrapperClassName="agent-form__field-gap"
            onChange={(e) => {
              setMaxTokens(Number(e.target.value));
              markDirty();
            }}
          />
        </Card>

        <div className="phase2-form-actions">
          <Button variant="ghost" type="button" onClick={() => navigate('/agents')}>
            取消
          </Button>
          <Button variant="primary" type="submit" loading={isSubmitting} disabled={!isFormValid || isSubmitting}>
            {isEdit ? '更新 Agent' : '保存 Agent'}
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
